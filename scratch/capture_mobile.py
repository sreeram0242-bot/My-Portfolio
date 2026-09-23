import subprocess
import os

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"C:\Portfolio\temp_screens"
os.makedirs(OUTPUT_DIR, exist_ok=True)

demos = [
    "engineers-kitchen-mobile",
    "happy-events",
    "gymflow",
    "spotdown",
    "royal-carwash"
]

UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"

for name in demos:
    url = f"http://localhost:8080/demos/{name}/index.html"
    out_file = os.path.join(OUTPUT_DIR, f"{name}_mobile.png")
    args = [
        CHROME,
        "--headless",
        "--disable-gpu",
        "--window-size=412,915",
        f"--user-agent={UA}",
        f"--screenshot={out_file}",
        url
    ]
    print(f"Capturing mobile {name}...")
    subprocess.run(args, capture_output=True, timeout=15)

print("Done! Captured mobile files:")
for name in demos:
    p = os.path.join(OUTPUT_DIR, f"{name}_mobile.png")
    if os.path.exists(p):
        print(f"{name}_mobile.png", os.path.getsize(p), "bytes")
