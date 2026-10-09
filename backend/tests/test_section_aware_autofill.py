"""
Section-aware bookmarklet autofill verification against /shcil-mock.html.
Executes the exact bookmarklet.js logic in-browser (fetch is live from
/api/orders/<id>/autofill) and asserts final field values + no cross-section
leak + duty section not polluted by Second Party name.
"""
import os, re, json, time, asyncio, subprocess, sys
import requests
from playwright.async_api import async_playwright

BASE = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
MOCK_URL = f"{BASE}/shcil-mock.html"
BOOKMARKLET_SRC = "/app/frontend/src/lib/bookmarklet.js"


def seed_orders():
    out = subprocess.check_output([sys.executable, "/app/backend/tests/seed_orders.py"])
    ids = json.loads(out.strip().splitlines()[-1])
    return ids["A"], ids["B"]


def build_fill_code(order_id: str) -> str:
    """Extract the (function(){...})(); template body from bookmarklet.js and
    substitute URL + FIELDS placeholders so it can be run via page.evaluate.
    """
    src = open(BOOKMARKLET_SRC).read()
    # Grab the FIELDS array literal — matches `const FIELDS = [ ... ];`
    m = re.search(r"const FIELDS = (\[[\s\S]*?\n\];)", src)
    assert m, "FIELDS literal not found"
    fields_literal = m.group(1).rstrip(";")
    # Grab the template literal body between first backtick after `const code = ` and the trailing backtick+;
    m2 = re.search(r"const code = `([\s\S]*?)`;\s*\n\s*return", src)
    assert m2, "code template not found"
    body = m2.group(1)
    # Substitute ${JSON.stringify(url)} and ${fields}
    url = f"{BASE}/api/orders/{order_id}/autofill"
    body = body.replace("${JSON.stringify(url)}", json.dumps(url))
    body = body.replace("${fields}", fields_literal)
    # Unescape \\s -> \s (template literal in JS)
    body = body.replace("\\\\s+", "\\s+").replace('\\"', '"')
    return body


async def run_order(page, order_id, label):
    page_errors = []
    console_msgs = []
    dialogs = []

    page.on("console", lambda m: console_msgs.append(f"{m.type}: {m.text}"))
    page.on("dialog", lambda d: (dialogs.append(d.message), asyncio.create_task(d.dismiss())))
    page.on("pageerror", lambda e: page_errors.append(str(e)))

    await page.goto(MOCK_URL, wait_until="domcontentloaded")
    await page.wait_for_selector("#ctl00_cph_txtFp")

    code = build_fill_code(order_id)
    # Wrap as async so we can await the fetch promise returned by the IIFE
    wrapped = f"(async () => {{ return await ({code}); }})()"
    filled = await page.evaluate(wrapped)
    # Give any trailing dispatch events a moment
    await page.wait_for_timeout(500)

    ids = [
        "ctl00_cph_txtPurBy", "ctl00_cph_txtDesc", "ctl00_cph_txtConsidr",
        "ctl00_cph_txtFp", "ctl00_cph_txtFpAdd1", "ctl00_cph_txtFpAdd2",
        "ctl00_cph_txtFpMob", "ctl00_cph_txtFpEmail",
        "ctl00_cph_txtSp", "ctl00_cph_txtSpAdd1", "ctl00_cph_txtSpAdd2",
        "ctl00_cph_txtSpMob", "ctl00_cph_txtSpEmail",
        "ctl00_cph_txtDuty",
    ]
    vals = {}
    for i in ids:
        vals[i] = await page.input_value(f"#{i}")
    # Paid-by select -> read selected option text
    vals["ctl00_cph_ddlPaidBy"] = await page.evaluate(
        "() => { const s=document.getElementById('ctl00_cph_ddlPaidBy'); return s.options[s.selectedIndex].text; }"
    )
    print(f"\n==== {label} order={order_id} filled={filled} ====")
    for k, v in vals.items():
        print(f"  {k} = {v!r}")
    print(f"  dialogs={dialogs}")
    matched = [m for m in console_msgs if "<=" in m]
    print(f"  matched[]={matched[:40]}")
    assert not dialogs, f"Dialog fired: {dialogs}"
    return vals, matched


def test_source_has_no_alert_and_live_fetch():
    src = open(BOOKMARKLET_SRC).read()
    assert "alert(" not in src, "bookmarklet.js must not use alert()"
    assert "/orders/${order.id}/autofill" in src
    assert "sectionParty" in src


def test_order_a_and_b_autofill():
    a, b = seed_orders()

    async def main():
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            ctx = await browser.new_context()
            page = await ctx.new_page()

            # -------- ORDER A --------
            va, ma = await run_order(page, a, "ORDER A")
            assert va["ctl00_cph_txtPurBy"] == "Ramesh Patel"
            assert va["ctl00_cph_txtDesc"] == "Lease agreement for shop premises"
            assert va["ctl00_cph_txtConsidr"] == "500000"
            assert va["ctl00_cph_txtFp"] == "A Kumar"
            assert va["ctl00_cph_txtFpAdd1"] == "12 MG Road Ahmedabad"
            assert va["ctl00_cph_txtFpAdd2"] == "Navrangpura"
            assert va["ctl00_cph_txtFpMob"] == "9111111111"
            assert va["ctl00_cph_txtFpEmail"] == "akumar@test.com"
            assert va["ctl00_cph_txtSp"] == "B Shah"
            assert va["ctl00_cph_txtSpAdd1"] == "7 Ring Road Surat"
            assert va["ctl00_cph_txtSpAdd2"] == "Adajan"
            assert va["ctl00_cph_txtSpMob"] == "9222222222"
            assert va["ctl00_cph_txtSpEmail"] == "bshah@test.com"
            assert va["ctl00_cph_txtDuty"] == "29400"
            assert va["ctl00_cph_ddlPaidBy"] == "First Party"
            # Duty section leak check
            assert va["ctl00_cph_txtDuty"] != "B Shah"
            # Cross-section leak check via console matched[]
            joined = "\n".join(ma)
            assert "txtSp <= first_party" not in joined
            assert "txtFp <= second_party" not in joined
            assert "txtSpAdd1 <= first_party" not in joined
            assert "txtFpAdd1 <= second_party" not in joined
            assert "txtDuty <= second_party_name" not in joined
            assert "ddlPaidBy <= second_party_name" not in joined

            # -------- ORDER B --------
            page2 = await ctx.new_page()
            page2.on("console", lambda m: None)  # local override noise fine; main listener is on `page`
            vb, mb = await run_order(page2, b, "ORDER B")
            assert vb["ctl00_cph_txtFpAdd1"] == "", f"FP addr1 should be blank, got {vb['ctl00_cph_txtFpAdd1']!r}"
            assert vb["ctl00_cph_txtSpEmail"] == "", f"SP email should be blank, got {vb['ctl00_cph_txtSpEmail']!r}"
            # Name/other must still be present and not leak into the blanks
            assert vb["ctl00_cph_txtFp"] == "A Kumar"
            assert vb["ctl00_cph_txtSp"] == "B Shah"
            assert vb["ctl00_cph_txtSpAdd1"] == "7 Ring Road Surat"
            assert vb["ctl00_cph_txtDuty"] == "29400"
            assert vb["ctl00_cph_ddlPaidBy"] == "First Party"

            await browser.close()

    asyncio.run(main())


if __name__ == "__main__":
    test_source_has_no_alert_and_live_fetch()
    test_order_a_and_b_autofill()
    print("ALL PASS")
