import subprocess
import os

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
AUDIT_DIR = r"C:\Portfolio\temp_audit"
os.makedirs(AUDIT_DIR, exist_ok=True)

UA_MOBILE = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"

tasks = [
    ("pc_hero", 1600, 1000, None),
    ("pc_page_upper", 1600, 2500, None),
    ("pc_page_lower", 1600, 5000, None),
    ("mobile_hero", 390, 844, UA_MOBILE),
    ("mobile_page_tall", 390, 4500, UA_MOBILE),
    ("mobile_page_full", 390, 8500, UA_MOBILE),
]

for name, w, h, ua in tasks:
    out = os.path.join(AUDIT_DIR, f"{name}.png")
    args = [
        CHROME,
        "--headless",
        "--disable-gpu",
        f"--window-size={w},{h}",
        f"--screenshot={out}"
    ]
    if ua:
        args.append(f"--user-agent={ua}")
    args.append("http://localhost:8080/index.html")
    print(f"Capturing {name} ({w}x{h})...")
    subprocess.run(args, capture_output=True, timeout=15)

print("Done! Files:")
for f in os.listdir(AUDIT_DIR):
    p = os.path.join(AUDIT_DIR, f)
    print(f, os.path.getsize(p), "bytes")
