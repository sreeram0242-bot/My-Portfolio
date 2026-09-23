import subprocess
import json

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
UA_MOBILE = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"

# Create a test script to inspect elements
diag_html = """
<!DOCTYPE html>
<html>
<body>
<iframe id="test-frame" src="http://localhost:8080/index.html" style="width:390px; height:844px; border:none;"></iframe>
<pre id="output"></pre>
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    try {
      const frame = document.getElementById('test-frame');
      const doc = frame.contentDocument || frame.contentWindow.document;
      const w = 390;
      const results = [];
      doc.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > w + 2 || r.width > w + 2) {
          results.push({
            tag: el.tagName,
            cls: el.className,
            id: el.id,
            right: Math.round(r.right),
            width: Math.round(r.width),
            text: (el.innerText || '').slice(0, 40)
          });
        }
      });
      document.getElementById('output').textContent = JSON.stringify({
        docScrollWidth: doc.documentElement.scrollWidth,
        bodyScrollWidth: doc.body.scrollWidth,
        overflowCount: results.length,
        items: results.slice(0, 25)
      }, null, 2);
    } catch (e) {
      document.getElementById('output').textContent = 'Error: ' + e.message;
    }
  }, 1000);
});
</script>
</body>
</html>
"""

with open(r"C:\Portfolio\scratch\check_mobile_overflow.html", "w", encoding="utf-8") as f:
    f.write(diag_html)

print("Saved check_mobile_overflow.html")
