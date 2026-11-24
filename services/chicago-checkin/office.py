"""Private Chicago staff workspace. Chicago invitations are the sole enrollment path."""
import asyncio
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import parse_qs
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Request
from jinja2 import Environment, FileSystemLoader, select_autoescape
from starlette.responses import FileResponse, HTMLResponse, RedirectResponse

router = APIRouter(prefix="/office")
UI = Path(__file__).parent / "office_ui"
templates = Environment(loader=FileSystemLoader(UI), autoescape=select_autoescape(["html"]))
ORIGIN = "https://kingsword-chicago-checkin-production.up.railway.app"
SITE = "https://kaysongt.github.io/kingsword-global"
BREEZE = "https://kingswordchicago.breezechms.com"
TRACKER = "https://docs.google.com/spreadsheets/d/1KwIpRH-pPvpe-tj4V0Rk4tkoMZ086oZ_upFjDLlNg1o/edit"
COOKIE = "__Host-kw-chicago-office"
ROLES = {"office": "Office admin", "leader": "Ministry leader"}
LOCAL = ZoneInfo("America/Chicago")
hash_slots = asyncio.Semaphore(2)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def initialize_office(db):
    db.executescript("""
        CREATE TABLE IF NOT EXISTS office_members (
          email TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('office','leader')),
          salt BLOB, verifier BLOB, invitation TEXT, expires INTEGER, disabled INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS office_sessions (
          id TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS office_attempts (
          bucket INTEGER NOT NULL, subject TEXT NOT NULL, attempts INTEGER NOT NULL, PRIMARY KEY(bucket, subject));
        CREATE TABLE IF NOT EXISTS office_form_totals (
          day TEXT NOT NULL, kind TEXT NOT NULL, total INTEGER NOT NULL, PRIMARY KEY(day, kind));
    """)
    db.execute("INSERT OR IGNORE INTO settings VALUES ('office_count_start',?)",
               (datetime.now(LOCAL).date().isoformat(),))
    for prefix in ("OFFICE_INITIAL", "OFFICE_SECOND"):
        email = os.environ.get(prefix + "_EMAIL", "").strip().lower()
        token_hash = os.environ.get(prefix + "_DIGEST", "")
        expiry = os.environ.get(prefix + "_EXPIRY", "")
        if valid_email(email) and re.fullmatch(r"[a-f0-9]{64}", token_hash) and expiry.isdigit():
            db.execute("""INSERT OR IGNORE INTO office_members(email, role, invitation, expires)
                          VALUES (?, 'office', ?, ?)""", (email, token_hash, int(expiry)))


def valid_email(email):
    return len(email) <= 254 and re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email)


def render(template, status=200, **context):
    return HTMLResponse(templates.get_template(template).render(
        site=SITE, breeze=BREEZE, roles=ROLES, **context), status_code=status)


def redirect(path):
    return RedirectResponse("/office" + path, status_code=303)


def session(request):
    token = request.cookies.get(COOKIE, "")
    if not token or len(token) > 100:
        return None
    row = request.app.state.db.execute("""SELECT m.email, m.role FROM office_sessions s
        JOIN office_members m ON m.email=s.email
        WHERE s.id=? AND s.expires>? AND m.disabled=0 AND m.verifier IS NOT NULL""",
        (digest(token), int(time.time()))).fetchone()
    if row:
        csrf = hmac.new(request.app.state.key, ("office-csrf:" + token).encode(), hashlib.sha256).hexdigest()
        return {"email": row[0], "role": row[1], "csrf": csrf}
    return None


async def fields(request, user=None):
    if request.headers.get("origin") != ORIGIN:
        raise HTTPException(403, "Open the form from the Chicago office portal.")
    if request.headers.get("content-type", "").split(";")[0] != "application/x-www-form-urlencoded":
        raise HTTPException(415)
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 4096:
            raise HTTPException(413)
    try:
        pairs = parse_qs(body.decode(), keep_blank_values=True, max_num_fields=8)
    except (UnicodeError, ValueError):
        raise HTTPException(400, "Invalid form.") from None
    if any(len(values) != 1 for values in pairs.values()):
        raise HTTPException(400, "Invalid form.")
    values = {key: batch[0] for key, batch in pairs.items()}
    if user and not hmac.compare_digest(user["csrf"].encode(), values.get("csrf", "").encode()):
        raise HTTPException(403, "Reopen this page and try again.")
    return values


def rate_limit(request, email):
    db = request.app.state.db
    bucket = int(time.time()) // 600
    db.execute("DELETE FROM office_attempts WHERE bucket<?", (bucket,))
    for subject, maximum in (("all", 150), (digest(email), 15)):
        attempts = db.execute("""INSERT INTO office_attempts VALUES(?,?,1)
          ON CONFLICT(bucket,subject) DO UPDATE SET attempts=attempts+1 RETURNING attempts""",
          (bucket, subject)).fetchone()[0]
        if attempts > maximum:
            raise HTTPException(429, "Too many attempts. Try again in ten minutes.")


async def password_hash(password, salt):
    async with hash_slots:
        return await asyncio.to_thread(hashlib.scrypt, password.encode(), salt=salt,
            n=2**17, r=8, p=1, dklen=32, maxmem=192*1024*1024)


def signed_in(request, email):
    db = request.app.state.db
    now = int(time.time())
    token = secrets.token_urlsafe(32)
    db.execute("DELETE FROM office_sessions WHERE expires<=? OR id=?", (now, digest(request.cookies.get(COOKIE, ""))))
    db.execute("INSERT INTO office_sessions VALUES(?,?,?)", (digest(token), email, now + 8*3600))
    response = redirect("")
    response.set_cookie(COOKIE, token, max_age=8*3600, httponly=True, secure=True, samesite="lax", path="/")
    return response


@router.get("/style.css")
async def stylesheet():
    return FileResponse(UI / "style.css", media_type="text/css")


@router.get("/login")
@router.get("/activate")
async def entry(request: Request):
    if session(request):
        return redirect("")
    return render("entry.html", activate=request.url.path.endswith("/activate"))


@router.post("/login")
async def login(request: Request):
    data = await fields(request)
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    rate_limit(request, email)
    db = request.app.state.db
    row = db.execute("SELECT salt, verifier FROM office_members WHERE email=? AND disabled=0 AND verifier IS NOT NULL",
                     (email,)).fetchone()
    candidate = await password_hash(password[:256], row[0] if row else b"chicago-dummy-salt")
    if row and len(password) <= 256 and hmac.compare_digest(candidate, row[1]):
        return signed_in(request, email)
    return render("entry.html", 401, error="Check your email and password, or use your private setup code.")


@router.post("/activate")
async def activate(request: Request):
    data = await fields(request)
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    rate_limit(request, email)
    if not 15 <= len(password) <= 256:
        return render("entry.html", 422, activate=True, error="Choose a password between 15 and 256 characters.")
    token = digest(data.get("code", "").strip())
    db = request.app.state.db
    eligible = "email=? AND invitation=? AND expires>? AND disabled=0 AND verifier IS NULL"
    if db.execute("SELECT 1 FROM office_members WHERE " + eligible, (email, token, int(time.time()))).fetchone():
        salt = secrets.token_bytes(16)
        verifier = await password_hash(password, salt)
        changed = db.execute("UPDATE office_members SET salt=?,verifier=?,invitation=NULL,expires=NULL WHERE " + eligible,
                             (salt, verifier, email, token, int(time.time()))).rowcount
        if changed:
            return signed_in(request, email)
    return render("entry.html", 400, activate=True, error="This email and setup code could not be used. Ask a Chicago office admin for a new code.")


@router.post("/logout")
async def logout(request: Request):
    user = session(request)
    if user:
        await fields(request, user)
        request.app.state.db.execute("DELETE FROM office_sessions WHERE id=?", (digest(request.cookies[COOKIE]),))
    response = redirect("/login")
    response.delete_cookie(COOKIE, path="/", httponly=True, secure=True, samesite="lax")
    return response


@router.get("")
async def dashboard(request: Request):
    user = session(request)
    if not user:
        return redirect("/login")
    db = request.app.state.db
    today = datetime.now(LOCAL).date()
    started = db.execute("SELECT value FROM settings WHERE name='office_count_start'").fetchone()[0]
    since = max(started, (today - timedelta(days=6)).isoformat())
    totals = dict(db.execute("SELECT kind,SUM(total) FROM office_form_totals WHERE day BETWEEN ? AND ? GROUP BY kind",
                             (since, today.isoformat())))
    return render("dashboard.html", user=user, since=since, today=today.isoformat(), totals=totals)


def require_office(request):
    user = session(request)
    if user and user["role"] != "office":
        raise HTTPException(403, "Chicago office administrator access required.")
    return user


@router.get("/vendors")
async def vendors(request: Request):
    user = require_office(request)
    if not user:
        return redirect("/login")
    readers = {email.strip().lower() for email in os.environ.get("OFFICE_VENDOR_REFERENCE_READERS", "").split(",")}
    reference = json.loads(os.environ.get("OFFICE_VENDOR_REFERENCE", "{}")) if user["email"] in readers else None
    return render("vendors.html", user=user, tracker=TRACKER, reference=reference)


def manage_page(db, user, **context):
    members = db.execute("""SELECT email, role, verifier IS NOT NULL, disabled, expires FROM office_members
                          ORDER BY disabled, email""").fetchall()
    return render("access.html", user=user, members=members, now=int(time.time()), **context)


@router.get("/access")
async def access(request: Request):
    user = require_office(request)
    return manage_page(request.app.state.db, user) if user else redirect("/login")


@router.post("/access")
async def change_access(request: Request):
    user = require_office(request)
    if not user:
        return redirect("/login")
    data = await fields(request, user)
    email = data.get("email", "").strip().lower()
    role = data.get("role", "")
    action = data.get("action", "")
    db = request.app.state.db
    if not valid_email(email) or email == user["email"]:
        return manage_page(db, user, error="Enter another Chicago staff member’s email.", status=422)
    row = db.execute("SELECT role, verifier, disabled FROM office_members WHERE email=?", (email,)).fetchone()
    if action == "revoke" and row and not row[2]:
        db.execute("UPDATE office_members SET disabled=1, invitation=NULL, expires=NULL WHERE email=?", (email,))
        db.execute("DELETE FROM office_sessions WHERE email=?", (email,))
        return redirect("/access")
    if action == "invite" and role in ROLES:
        if row and row[1] and not row[2]:
            return manage_page(db, user, error="That staff member already has an active account.", status=409)
        token = secrets.token_urlsafe(24)
        db.execute("""INSERT INTO office_members(email,role,invitation,expires) VALUES (?,?,?,?)
            ON CONFLICT(email) DO UPDATE SET role=excluded.role,invitation=excluded.invitation,expires=excluded.expires,
            salt=NULL,verifier=NULL,disabled=0""", (email, role, digest(token), int(time.time())+7*86400))
        return manage_page(db, user, invited=email, code=token)
    return manage_page(db, user, error="Choose a valid account and action.", status=400)
