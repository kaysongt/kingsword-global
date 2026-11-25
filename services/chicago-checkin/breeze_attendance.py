"""Office-only reconciliation against a selected Chicago Breeze event instance."""
import asyncio
import json
import os
import re
import time
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request as UrlRequest, build_opener

from fastapi import APIRouter, HTTPException, Request

from office import BREEZE, fields, redirect, render, require_office
from pilot import audit, group_for, invalid, service_day, transaction

router = APIRouter(prefix="/office")
gate = asyncio.Lock()
last_request = 0.0


class StopRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


def initialize(db):
    db.executescript("""
        CREATE TABLE IF NOT EXISTS pilot_events(day TEXT PRIMARY KEY,instance TEXT NOT NULL UNIQUE,name TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS pilot_outbox(instance TEXT NOT NULL,pid TEXT NOT NULL,PRIMARY KEY(instance,pid));
    """)


def fetch(path, params, key):
    url = BREEZE + "/api/" + path + "?" + urlencode(params)
    req = UrlRequest(url,headers={"Api-Key":key,"Accept":"application/json"})
    with build_opener(StopRedirect).open(req,timeout=12) as response:
        return json.loads(response.read(4_000_001))


async def api(path, **params):
    global last_request
    key = os.getenv("BREEZE_API_KEY","")
    if not key:
        raise ValueError("The direct Breeze connection is awaiting setup.")
    async with gate:
        await asyncio.sleep(max(0,3.5-(time.monotonic()-last_request)))
        last_request=time.monotonic()
        try:
            return await asyncio.to_thread(fetch,path,params,key)
        except (URLError,TimeoutError,OSError,ValueError,UnicodeError):
            raise ValueError("Breeze could not confirm the request. Review the dated service in Breeze before trying again.") from None


async def events_on(day):
    records = await api("events", start=day,end=day)
    if not isinstance(records,list):
        raise ValueError("Breeze could not list events for this Sunday.")
    return {str(r["id"]):str(r.get("name") or "Untitled event") for r in records if isinstance(r,dict)
            and str(r.get("start_datetime",""))[:10]==day and re.fullmatch(r"[0-9]+",str(r.get("id","")))}


async def present_ids(instance):
    rows = await api("events/attendance/list", instance_id=instance,type="person",details="false")
    if not isinstance(rows,list) or any(not isinstance(r,dict) or not str(r.get("person_id","")).isdigit() for r in rows):
        raise ValueError("Breeze returned an unreadable attendance list. Open the dated event to verify it.")
    return {str(r["person_id"]) for r in rows}


@router.get("/groups/{gid}/breeze")
async def compare(request: Request,gid: int,day: str):
    user=require_office(request)
    if not user:
        return redirect("/login")
    db=request.app.state.db
    group=group_for(db,user,gid)
    try:
        day=service_day(day).isoformat()
    except ValueError as exc:
        return invalid(user,str(exc),f"/office/groups/{gid}")
    event=db.execute("SELECT instance,name FROM pilot_events WHERE day=?",(day,)).fetchone()
    options={}
    error=""
    enabled=bool(os.getenv("BREEZE_API_KEY"))
    if enabled and not event:
        try:
            options=await events_on(day)
        except ValueError as exc:
            error=str(exc)
    pending=db.execute("""SELECT p.pid,p.first,p.last,m.web,m.observed,
        EXISTS(SELECT 1 FROM pilot_outbox o WHERE o.instance=? AND o.pid=p.pid)
        FROM pilot_roster r JOIN pilot_people p ON p.pid=r.pid JOIN pilot_marks m ON m.pid=p.pid
        WHERE r.gid=? AND m.day=? AND (m.web OR m.observed) AND NOT m.confirmed ORDER BY p.last,p.first""",
        (event[0] if event else "",gid,day)).fetchall()
    return render("pilot_breeze.html",user=user,group=group,day=day,event=event,options=options,
                  pending=pending,enabled=enabled,error=error)


@router.post("/groups/{gid}/breeze")
async def reconcile(request: Request,gid: int):
    user=require_office(request)
    if not user:
        return redirect("/login")
    data=await fields(request,user)
    db=request.app.state.db
    group_for(db,user,gid)
    path=f"/office/groups/{gid}"
    try:
        day=service_day(data.get("day","")).isoformat()
        path+=f"/breeze?day={day}"
        action=data.get("action")
        event=db.execute("SELECT instance FROM pilot_events WHERE day=?",(day,)).fetchone()
        if action=="link":
            options=await events_on(day)
            chosen=data.get("instance","")
            if chosen not in options:
                raise ValueError("Select an existing Breeze event on this Sunday.")
            require_current(request,user)
            db.execute("INSERT OR IGNORE INTO pilot_events VALUES(?,?,?)",(day,chosen,options[chosen]))
            if db.execute("SELECT instance FROM pilot_events WHERE day=?",(day,)).fetchone()[0]!=chosen:
                raise ValueError("Another event is already linked to that Sunday.")
            audit(db,user,gid,chosen,"linked event "+day)
        elif event and action in {"compare","send"}:
            instance=event[0]
            present=await present_ids(instance)
            require_current(request,user)
            if action=="compare":
                # Apply only positive upstream matches, restricted to this roster.
                with transaction(db):
                    ids=db.execute("SELECT pid FROM pilot_roster WHERE gid=?",(gid,)).fetchall()
                    for (pid,) in ids:
                        if pid in present:
                            confirm(db,day,pid,instance)
                    audit(db,user,gid,instance,"compared Breeze attendance "+day)
            else:
                pid=data.get("pid","")
                row=db.execute("""SELECT p.first,p.last FROM pilot_people p JOIN pilot_roster r ON r.pid=p.pid
                    JOIN pilot_marks m ON m.pid=p.pid WHERE r.gid=? AND p.pid=? AND m.day=?
                    AND (m.web OR m.observed) AND m.confirmed=0""",(gid,pid,day)).fetchone()
                if not row:
                    raise ValueError("This person has no pending observation or check-in for that Sunday.")
                if pid not in present:
                    profile=await api("people/"+pid, details=0)
                    if not isinstance(profile,dict) or str(profile.get("id"))!=pid or any(
                        str(profile.get(k,"")).strip().casefold()!=v.strip().casefold()
                        for k,v in zip(("first_name","last_name"),row)):
                        raise ValueError("The roster name and Breeze profile do not match. Review the roster before sending.")
                    require_current(request,user)
                    if not db.execute("""SELECT 1 FROM pilot_roster r JOIN pilot_marks m ON m.pid=r.pid
                        WHERE r.gid=? AND r.pid=? AND m.day=? AND (m.web OR m.observed) AND NOT m.confirmed""",
                        (gid,pid,day)).fetchone():
                        raise ValueError("The observation changed during review. Reopen this roster.")
                    if not db.execute("INSERT OR IGNORE INTO pilot_outbox VALUES(?,?)",(instance,pid)).rowcount:
                        raise ValueError("An earlier send needs review. Compare with the dated event before taking any further action.")
                    if await api("events/attendance/add",instance_id=instance,person_id=pid,direction="in") is not True:
                        raise ValueError("Breeze did not confirm this send. Review the dated event before taking any further action.")
                with transaction(db):
                    confirm(db,day,pid,instance)
                    audit(db,user,gid,pid,"Breeze reconciliation "+day)
        else:
            raise ValueError("Link the dated event before reconciling attendance.")
    except ValueError as exc:
        return invalid(user,str(exc),path)
    return redirect(path.removeprefix("/office"))


def require_current(request,user):
    if require_office(request)!=user:
        raise HTTPException(403,"Sign in again to continue.")


def confirm(db,day,pid,instance):
    db.execute("""INSERT INTO pilot_marks(day,pid,confirmed) VALUES(?,?,1)
        ON CONFLICT(day,pid) DO UPDATE SET confirmed=1""",(day,pid))
    db.execute("DELETE FROM pilot_outbox WHERE instance=? AND pid=?",(instance,pid))
