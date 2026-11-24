"""Chicago check-in. Send only to the two public KingsWord Breeze forms."""
import asyncio
import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import time
from collections import Counter
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from uuid import UUID
from zoneinfo import ZoneInfo

from office import initialize_office, router as office_router

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
from pydantic import BaseModel, ConfigDict, Field
from starlette.responses import JSONResponse

HOST = "https://kingswordchicago.breezechms.com"
FORMS = {"attendance": "fc242753", "welcome": "fc2427"}
CONTACT = {"mobile": "phone_mobile", "home": "phone_home", "work": "phone_work",
           "street": "address_street_address", "unit": "address_street_address_line2",
           "city": "address_city", "state": "address_state", "zip": "address_zip"}
CUSTOM = {"country": "Country", "title": "Title", "gender": "Gender", "birth": "Date of birth",
          "ageGroup": "Age Group", "anniversary": "Wedding Anniversary", "grade": "Grade",
          "employment": "Employment Status", "occupation": "Field", "interest": "Membership Interest",
          "campus": "Campus", "group": "Life Group", "team": "Workforce Unit", "training": "Training Class"}
CHICAGO = ZoneInfo("America/Chicago")
ORIGINS = {"https://kaysongt.github.io", "https://chicago.kingsword.org"}
active = asyncio.Semaphore(4)
waiting = 0
rates = Counter()
rate_period = 0

@asynccontextmanager
async def lifespan(app):
    directory = Path(os.environ.get("CHECKIN_DATA", "./data"))
    directory.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(directory / "receipts.db", isolation_level=None)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value BLOB NOT NULL)")
    db.execute("INSERT OR IGNORE INTO settings VALUES ('key', ?)", (secrets.token_bytes(32),))
    app.state.key = db.execute("SELECT value FROM settings WHERE name='key'").fetchone()[0]
    db.execute("""CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY, phase TEXT NOT NULL, stamp INTEGER NOT NULL)""")
    db.execute("DELETE FROM deliveries WHERE stamp < ?", (int(time.time()) - 8*86400,))
    # A restart after clicking Submit must never silently issue a second submission.
    db.execute("DELETE FROM deliveries WHERE phase='opening'")
    initialize_office(db)
    app.state.db = db
    driver = await async_playwright().start()
    app.state.driver = driver
    app.state.browser = None
    app.state.launch_lock = asyncio.Lock()
    yield
    if app.state.browser:
        await app.state.browser.close()
    await driver.stop()
    db.close()

app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(office_router)
app.add_middleware(CORSMiddleware, allow_origins=sorted(ORIGINS), allow_methods=["POST"],
                   allow_headers=["Content-Type"], max_age=3600)

class Submission(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    first: str = Field(min_length=1, max_length=80)
    last: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    device: UUID
    receipt: str = Field(default="", max_length=90)
    details: dict[str, str] = Field(default_factory=dict, max_length=24)

def digest(*parts):
    return hmac.new(app.state.key, "\x00".join(map(str, parts)).encode(), hashlib.sha256).hexdigest()

async def get_browser():
    async with app.state.launch_lock:
        browser = app.state.browser
        if browser is None or not browser.is_connected():
            app.state.browser = await app.state.driver.chromium.launch(
                executable_path=os.environ.get("CHROMIUM_PATH") or None,
                args=["--disable-dev-shm-usage"])
    return app.state.browser

async def prepare_form(page, kind, data):
    await page.goto(f"{HOST}/form/{FORMS[kind]}?embedded=true", wait_until="domcontentloaded", timeout=40000)
    await page.wait_for_function("typeof window.jQuery === 'function' && typeof window.save_person_meta === 'function'")
    form = page.locator("form#custom_form")
    for field, value in (("first_name",data.first),("last_name",data.last),("email_address",data.email)):
        await form.locator(f"input.field_type-{field}:visible").fill(value)
    for key, value in data.details.items():
        if not value.strip():
            continue
        if key in CUSTOM:
            group = form.locator(".avoid_page_break").filter(has=page.get_by_text(CUSTOM[key],exact=True))
            await group.locator("input.field_type-text").fill(value)
        elif key == "state":
            await form.locator("select.field_type-address_state").select_option(value=value)
        else:
            if key == "unit":
                await form.get_by_title("Show Second Street Address Line").click()
            await form.locator(f"input.field_type-{CONTACT[key]}").fill(value)
    submit_button = form.get_by_role("button", name="Submit", exact=True)
    await submit_button.click(trial=True)
    return submit_button

@app.middleware("http")
async def protect(request: Request, call_next):
    if request.method == "POST" and not request.url.path.startswith("/office/"):
        if request.headers.get("origin") not in ORIGINS:
            return JSONResponse({"detail": "Origin unavailable"}, status_code=403)
        if request.headers.get("content-type","").split(";")[0] != "application/json":
            return JSONResponse({}, status_code=415)
        try:
            length = int(request.headers.get("content-length","0"))
        except ValueError:
            length = 0
        if not 0 < length <= 12000:
            return JSONResponse({}, status_code=413)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    if request.url.path.startswith("/office"):
        response.headers.update({
            "Content-Security-Policy": "default-src 'none'; style-src 'self'; img-src 'self' https://kaysongt.github.io; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
            "X-Robots-Tag": "noindex, nofollow",
        })
    return response

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/{kind}")
async def submit(kind: str, data: Submission):
    global rates, rate_period, waiting
    if kind not in FORMS:
        raise HTTPException(404)
    if any(k not in CONTACT and k not in CUSTOM for k in data.details) or any(len(v)>180 for v in data.details.values()):
        raise HTTPException(422, "Invalid optional field")
    stamp = int(time.time())
    day = datetime.now(CHICAGO).date().isoformat()
    who = digest("visitor", data.first.casefold(), data.last.casefold(), data.email.casefold())
    marker = digest("device", who, data.device)
    if kind == "welcome":
        timestamp, _, signature = data.receipt.partition(".")
        if not timestamp.isdigit() or not 0 <= stamp - int(timestamp) <= 7200 or not hmac.compare_digest(signature, digest("receipt", marker, timestamp)):
            raise HTTPException(403, "Check in first")
        if not any(v.strip() for v in data.details.values()):
            raise HTTPException(422, "No details provided")
    elif data.details or data.receipt:
        raise HTTPException(422)
    delivery = digest(kind, who, day)
    db = app.state.db
    if rate_period != stamp // 60:
        rates = Counter()
        rate_period = stamp // 60
        db.execute("DELETE FROM deliveries WHERE stamp < ?", (stamp - 8*86400,))
    rates["all"] += 1
    rates[data.device] += 1
    if rates["all"] > 360 or rates[data.device] > 20:
        raise HTTPException(429, "Please wait a moment")
    row = db.execute("SELECT phase FROM deliveries WHERE id=?", (delivery,)).fetchone()
    def confirmed():
        if kind == "welcome":
            return {"saved": True}
        return {"saved": True, "marker": marker, "receipt": f"{stamp}.{digest('receipt', marker, stamp)}"}
    if row:
        if row[0] == "done":
            return confirmed()
        raise HTTPException(409, "pending")
    if waiting >= 32:
        raise HTTPException(429, "Please wait a moment")
    db.execute("INSERT INTO deliveries VALUES (?, 'opening', ?)", (delivery, stamp))
    waiting += 1
    try:
        await asyncio.wait_for(active.acquire(), timeout=20)
    except TimeoutError:
        db.execute("DELETE FROM deliveries WHERE id=?", (delivery,))
        raise HTTPException(429, "Please wait a moment") from None
    finally:
        waiting -= 1
    context = None
    clicked = False
    try:
        browser = await get_browser()
        context = await browser.new_context()
        page = await context.new_page()
        page.set_default_timeout(12000)
        submit_button = await prepare_form(page, kind, data)
        db.execute("UPDATE deliveries SET phase='sending' WHERE id=?", (delivery,))
        clicked = True
        await submit_button.click()
        # Breeze navigates here only after accepting the form fields.
        await page.wait_for_url(re.compile(re.escape(HOST) + r"/forms/complete/\d+(?:[/?#].*)?$"),
                                wait_until="commit", timeout=25000)
        db.execute("BEGIN")
        try:
            db.execute("UPDATE deliveries SET phase='done' WHERE id=?", (delivery,))
            db.execute('''INSERT INTO office_form_totals(day, kind, total) VALUES(?, ?, 1)
                ON CONFLICT(day, kind) DO UPDATE SET total=total+1''', (day, kind))
            db.execute("COMMIT")
        except Exception:
            db.execute("ROLLBACK")
            raise
        return confirmed()
    except Exception:
        if not clicked:
            db.execute("DELETE FROM deliveries WHERE id=?", (delivery,))
        raise HTTPException(409 if clicked else 503, "pending" if clicked else "Temporarily unavailable") from None
    finally:
        try:
            if context:
                await context.close()
        finally:
            active.release()
