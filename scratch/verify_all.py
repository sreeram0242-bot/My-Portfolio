import os
import json
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"C:\Portfolio\temp_audit\verified"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=CHROME_PATH)
        
        # 1. MOBILE VERIFICATION
        print("--- 1. VERIFYING MOBILE (390x844) ---")
        mob_ctx = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        mob_page = mob_ctx.new_page()
        mob_page.goto("http://localhost:8080/index.html", wait_until="networkidle")
        mob_page.wait_for_timeout(600)
        
        # Check overflow
        mob_metrics = mob_page.evaluate('''() => {
            const w = window.innerWidth;
            const overflowing = [];
            document.querySelectorAll('*').forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.right > w + 2) {
                    overflowing.push({
                        tag: el.tagName,
                        cls: (el.className || '').toString().slice(0, 40),
                        id: el.id,
                        right: Math.round(r.right),
                        overflow: Math.round(r.right - w)
                    });
                }
            });
            return {
                windowWidth: w,
                bodyScrollWidth: document.body.scrollWidth,
                docScrollWidth: document.documentElement.scrollWidth,
                overflowCount: overflowing.length,
                overflowingSample: overflowing.slice(0, 10)
            };
        }''')
        print("Mobile Metrics:", json.dumps(mob_metrics, indent=2))
        
        # Take Mobile Hero Screenshot
        mob_page.screenshot(path=os.path.join(OUTPUT_DIR, "mobile_hero.png"))
        
        # Scroll through page to trigger reveals and test layout
        for i in range(12):
            mob_page.mouse.wheel(0, 500)
            mob_page.wait_for_timeout(150)
            
        mob_page.wait_for_timeout(500)
        mob_page.screenshot(path=os.path.join(OUTPUT_DIR, "mobile_full_page.png"), full_page=True)
        print("Mobile screenshots saved!")
        
        # 2. PC DESKTOP VERIFICATION
        print("\n--- 2. VERIFYING PC DESKTOP (1440x900) ---")
        pc_ctx = browser.new_context(
            viewport={'width': 1440, 'height': 900},
            device_scale_factor=1
        )
        pc_page = pc_ctx.new_page()
        pc_page.goto("http://localhost:8080/index.html", wait_until="networkidle")
        pc_page.wait_for_timeout(600)
        
        pc_metrics = pc_page.evaluate('''() => {
            return {
                windowWidth: window.innerWidth,
                bodyScrollWidth: document.body.scrollWidth,
                docScrollWidth: document.documentElement.scrollWidth
            };
        }''')
        print("PC Metrics:", json.dumps(pc_metrics, indent=2))
        
        pc_page.screenshot(path=os.path.join(OUTPUT_DIR, "pc_hero.png"))
        
        # Scroll PC page
        for i in range(8):
            pc_page.mouse.wheel(0, 700)
            pc_page.wait_for_timeout(150)
            
        pc_page.wait_for_timeout(500)
        pc_page.screenshot(path=os.path.join(OUTPUT_DIR, "pc_full_page.png"), full_page=True)
        print("PC screenshots saved!")
        
        # 3. INTERACTION TEST (Tabs & Modal)
        print("\n--- 3. TESTING INTERACTIVE FUNCTIONALITY ---")
        # Click "Mobile Apps (3)" tab
        mob_tab_btn = pc_page.query_selector('.glass-tab-btn[data-filter="mobile"]')
        if mob_tab_btn:
            mob_tab_btn.click()
            pc_page.wait_for_timeout(400)
            visible_cards = pc_page.evaluate('''() => {
                const cards = Array.from(document.querySelectorAll('.insta-project-card'));
                return cards.filter(c => !c.classList.contains('card-hidden')).length;
            }''')
            print(f"Filter 'Mobile Apps' clicked: {visible_cards} cards visible (expected 3)")
            pc_page.screenshot(path=os.path.join(OUTPUT_DIR, "pc_tab_filter_mobile.png"))
            
        # Click "All (9)" tab
        all_tab_btn = pc_page.query_selector('.glass-tab-btn[data-filter="all"]')
        if all_tab_btn:
            all_tab_btn.click()
            pc_page.wait_for_timeout(300)
            
        # Click "Tap info" to open modal
        tap_info_btn = pc_page.query_selector('.insta-tap-badge')
        if tap_info_btn:
            tap_info_btn.click()
            pc_page.wait_for_timeout(500)
            modal_visible = pc_page.evaluate('''() => {
                const m = document.getElementById('project-modal');
                return m && m.classList.contains('active');
            }''')
            print(f"Project modal opened successfully: {modal_visible}")
            pc_page.screenshot(path=os.path.join(OUTPUT_DIR, "pc_project_modal.png"))
            
            # Close modal
            close_btn = pc_page.query_selector('.modal-close')
            if close_btn:
                close_btn.click()
                pc_page.wait_for_timeout(300)
                
        # Click AI Lab tab "Offline POS"
        ai_tab = pc_page.query_selector('.ai-pill-btn[data-scenario="pos"]')
        if ai_tab:
            ai_tab.click()
            pc_page.wait_for_timeout(300)
            code_text = pc_page.evaluate('''() => {
                const out = document.getElementById('terminal-code-body');
                return out ? out.innerText.slice(0, 60) : '';
            }''')
            print(f"AI Terminal scenario switched to: {code_text}...")
            
        browser.close()
        print("\nAll verifications completed successfully!")

if __name__ == '__main__':
    verify()
