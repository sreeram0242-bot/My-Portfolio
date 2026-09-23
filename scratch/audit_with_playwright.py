import json
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

def audit_mobile():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=CHROME_PATH)
        # Emulate iPhone 14 / modern phone
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()
        page.goto('http://localhost:8080/index.html', wait_until='networkidle')
        page.wait_for_timeout(1000)
        
        info = page.evaluate('''() => {
            const w = window.innerWidth;
            const overflow = [];
            document.querySelectorAll('*').forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.right > w + 2 || r.width > w + 2) {
                    overflow.push({
                        tag: el.tagName,
                        id: el.id,
                        cls: (el.className || '').toString(),
                        right: Math.round(r.right),
                        width: Math.round(r.width),
                        overflowRight: Math.round(r.right - w)
                    });
                }
            });
            return {
                windowWidth: w,
                docScrollWidth: document.documentElement.scrollWidth,
                bodyScrollWidth: document.body.scrollWidth,
                overflowCount: overflow.length,
                topOverflow: overflow.slice(0, 30)
            };
        }''')
        
        print("=== MOBILE AUDIT RESULTS ===")
        print(json.dumps(info, indent=2))
        
        # Save screenshot
        page.screenshot(path="temp_audit/playwright_mobile_hero.png")
        page.screenshot(path="temp_audit/playwright_mobile_full.png", full_page=True)
        browser.close()

if __name__ == '__main__':
    audit_mobile()
