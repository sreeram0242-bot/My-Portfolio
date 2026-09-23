import subprocess

script = """
(() => {
  const el = document.querySelector('.hero-title');
  const win = document.querySelector('.pc-browser-content');
  const body = document.body;
  const header = document.querySelector('#site-header');
  return JSON.stringify({
    titleText: el ? el.innerText : 'NOT FOUND',
    titleRect: el ? el.getBoundingClientRect() : null,
    winRect: win ? win.getBoundingClientRect() : null,
    bodyChildren: Array.from(body.children).map(c => c.className),
    headerRect: header ? header.getBoundingClientRect() : null
  });
})()
"""

html = f"""
<!DOCTYPE html>
<html><body>
<script>
fetch('http://localhost:8080/demos/royal-carwash/index.html')
  .then(r => r.text())
  .then(t => console.log('Fetched len', t.length));
</script>
</body></html>
"""
print("Running diagnostic...")
