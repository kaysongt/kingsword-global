"""Exercise the Chicago pilot using temporary accounts and fictional attendance only."""
import re
import unittest
from unittest.mock import AsyncMock, patch

import pilot
from server import app
import test_office


class PilotTests(unittest.IsolatedAsyncioTestCase):
    client = test_office.ChicagoOfficeTests.client
    day="2026-11-22"

    async def asyncSetUp(self):
        await test_office.ChicagoOfficeTests.asyncSetUp(self)
        await self.admin.post("/office/activate",data={"email":"office@example.test","code":"test-secret","password":self.password})
        self.db=app.state.db
        self.csrf=re.search(r'name="csrf" value="([^"]+)"',(await self.admin.get("/office")).text)[1]
        self.gid=self.db.execute("SELECT id FROM pilot_groups WHERE name='Chicago office pilot'").fetchone()[0]
        self.path=f"/office/groups/{self.gid}"
        self.base={"csrf":self.csrf}
        self.person={"action":"add_person","pid":"123","first":"Robin","last":"Sample","email":"robin@example.test","connect":"","training":"no"}
        self.assertEqual((await self.post("/setup",self.person)).status_code,303)

    async def post(self,suffix,data):
        return await self.admin.post(self.path+suffix,data={**self.base,**data})

    async def test_pilot(self):
        for path in ("/office/groups","/office/members","/office/review","/office/setup",self.path,self.path+"/breeze?day="+self.day):
            self.assertEqual((await self.member.get(path)).status_code,303)
            self.assertEqual((await self.admin.get(path)).status_code,200)
        me=await self.admin.get(self.path)
        self.assertIn("Robin Sample",me.text)
        self.assertNotIn("robin@example.test",me.text)
        invalid="Breeze ID,First name,Last name,Email,Connect,Training\n444,New,Name,,,\nnot-id,Bad,Row,,,"
        self.assertEqual((await self.post("/setup",{"action":"import","roster":invalid})).status_code,422)
        self.assertIsNone(self.db.execute("SELECT 1 FROM pilot_people WHERE pid='444'").fetchone())
        # Match website entries only on an exact, unique roster identity on Sunday.
        who=pilot.identity(app.state.key,"robin","sample","ROBIN@example.test")
        pilot.match_submission(self.db,"2026-11-21",who)
        self.assertFalse(self.db.execute("SELECT 1 FROM pilot_marks").fetchone())
        pilot.match_submission(self.db,self.day,who)
        pilot.match_submission(self.db,self.day,who)
        self.assertEqual(self.db.execute("SELECT web,observed,confirmed FROM pilot_marks").fetchall(),[(1,0,0)])
        await self.post("/setup",{**self.person,"pid":"124"})
        pilot.match_submission(self.db,"2026-11-15",who)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM pilot_marks").fetchone()[0],1)
        await self.post("/setup",{"action":"remove","pid":"124"})
        invite=await self.admin.post("/office/access",data={**self.base,"email":"lead@example.test","action":"invite","role":"leader"})
        code=re.search("<code>(.+?)</code>",invite.text)[1]
        await self.member.post("/office/activate",data={"code":code,"password":self.password,"email":"lead@example.test"})
        token=re.search(r'name="csrf" value="([^"]+)"',(await self.member.get("/office")).text)[1]
        self.assertEqual((await self.member.get(self.path)).status_code,404)
        self.assertNotIn("Robin Sample",(await self.member.get("/office/members")).text)
        await self.post("/setup",{"action":"grant","email":"lead@example.test","mode":"view"})
        mark={"day":self.day,"action":"observe","pid":"123","csrf":token}
        self.assertIn("Robin Sample",(await self.member.get(self.path)).text)
        self.assertEqual((await self.member.post(self.path+"/attendance",data=mark)).status_code,403)
        await self.post("/setup",{"action":"grant","email":"lead@example.test","mode":"lead"})
        self.assertEqual((await self.member.post(self.path+"/attendance",data=mark)).status_code,303)
        self.assertEqual((await self.member.post(self.path+"/attendance",data={**mark,"pid":"124"})).status_code,404)
        self.assertEqual((await self.member.post(self.path+"/attendance",data={**mark,"action":"confirm"})).status_code,403)
        self.assertEqual((await self.member.post(self.path+"/attendance",data={**mark,"day":"2030-01-01"})).status_code,422)
        self.assertEqual((await self.member.post(self.path+"/attendance",data={**mark,"csrf":"bad"})).status_code,403)
        q=await self.admin.get("/office/members?stage=pending&day="+self.day)
        self.assertIn("Robin Sample",q.text)
        await self.post("/attendance",{"pid":"123","day":self.day,"action":"confirm"})
        self.assertNotIn("Robin Sample",(await self.admin.get("/office/members?stage=pending&day="+self.day)).text)
        message={"csrf":self.csrf,"kind":"sunday","subject":"Sunday","body":"Come worship","audience":"Pilots","channel":"Email"}
        self.assertEqual((await self.member.get("/office/communications")).status_code,403)
        self.assertEqual((await self.admin.post("/office/communications",data=message)).status_code,303)
        self.assertIn("Come worship",(await self.admin.get("/office/communications")).text)
        hist=await self.admin.post("/office/review/history",data={**self.base,"day":self.day,"total":0,"source":"Test count"})
        self.assertEqual(hist.status_code,303)
        self.assertIn("0 · Test count",(await self.admin.get("/office/review?day="+self.day)).text)
        self.assertNotIn("Test count",(await self.member.get("/office/review?day="+self.day)).text)
        self.assertEqual((await self.admin.post("/office/setup",data={**self.base,"task":"history","state":"Verified","owner":"Test owner"})).status_code,303)
        self.assertIn("Test owner",(await self.admin.get("/office/setup")).text)
        await self.admin.post("/office/access",data={**self.base,"action":"revoke","email":"lead@example.test"})
        self.assertEqual((await self.member.get(self.path)).status_code,303)
        self.assertFalse(self.db.execute("SELECT * FROM pilot_grants").fetchall())

    async def test_direct_connection(self):
        endpoint="/breeze"
        async def do(action,**data):
            return await self.post(endpoint,{"action":action,"day":self.day,**data})
        await self.post("/attendance",{"action":"observe","pid":"123","day":self.day})
        with patch("breeze_attendance.api",new_callable=AsyncMock) as api:
            event={"id":"901","start_datetime":self.day+" 10:00:00","name":"Sunday gathering"}
            api.return_value=[event]
            self.assertEqual((await do("link",instance="902")).status_code,422)
            self.assertEqual((await do("link",instance="901")).status_code,303)
            api.side_effect=[[],{"id":"123","first_name":"Wrong","last_name":"Profile"}]
            self.assertEqual((await do("send",pid="123")).status_code,422)
            profile={"id":"123","first_name":"Robin","last_name":"Sample"}
            api.side_effect=[[],profile,ValueError("Could not confirm")]
            self.assertEqual((await do("send",pid="123")).status_code,422)
            self.assertEqual(self.db.execute("SELECT COUNT(*) FROM pilot_outbox").fetchone()[0],1)
            api.side_effect=[[],profile]
            self.assertEqual((await do("send",pid="123")).status_code,422)
            api.side_effect=[[{"person_id":"123"}]]
            self.assertEqual((await do("compare")).status_code,303)
            self.assertEqual(self.db.execute("SELECT confirmed FROM pilot_marks").fetchone()[0],1)
            self.assertFalse(self.db.execute("SELECT * FROM pilot_outbox").fetchall())

    async def test_success_and_retries(self):
        await self.post("/attendance",{"action":"observe","pid":"123","day":self.day})
        self.db.execute("INSERT INTO pilot_events VALUES(?,?,?)",(self.day,"901","Sunday service"))
        with patch("breeze_attendance.api",new_callable=AsyncMock) as api:
            api.side_effect=[[],{"id":"123","first_name":"Robin","last_name":"Sample"},True]
            send={"day":self.day,"action":"send","pid":"123"}
            self.assertEqual((await self.post("/breeze",send)).status_code,303)
            self.assertEqual(self.db.execute("SELECT confirmed FROM pilot_marks").fetchone()[0],1)
            self.assertEqual(api.await_args_list[-1].args,("events/attendance/add",))
            api.side_effect=[[{"person_id":"123"}]]
            self.assertEqual((await self.post("/breeze",send)).status_code,422)
            self.assertEqual(api.await_count,4)
