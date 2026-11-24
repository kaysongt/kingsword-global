"""Pre-deploy check of both published forms. Never submits either form."""
import asyncio
import os
from uuid import uuid4

from playwright.async_api import async_playwright
from server import CONTACT, CUSTOM, FORMS, Submission, prepare_form

async def main():
    async with async_playwright() as driver:
        browser = await driver.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH"))
        for kind in FORMS:
            page = await browser.new_page()
            page.set_default_timeout(18000)
            details = {}
            if kind == "welcome":
                details = dict.fromkeys(CUSTOM, "Sample")
                details.update(dict.fromkeys(CONTACT, "Sample"))
                details["state"] = "IL"
            data = Submission(first="Sample", last="Verification", email="sample@example.invalid",
                              device=uuid4(), details=details)
            await prepare_form(page, kind, data)
            required = await page.locator("form#custom_form .required_field").count()
            if required != 2:
                raise RuntimeError(f"{kind}: expected exactly two required Breeze fields")
            print(f"{kind}: public form ready and fields verified", flush=True)
            await page.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
