import subprocess
import json

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
UA_MOBILE = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"

script = """
(() => {
  const w = window.innerWidth;
  const overflowing = [];
  document.querySelectorAll('*').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right > w + 1) {
      overflowing.push({
        tag: el.tagName,
        cls: el.className,
        id: el.id,
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        overflowAmount: Math.round(rect.right - w)
      });
    }
  });
  return JSON.stringify({
    viewportWidth: w,
    bodyScrollWidth: document.body.scrollWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    overflowingCount: overflowing.length,
    overflowing: overflowing.slice(0, 20)
  });
})()
"""

# Let's write this script into a temporary test page or check via node/chrome
print("Target script ready")
