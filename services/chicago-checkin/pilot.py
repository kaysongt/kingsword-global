"""Chicago's private, group-scoped Sunday pilot. Breeze remains the attendance record."""
import csv
import hashlib
import hmac
import io
from contextlib import contextmanager
from datetime import date, datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from starlette.responses import PlainTextResponse

from office import LOCAL, fields, redirect, render, require_office, session, valid_email

router = APIRouter(prefix="/office")
STAGES = {"yes": "Completed", "no": "Not completed", "": "Unrecorded"}
COLUMNS = ["Breeze ID", "First name", "Last name", "Email", "Connect", "Training"]
TASKS = {
    "billing": ("Billing and giving", "Check the invoice with finance. Record what the monthly charge covers and whether Tithely Giving sends gifts to the right Breeze funds. Agree how finance will match gifts made under another name."),
    "rosters": ("Group leaders and handovers", "Confirm the first group, its current roster, leader and church-managed mailbox. Verify who controls account recovery before transferring the role."),
    "history": ("Historical attendance", "Locate the former attendance workbook and confirm its owner and dates. Enter service totals in Pastoral review with their source. Individual attendance requires a named attendance record."),
    "comms": ("Devotionals and Sunday reminders", "Confirm the sender, audience, opt-in preferences and delivery schedule with the office. Review a devotional, confession and Sunday reminder before enabling a send."),
    "pilot": ("Sunday pilot and pastoral review", "Choose a Sunday with the leader. Compare their roster and the website submissions with the dated Breeze event. Agree the next review date with Pastor."),
}
MESSAGES = {
    "sunday": ("Sunday reminder", "Worship with us this Sunday", "Good morning, KingsWord family! We’d love to see you this Sunday. Find the service time and directions on our Chicago page."),
    "devotional": ("Daily devotional", "Today’s devotional", "Good morning, family. Today’s devotional is ready. Take a moment to read or listen, then carry one thought from it into your day."),
    "confession": ("Monthly confession", "Our confession for the month", "Join us in speaking this month’s confession over your day. Read it with us on the Chicago confessions page."),
}


def initialize(db):
    db.executescript("""
        CREATE TABLE IF NOT EXISTS pilot_groups(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE);
        CREATE TABLE IF NOT EXISTS pilot_grants(gid INTEGER NOT NULL, email TEXT NOT NULL, mode TEXT NOT NULL,
            PRIMARY KEY(gid,email));
        CREATE TABLE IF NOT EXISTS pilot_people(pid TEXT PRIMARY KEY, first TEXT NOT NULL, last TEXT NOT NULL,
            identity TEXT, connect TEXT NOT NULL, training TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS pilot_identity ON pilot_people(identity);
        CREATE TABLE IF NOT EXISTS pilot_roster(gid INTEGER NOT NULL,pid TEXT NOT NULL,PRIMARY KEY(gid,pid));
        CREATE TABLE IF NOT EXISTS pilot_marks(day TEXT NOT NULL,pid TEXT NOT NULL,web INTEGER NOT NULL DEFAULT 0,
            observed INTEGER NOT NULL DEFAULT 0,confirmed INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,pid));
        CREATE TABLE IF NOT EXISTS pilot_log(id INTEGER PRIMARY KEY, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            actor TEXT NOT NULL, gid INTEGER NOT NULL, subject TEXT NOT NULL, action TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS pilot_drafts(kind TEXT PRIMARY KEY,subject TEXT NOT NULL,body TEXT NOT NULL,
            audience TEXT NOT NULL,channel TEXT NOT NULL,updated TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS pilot_tasks(task TEXT PRIMARY KEY, owner TEXT NOT NULL, state TEXT NOT NULL, updated TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS pilot_history(day TEXT PRIMARY KEY, total INTEGER NOT NULL, source TEXT NOT NULL);
    """)
    with transaction(db):
        if db.execute("INSERT OR IGNORE INTO settings(name,value) VALUES('chicago_office_pilot_started','1')").rowcount:
            db.execute("INSERT OR IGNORE INTO pilot_groups(name) VALUES('Chicago office pilot')")


@contextmanager
def transaction(db):
    db.execute("BEGIN IMMEDIATE")
    try:
        yield
    except BaseException:
        db.execute("ROLLBACK")
        raise
    else:
        db.execute("COMMIT")


def identity(key, first, last, email):
    parts = [str(s).strip().casefold() for s in (first, last, email)]
    return hmac.new(key, "\0".join(["visitor", *parts]).encode(), hashlib.sha256).hexdigest()


def match_submission(db, day, who):
    if date.fromisoformat(day).weekday() != 6:
        return
    rows = db.execute("""SELECT p.pid FROM pilot_people p WHERE identity=?
        AND EXISTS(SELECT 1 FROM pilot_roster r WHERE r.pid=p.pid) LIMIT 2""", (who,)).fetchall()
    if len(rows) == 1:
        db.execute("""INSERT INTO pilot_marks(day,pid,web) VALUES(?,?,1)
            ON CONFLICT(day,pid) DO UPDATE SET web=1""", (day, rows[0][0]))


def service_day(value=None):
    today = datetime.now(LOCAL).date()
    if value is None:
        return today - timedelta(days=(today.weekday()+1) % 7)
    try:
        parsed = date.fromisoformat(value)
        if parsed.weekday() == 6 and parsed <= today and parsed.year >= 2000:
            return parsed
    except (ValueError, TypeError):
        pass
    raise ValueError("Choose a Sunday on or before today.")


def groups_for(db, user):
    if user["role"] == "office":
        return db.execute("SELECT id,name,'office' FROM pilot_groups ORDER BY name").fetchall()
    return db.execute("""SELECT g.id,g.name,a.mode FROM pilot_groups g JOIN pilot_grants a ON a.gid=g.id
        WHERE a.email=? ORDER BY g.name""",(user["email"],)).fetchall()


def group_for(db, user, gid):
    for group in groups_for(db, user):
        if group[0] == gid:
            return group
    raise HTTPException(404, "Group unavailable.")


def audit(db, user, gid, subject, action):
    db.execute("INSERT INTO pilot_log(actor,gid,subject,action) VALUES(?,?,?,?)", (user["email"],gid,subject,action))


def invalid(user, message, path="/office/groups"):
    return render("pilot_error.html",422,user=user,message=message,path=path)


@router.get("/groups")
async def groups(request: Request):
    user = session(request)
    if not user:
        return redirect("/login")
    return render("pilot_groups.html",user=user,groups=groups_for(request.app.state.db,user))


@router.post("/groups")
async def create_group(request: Request):
    user = require_office(request)
    if not user:
        return redirect("/login")
    data = await fields(request, user)
    name = data.get("name","").strip()
    if not 1 <= len(name) <= 90:
        return invalid(user,"Enter a group name of up to 90 characters.")
    db = request.app.state.db
    with transaction(db):
        db.execute("INSERT OR IGNORE INTO pilot_groups(name) VALUES(?)",(name,))
        gid = db.execute("SELECT id FROM pilot_groups WHERE name=?",(name,)).fetchone()[0]
    return redirect(f"/groups/{gid}")


def parse_roster(raw, key):
    rows = csv.DictReader(io.StringIO(raw.lstrip("\ufeff").strip()), strict=True)
    if rows.fieldnames != COLUMNS:
        raise ValueError("Use the six column headings from the roster template in their original order.")
    people = {}
    for n, row in enumerate(rows, 2):
        if None in row or any(v is None for v in row.values()) or n > 1001:
            raise ValueError(f"Check the number of columns or the 1,000-person limit at row {n}.")
        pid, first, last, email, connect, training = [row[c].strip() for c in COLUMNS]
        if not (pid.isascii() and pid.isdigit() and 1 <= len(pid) <= 18 and int(pid) > 0 and pid == str(int(pid))):
            raise ValueError(f"Enter a positive Breeze person ID at row {n}.")
        if pid in people or not (1 <= len(first) <= 80 and 1 <= len(last) <= 100):
            raise ValueError(f"Check the name or duplicate Breeze ID at row {n}.")
        if email and not valid_email(email):
            raise ValueError(f"Check the email at row {n}, or leave it blank.")
        if connect.lower() not in STAGES or training.lower() not in STAGES:
            raise ValueError(f"Use Yes, No, or a blank for Connect and Training at row {n}.")
        people[pid] = (pid,first,last,identity(key,first,last,email) if email else None,connect.lower(),training.lower())
    if not people:
        raise ValueError("Include at least one person in the roster.")
    return people


@router.get("/roster-template.csv")
async def template(request: Request):
    user = require_office(request)
    if not user:
        return redirect("/login")
    return PlainTextResponse(",".join(COLUMNS)+"\r\n",media_type="text/csv",headers={"Content-Disposition":"attachment; filename=chicago-roster.csv"})


def roster_page(request,user,group,day,notice=None):
    db = request.app.state.db
    days = [(day-timedelta(weeks=w)).isoformat() for w in range(3,-1,-1)]
    rows = db.execute("""SELECT p.pid,p.first,p.last,p.connect,p.training FROM pilot_roster r
        JOIN pilot_people p ON p.pid=r.pid WHERE r.gid=? ORDER BY p.last COLLATE NOCASE,p.first COLLATE NOCASE""",(group[0],)).fetchall()
    marks = {(pid,d):(web,observed,confirmed) for pid,d,web,observed,confirmed in db.execute("""
        SELECT m.pid,m.day,m.web,m.observed,m.confirmed FROM pilot_marks m JOIN pilot_roster r ON r.pid=m.pid
        WHERE r.gid=? AND m.day BETWEEN ? AND ?""",(group[0],days[0],days[-1]))}
    grants = staff = []
    if user["role"] == "office":
        grants = db.execute("SELECT email,mode FROM pilot_grants WHERE gid=? ORDER BY email",(group[0],)).fetchall()
        staff = db.execute("SELECT email FROM office_members WHERE role='leader' AND disabled=0 ORDER BY email").fetchall()
    return render("pilot_roster.html",user=user,group=group,rows=rows,marks=marks,days=days,day=day.isoformat(),
                  stages=STAGES,grants=grants,staff=staff,notice=notice)


@router.get("/groups/{gid}")
async def roster(request: Request,gid: int,day: str|None=None):
    user = session(request)
    if not user:
        return redirect("/login")
    group = group_for(request.app.state.db,user,gid)
    try:
        selected = service_day(day)
    except ValueError as exc:
        return invalid(user,str(exc),f"/office/groups/{gid}")
    return roster_page(request,user,group,selected)


@router.post("/groups/{gid}/setup")
async def setup(request: Request,gid: int):
    user = require_office(request)
    if not user:
        return redirect("/login")
    db = request.app.state.db
    group = group_for(db,user,gid)
    data = await fields(request,user,max_bytes=256_000)
    action = data.get("action")
    path = f"/office/groups/{gid}"
    if action in {"import", "add_person"}:
        raw = data.get("roster", "")
        if action == "add_person":
            buffer = io.StringIO()
            writer = csv.writer(buffer)
            writer.writerow(COLUMNS)
            writer.writerow([data.get(k, "") for k in ("pid","first","last","email","connect","training")])
            raw = buffer.getvalue()
        try:
            people = parse_roster(raw,request.app.state.key)
        except (csv.Error, ValueError) as exc:
            return invalid(user,str(exc),path)
        with transaction(db):
            db.executemany("""INSERT INTO pilot_people VALUES(?,?,?,?,?,?) ON CONFLICT(pid) DO UPDATE SET
                first=excluded.first,last=excluded.last,identity=excluded.identity,connect=excluded.connect,training=excluded.training""",people.values())
            db.executemany("INSERT OR IGNORE INTO pilot_roster VALUES(?,?)",[(gid,pid) for pid in people])
            audit(db,user,gid,str(len(people)),"roster import")
    elif action == "remove":
        pid = data.get("pid","")
        with transaction(db):
            db.execute("DELETE FROM pilot_roster WHERE gid=? AND pid=?",(gid,pid))
            audit(db,user,gid,pid,"removed from roster")
    elif action in {"grant","revoke"}:
        email = data.get("email","").lower().strip()
        mode = data.get("mode","")
        with transaction(db):
            if action == "grant":
                if mode not in {"lead","view"} or not db.execute(
                    "SELECT 1 FROM office_members WHERE email=? AND disabled=0 AND role='leader'",(email,)).fetchone():
                    return invalid(user,"Choose an invited ministry account and a permission.",path)
                db.execute("""INSERT INTO pilot_grants VALUES(?,?,?) ON CONFLICT(gid,email)
                    DO UPDATE SET mode=excluded.mode""",(gid,email,mode))
            else:
                db.execute("DELETE FROM pilot_grants WHERE gid=? AND email=?",(gid,email))
            audit(db,user,gid,email,mode if action=="grant" else "access removed")
    else:
        return invalid(user,"Choose a group setup action.",path)
    return redirect(f"/groups/{gid}")


@router.post("/groups/{gid}/attendance")
async def attendance(request: Request,gid: int):
    user = session(request)
    if not user:
        return redirect("/login")
    db = request.app.state.db
    data = await fields(request,user)
    group = group_for(db,user,gid)
    action,pid = data.get("action",""),data.get("pid","")
    if group[2] == "view" or (action in {"confirm","unconfirm"} and user["role"] != "office"):
        raise HTTPException(403,"This account cannot change that record.")
    try:
        day = service_day(data.get("day","")).isoformat()
    except ValueError as exc:
        return invalid(user,str(exc),f"/office/groups/{gid}")
    if not db.execute("SELECT 1 FROM pilot_roster WHERE gid=? AND pid=?",(gid,pid)).fetchone():
        raise HTTPException(404,"Person unavailable.")
    if action not in {"observe","undo","confirm","unconfirm"}:
        return invalid(user,"Choose an attendance action.",f"/office/groups/{gid}")
    with transaction(db):
        db.execute("INSERT OR IGNORE INTO pilot_marks(day,pid) VALUES(?,?)",(day,pid))
        if action in {"observe","undo"}:
            db.execute("UPDATE pilot_marks SET observed=? WHERE day=? AND pid=? AND confirmed=0",(int(action=="observe"),day,pid))
        else:
            db.execute("UPDATE pilot_marks SET confirmed=? WHERE day=? AND pid=?",(int(action=="confirm"),day,pid))
        audit(db,user,gid,pid,action+" "+day)
    return redirect(f"/groups/{gid}?day={day}")


@router.get("/review")
async def review(request: Request,weeks: int=8,day: str|None=None):
    user = session(request)
    if not user:
        return redirect("/login")
    if weeks not in {4,8,12}:
        return invalid(user,"Choose four, eight or twelve Sundays.","/office/review")
    try:
        last = service_day(day)
    except ValueError as exc:
        return invalid(user,str(exc),"/office/review")
    dates = [(last-timedelta(weeks=i)).isoformat() for i in range(weeks)]
    db = request.app.state.db
    office = user["role"] == "office"
    history = dict((d,(n,src)) for d,n,src in db.execute(
        "SELECT day,total,source FROM pilot_history WHERE day BETWEEN ? AND ?",(dates[-1],dates[0]))) if office else {}
    # Group membership may overlap. Count each profile only once within this viewer's scope.
    audience = """SELECT DISTINCT r.pid FROM pilot_roster r WHERE ? OR r.gid IN
        (SELECT gid FROM pilot_grants WHERE email=?)"""
    rows = db.execute(f"""SELECT m.day,SUM(m.web),SUM(m.observed),SUM(m.confirmed),
        SUM(CASE WHEN (m.web OR m.observed) AND NOT m.confirmed THEN 1 ELSE 0 END)
        FROM pilot_marks m WHERE m.pid IN ({audience}) AND m.day BETWEEN ? AND ?
        AND (m.web OR m.observed OR m.confirmed) GROUP BY m.day""",
        (office,user["email"],dates[-1],dates[0])).fetchall()
    counts = {r[0]:r[1:] for r in rows}
    assigned = db.execute("SELECT COUNT(*) FROM ("+audience+")",(office,user["email"])).fetchone()[0]
    return render("pilot_review.html",user=user,dates=dates,weeks=weeks,counts=counts,history=history,
                  assigned=assigned,peak=max([1]+[r[3] for r in rows]))


@router.post("/review/history")
async def save_history(request: Request):
    user = require_office(request)
    if not user:
        return redirect("/login")
    data = await fields(request,user)
    try:
        day = service_day(data.get("day","")).isoformat()
        total = int(data.get("total",""))
        source = data.get("source","").strip()
        if not (0 <= total <= 100000 and 2 <= len(source) <= 160):
            raise ValueError()
    except ValueError:
        return invalid(user,"Enter a past or current Sunday, a nonnegative headcount, and its source.","/office/review")
    db = request.app.state.db
    with transaction(db):
        db.execute("""INSERT INTO pilot_history VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET
            total=excluded.total, source=excluded.source""",(day,total,source))
        audit(db,user,0,day,"historical headcount "+str(total))
    return redirect("/review?day="+day)


@router.get("/setup")
async def tasks(request: Request):
    user = require_office(request)
    if not user:
        return redirect("/login")
    states = {r[0]:r[1:] for r in request.app.state.db.execute("SELECT task,owner,state,updated FROM pilot_tasks")}
    return render("pilot_tasks.html",user=user,tasks=TASKS,states=states)


@router.post("/setup")
async def save_task(request: Request):
    user = require_office(request)
    if not user:
        return redirect("/login")
    data = await fields(request,user)
    task,state,owner = data.get("task"),data.get("state"),data.get("owner","").strip()
    if task not in TASKS or state not in {"Open","In progress","Verified"} or len(owner)>90 or (state!="Open" and not owner):
        return invalid(user,"Choose a listed task and enter its owner before starting or verifying it.","/office/setup")
    request.app.state.db.execute("""INSERT INTO pilot_tasks VALUES(?,?,?,?) ON CONFLICT(task)
        DO UPDATE SET owner=excluded.owner,state=excluded.state,updated=excluded.updated""",
        (task,owner,state,datetime.now(LOCAL).date().isoformat()))
    return redirect("/setup")


@router.get("/members")
async def members(request: Request,stage: str="all",day: str|None=None):
    user=session(request)
    if not user:
        return redirect("/login")
    try:
        selected=service_day(day).isoformat()
    except ValueError as exc:
        return invalid(user,str(exc),"/office/members")
    if stage not in {"all","connect","training","unrecorded","pending"}:
        return invalid(user,"Select a member care filter.","/office/members")
    db=request.app.state.db
    rows=db.execute("""SELECT p.pid,p.first,p.last,p.connect,p.training,g.id,g.name,
        COALESCE(m.web,0),COALESCE(m.observed,0),COALESCE(m.confirmed,0)
        FROM pilot_people p JOIN pilot_roster r ON r.pid=p.pid JOIN pilot_groups g ON g.id=r.gid
        LEFT JOIN pilot_marks m ON m.pid=p.pid AND m.day=?
        WHERE (? OR EXISTS(SELECT 1 FROM pilot_grants a WHERE a.gid=r.gid AND a.email=?))
        ORDER BY p.last COLLATE NOCASE,p.first COLLATE NOCASE,p.pid,g.name COLLATE NOCASE""",
        (selected,user["role"]=="office",user["email"])).fetchall()
    directory={}
    for pid,first,last,connect,training,gid,name,web,seen,confirmed in rows:
        if stage=="connect" and connect!="no" or stage=="training" and training!="no":
            continue
        if stage=="unrecorded" and connect and training:
            continue
        if stage=="pending" and (confirmed or not (web or seen)):
            continue
        person=directory.setdefault(pid,dict(first=first,last=last,connect=STAGES[connect],training=STAGES[training],
            groups=[],status="Breeze confirmed" if confirmed else "Seen by leader" if seen else "Website check-in" if web else "Unrecorded"))
        person["groups"].append((gid,name))
    return render("pilot_members.html",user=user,directory=directory,stage=stage,day=selected)

@router.get("/communications")
async def communications(request: Request,kind: str="sunday"):
    user=require_office(request)
    if not user:
        return redirect("/login")
    if kind not in MESSAGES:
        raise HTTPException(404)
    draft=request.app.state.db.execute("SELECT subject,body,audience,channel,updated FROM pilot_drafts WHERE kind=?",(kind,)).fetchone()
    if not draft:
        draft=(*MESSAGES[kind][1:],"","Email","")
    return render("pilot_messages.html",user=user,kind=kind,kinds=MESSAGES,draft=draft)


@router.post("/communications")
async def save_draft(request: Request):
    user=require_office(request)
    if not user:
        return redirect("/login")
    data=await fields(request,user,max_bytes=32_000)
    kind=data.get("kind","")
    subject,body,audience,channel=[data.get(field,"").strip() for field in ("subject","body","audience","channel")]
    if (kind not in MESSAGES or not 1<=len(subject)<=160 or not 1<=len(body)<=3000
            or len(audience)>160 or channel not in {"Email","SMS"}):
        return invalid(user,"Complete the subject and message within the displayed limits.","/office/communications")
    request.app.state.db.execute("""INSERT INTO pilot_drafts VALUES(?,?,?,?,?,?) ON CONFLICT(kind) DO UPDATE SET
        subject=excluded.subject,body=excluded.body,audience=excluded.audience,channel=excluded.channel,updated=excluded.updated""",
        (kind,subject,body,audience,channel,datetime.now(LOCAL).strftime("%Y-%m-%d %H:%M")))
    return redirect("/communications?kind="+kind)
