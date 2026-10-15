#!/usr/bin/env python3
"""Собирает demo.html — single-file версию сайта (все стили и скрипты внутри).
Запуск из корня проекта:  python3 tools/build-demo.py
Зачем: такой файл открывается двойным кликом и работает в песочницах/вьюверах
без сети (шрифты тогда просто падают на системные fallback)."""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p): return io.open(os.path.join(ROOT, p), encoding="utf-8").read()

css = rd("css/style.css")
css = re.sub(r'@import url\([^)]*\);?\s*', "", css, count=1)   # шрифты из сети — вон

def between(text, start, end):
    i = text.index(start)
    j = text.index(end, i)
    return text[i:j + len(end)]

index_html = rd("index.html")
radio_html = rd("radio.html")

home_body  = between(index_html, '<div class="home">', "</div>\n\n<script")
home_body  = home_body[: -len("<script")]          # маркер конца не тащим в разметку
home_script = between(index_html, "<script>\n(function () {", "</script>")
home_script = home_script.replace("<script>", "", 1).replace("</script>", "", 1)
radio_body = between(radio_html, '<div class="stage">', '<div class="toast" id="toast"></div>')

cfg   = rd("js/config.js")
audio = rd("js/audio.js")
radio = rd("js/radio.js")

ROUTER = """
/* ---------- single-file роутер: главная <-> экран радио ---------- */
(function () {
  const home = document.getElementById('screenHome');
  const rad  = document.getElementById('screenRadio');
  function showHome() {
    rad.hidden = true; home.hidden = false;
    document.body.className = '';
    document.documentElement.style.setProperty('--accent', '#7fd4ff');
    document.title = 'GTA RADIO — фанатское радио из игр серии';
    window.radioAudio.stop();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }
  function showRadio(g, st) {
    home.hidden = true; rad.hidden = false;
    window.__startRadio(g, st || 0);
    if (window.__radioKick) window.__radioKick();
  }
  window.__showHome = showHome;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.game');
    if (!a) return;
    e.preventDefault();
    const m = (a.getAttribute('href') || '').match(/game=([a-z0-9]+)/);
    showRadio(m ? m[1] : 'v', 0);
    history.replaceState(null, '', '#game=' + (m ? m[1] : 'v'));
  });
  window.addEventListener('hashchange', () => {
    const m = location.hash.match(/game=([a-z0-9]+)(?:&st=(\\d+))?/);
    if (m) showRadio(m[1], +(m[2] || 0));
    else if (!rad.hidden) showHome();
  });
  const m0 = location.hash.match(/game=([a-z0-9]+)(?:&st=(\\d+))?/);
  if (m0) { showRadio(m0[1], +(m0[2] || 0)); history.replaceState(null, '', '#game=' + m0[1]); }
})();
"""

demo = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GTA RADIO — фанатское радио из игр серии</title>
<meta name="description" content="Single-file демо: радиостанции из GTA V, IV, San Andreas, Vice City и GTA III.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23070b11'/%3E%3Ccircle cx='16' cy='16' r='10' fill='none' stroke='%237fd4ff' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='3' fill='%237fd4ff'/%3E%3C/svg%3E">
<style>
{css}
</style>
</head>
<body>
  <div class="bg"></div>
  <div class="grain"></div>
  <div class="vignette"></div>
  <div class="scanlines"></div>

  <div id="screenHome">
{home_body}
  </div>

  <div id="screenRadio" hidden>
{radio_body}
  </div>

<script>window.SINGLE = true;</script>
<script>
{cfg}
</script>
<script>
{audio}
</script>
<script>
{radio}
</script>
<script>
{home_script}
</script>
<script>
{ROUTER}
</script>
</body>
</html>
"""

out = os.path.join(ROOT, "demo.html")
io.open(out, "w", encoding="utf-8").write(demo)
print("demo.html собран:", len(demo), "байт ->", out)
