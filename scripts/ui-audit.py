"""UI audit harness (Playwright, Python). Not part of the app build.

Usage (from repo root, after `npm ci && npx vite build`):
  pip install playwright axe-core-not-needed   # playwright only; axe-core comes from node_modules
  npm i --no-save axe-core
  npx vite preview --port 4173 &
  RF_URL=http://127.0.0.1:4173/ RF_CARD=/path/to/card.json RF_OUT=/tmp/shots python3 scripts/ui-audit.py

What it does: imports RF_CARD, walks Library/Details/Lorebook/Prompt/Assist/Test/Enhancer/Settings/Guide
at 390x844 (dark, then light for Library/Guide) and 1280x800, saves screenshots, and prints per-screen
metrics: horizontal overflow, tap targets under 44px, text under 12px, axe violations (non-minor).
Also checks the Back button against the Guide overlay. bypass_csp is on only so axe can be injected.
"""
import asyncio, json, os, re
from playwright.async_api import async_playwright

URL = os.environ.get("RF_URL", "http://127.0.0.1:4173/")
CARD = os.environ["RF_CARD"]
OUT = os.environ.get("RF_OUT", "/tmp/rf-shots")
CHROME = os.environ.get("RF_CHROME")  # optional executable_path
AXE = open(os.path.join(os.getcwd(), "node_modules/axe-core/axe.min.js")).read()
os.makedirs(OUT, exist_ok=True)

JS_AUDIT = """
() => {
  const vis = e => { const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'; };
  let small = 0; const sizes = {};
  document.querySelectorAll('button,a,[role=button],[role=tab],input,select,textarea,summary').forEach(e=>{ if(!vis(e)) return; const r=e.getBoundingClientRect(); if(r.width<44||r.height<44) small++; });
  document.querySelectorAll('body *').forEach(e=>{ if(!vis(e)) return; if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) return; const fs=parseFloat(getComputedStyle(e).fontSize); if(fs<12) sizes[fs]=(sizes[fs]||0)+1; });
  return {overflowX: document.documentElement.scrollWidth > innerWidth + 1, small, sizes};
}
"""
res = {"back": {}, "screens": {}}

async def axe(pg):
    await pg.add_script_tag(content=AXE)
    return await pg.evaluate("async()=>{const r=await axe.run(document,{runOnly:['wcag2a','wcag2aa','best-practice']}); return r.violations.filter(v=>v.impact!=='minor').map(v=>v.id+':'+v.nodes.length)}")

async def snap(pg, name):
    await pg.wait_for_timeout(700)
    await pg.screenshot(path=f"{OUT}/{name}.png")
    a = await pg.evaluate(JS_AUDIT)
    res["screens"][name] = {"overflowX": a["overflowX"], "small<44": a["small"], "text<12px": a["sizes"], "axe": await axe(pg)}

async def new_ctx(b, w, h, mobile):
    return await b.new_context(viewport={"width": w, "height": h}, has_touch=mobile, is_mobile=mobile,
                               device_scale_factor=2 if mobile else 1, service_workers="block", bypass_csp=True)

async def import_card(pg):
    await pg.goto(URL); await pg.wait_for_timeout(1200)
    await pg.locator("input[type=file]").first.set_input_files(CARD); await pg.wait_for_timeout(2500)

async def main():
    name = json.load(open(CARD))["data"]["name"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"]) if CHROME else await p.chromium.launch(args=["--no-sandbox"])
        pg = await (await new_ctx(b, 390, 844, True)).new_page()
        h = lambda: pg.evaluate("location.hash")
        guide = lambda: pg.evaluate("!!document.querySelector('[role=dialog][aria-label*=Guide]')")
        await import_card(pg)
        await snap(pg, "01_library_with_card")
        h0 = await h()
        await pg.get_by_role("button", name="Guide").first.click(); await pg.wait_for_timeout(600)
        await snap(pg, "02_guide_dark")
        await pg.go_back(); await pg.wait_for_timeout(600)
        res["back"]["Back closes guide, route unchanged, still in app"] = (not await guide()) and (await h()) == h0 and pg.url.startswith(URL)
        await pg.get_by_alt_text(name).first.click(); await pg.wait_for_timeout(1200)
        await snap(pg, "03_details_top")
        for t, n in [("Lorebook", "04_lorebook"), ("Prompt", "05_prompt"), ("Assist", "06_assist")]:
            await pg.get_by_role("button", name=t, exact=False).first.click(); await snap(pg, n)
        await pg.get_by_role("button", name="Test", exact=True).first.click(); await snap(pg, "07_test")
        await pg.get_by_role("button", name="Enhancer", exact=False).first.click(); await snap(pg, "08_enhancer")
        await pg.get_by_role("button", name="Settings", exact=True).first.click(); await snap(pg, "09_settings")
        await pg.get_by_role("button", name="Light Theme").first.click(); await pg.wait_for_timeout(900)
        await pg.get_by_role("button", name="Library", exact=True).first.click(); await snap(pg, "10_library_light")
        await pg.get_by_role("button", name="Guide").first.click(); await pg.wait_for_timeout(800); await snap(pg, "11_guide_light")
        # desktop (own context, so import again)
        d = await (await new_ctx(b, 1280, 800, False)).new_page()
        await import_card(d)
        await d.get_by_alt_text(name).first.click(); await d.wait_for_timeout(1200); await snap(d, "20_desktop_details")
        await d.get_by_role("button", name="Lorebook", exact=False).first.click(); await snap(d, "21_desktop_lorebook")
        await b.close()

try:
    asyncio.run(main())
except Exception as e:  # keep partial results
    res["CRASH"] = str(e)[:300]
print(json.dumps(res, indent=1))
