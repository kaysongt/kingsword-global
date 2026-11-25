"""Role boundaries, invitations and Sunday totals use temporary data only."""
import os
import re
import tempfile
import time
import unittest
from unittest.mock import patch

import httpx

from office import ORIGIN, digest, initialize_office
from server import app


class ChicagoOfficeTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.env = patch.dict(os.environ, {
            "OFFICE_VENDOR_REFERENCE_READERS": "office@example.test",
            "CHECKIN_DATA": self.temp.name, "OFFICE_INITIAL_EMAIL": "office@example.test",
            "OFFICE_INITIAL_DIGEST": digest("test-secret"), "OFFICE_INITIAL_EXPIRY": str(int(time.time()) + 1200),
            "OFFICE_VENDOR_REFERENCE": '{"as_of":"Test","vendors":[["Example Vendor","Heating"]],"services":[]}',
        })
        self.env.start()
        self.addCleanup(self.env.stop)
        self.life = app.router.lifespan_context(app)
        await self.life.__aenter__()
        self.addAsyncCleanup(self.life.__aexit__, None, None, None)
        self.admin = self.client()
        self.member = self.client()
        self.password = "temporary passphrase for testing"

    def client(self):
        client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url=ORIGIN, headers={"origin": ORIGIN})
        self.addAsyncCleanup(client.aclose)
        return client

    async def test_office_forms_keep_their_same_origin(self):
        for action in ("/office/activate", "/office/login"):
            with self.subTest(action=action):
                form = await self.member.get(action)
                self.assertEqual(form.headers["referrer-policy"], "same-origin")
                opaque = await self.member.post(action, data={"email":"office@example.test"}, headers={"origin":"null"})
                self.assertEqual(opaque.status_code, 403)

    async def test_chicago_portal(self):
        for path in ("/office", "/office/vendors", "/office/access"):
            response = await self.member.get(path)
            self.assertEqual(response.status_code, 303)
            self.assertEqual(response.headers["location"], "/office/login")
            self.assertNotIn("Example Vendor", response.text)
        entry = await self.member.get("/office/login")
        self.assertEqual(entry.status_code, 200)
        self.assertEqual(entry.headers["cache-control"], "no-store")
        self.assertNotIn("office@example.test", entry.text)
        invalid = await self.member.post("/office/login", data={"email":"other-branch@kingsword.org","password":self.password})
        self.assertEqual(invalid.status_code, 401)
        account = {"email":"office@example.test", "code":"test-secret", "password":self.password}
        response = await self.admin.post("/office/activate", data=account)
        self.assertEqual(response.status_code, 303)
        self.assertIn("HttpOnly", response.headers["set-cookie"])
        self.assertIn("Secure", response.headers["set-cookie"])
        self.assertEqual((await self.member.post("/office/activate", data=account)).status_code, 400)
        initialize_office(app.state.db)
        self.assertEqual((await self.member.post("/office/activate", data=account)).status_code, 400)
        self.assertIn("Example Vendor", (await self.admin.get("/office/vendors")).text)
        self.assertIn("Website submissions", (await self.admin.get("/office")).text)
        directory = await self.admin.get("/office/access")
        csrf = re.search(r'name="csrf" value="([^"]+)"', directory.text)[1]
        invite = {"action":"invite","email":"leader@example.test","role":"leader","csrf":csrf}
        self.assertEqual((await self.admin.post("/office/access", data=invite, headers={"origin":"https://example.test"})).status_code,403)
        self.assertEqual((await self.admin.post("/office/access", data={**invite,"csrf":"wrong"})).status_code,403)
        code = re.search(r"<code>([^<]+)</code>", (await self.admin.post("/office/access", data=invite)).text)[1]
        self.assertEqual((await self.member.post("/office/activate",data={"email":invite["email"],"code":code,"password":self.password})).status_code,303)
        dashboard = await self.member.get("/office")
        self.assertIn("Small-group reports", dashboard.text)
        self.assertNotIn("Vendors &amp; facilities", dashboard.text)
        for path in ("/office/vendors","/office/access"):
            self.assertEqual((await self.member.get(path)).status_code,403)
        self.assertEqual((await self.member.post("/office/access", data=invite)).status_code,403)
        self.assertEqual((await self.admin.post("/office/access", data={**invite,"action":"revoke"})).status_code,303)
        self.assertEqual((await self.member.get("/office")).status_code,303)
        self.assertEqual((await self.member.post("/office/login", data={"email":invite["email"],"password":self.password})).status_code,401)
        second = self.client()
        issue = {**invite, "email":"office2@example.test", "role":"office"}
        other_code = re.search(r"<code>([^<]+)</code>", (await self.admin.post("/office/access", data=issue)).text)[1]
        details = {"email": issue["email"], "code":other_code, "password":self.password}
        self.assertEqual((await second.post("/office/activate",data=details)).status_code,303)
        setup = await second.get("/office/vendors")
        self.assertEqual(setup.status_code,200)
        self.assertIn("Open live directory", setup.text)
        self.assertNotIn("Example Vendor", setup.text)
        self.assertEqual((await self.admin.post("/office/logout",data={"csrf":csrf})).status_code,303)
        self.assertEqual((await self.admin.get("/office/vendors")).status_code,303)
        self.assertEqual((await self.admin.post("/office/login",data=account)).status_code,303)
        self.assertEqual((await self.admin.get("/office/vendors")).status_code,200)
        self.assertEqual((await self.member.post("/attendance",json={})).status_code,403)
        self.assertEqual((await self.member.get("/health")).json(),{"ok":True})
