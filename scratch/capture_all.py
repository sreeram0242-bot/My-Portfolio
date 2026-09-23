import subprocess
import os
import time

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"C:\Portfolio\temp_screens"
os.makedirs(OUTPUT_DIR, exist_ok=True)

demos = [
    ("gymflow", 1600, 1000, "pc"),
    ("clouddine", 1600, 1000, "pc"),
    ("cafebistro", 1600, 1000, "pc"),
    ("engineers-kitchen-pos", 1600, 1000, "pc"),
    ("royal-carwash", 1600, 1000, "pc"),
    ("spotdown", 1600, 1000, "pc"),
    ("whatsapp-crm", 1600, 1000, "pc"),
    ("engineers-kitchen-mobile", 1600, 1000, "mobile_on_pc"),
    ("happy-events", 1600, 1000, "mobile_on_pc"),
]

for name, w, h, mode in demos:
    url = f"http://localhost:8080/demos/{name}/index.html"
    out_file = os.path.join(OUTPUT_DIR, f"{name}_{mode}.png")
    args = [
        CHROME,
        "--headless",
        "--disable-gpu",
        f"--window-size={w},{h}",
        f"--screenshot={out_file}",
        url
    ]
    print(f"Capturing {name} ({mode})...")
    subprocess.run(args, capture_output=True, timeout=15)

print("Done! Captured files:")
for f in os.listdir(OUTPUT_DIR):
    p = os.path.join(OUTPUT_DIR, f)
    print(f, os.path.getsize(p), "bytes")
