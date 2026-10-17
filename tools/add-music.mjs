/* Подключатель музыки без ручных правок конфига.
   Соглашение по папкам:  audio/<игра>/<id станции>/<файлы>
   Пример:               audio/v/rock/01-chrome-highway.mp3
                         audio/sa/groove/track.mp3
   (id станций видны в js/config.js: rock, surf, groove, bounce, flash …)

   Запуск:
     node tools/add-music.mjs            # показать, что найдено и что изменится
     node tools/add-music.mjs --apply    # вписать треки в js/config.js

   После --apply: открой сайт локально (python3 -m http.server 8000),
   проверь звук и закоммить изменённый js/config.js + папки audio/.
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APPLY = process.argv.includes("--apply");
const EXT = /\.(mp3|ogg|oga|m4a|aac|wav|flac|opus)$/i;

/* читаем конфиг как есть */
const cfgPath = path.join(ROOT, "js", "config.js");
let cfgText = fs.readFileSync(cfgPath, "utf8");
const ctx = { window: {} };
vm.runInNewContext(cfgText, ctx);
const CFG = ctx.window.RADIO_CONFIG;

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (EXT.test(e.name)) out.push(p);
  }
  return out.sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
};

let changed = 0;
for (const game of CFG.games) {
  for (const st of game.stations) {
    const dir = path.join(ROOT, "audio", game.id, st.id);
    const files = walk(dir);
    if (!files.length) continue;
    const tracks = files.map((f) => {
      const rel = path.relative(path.join(ROOT, "audio"), f).split(path.sep).join("/");
      return `{ type: "file", src: "${rel}" }`;
    });
    const block = `tracks: [${tracks.join(", ")}]`;
    /* станции в config.js лежат по одной на строку — правим безопасно */
    const re = new RegExp(`(\\{\\s*id: "${st.id}"[^\\n]*?)(tracks: \\[[^\\]]*\\], ?)?(demo:)`);
    if (!re.test(cfgText)) {
      console.log(`! не нашёл строку станции ${game.id}/${st.id} — пропиши треки вручную`);
      continue;
    }
    cfgText = cfgText.replace(re, `$1${block}, $3`);
    changed++;
    console.log(`+ ${game.id}/${st.id}: ${files.length} трек(ов)`);
    files.forEach((f) => console.log("    " + path.relative(ROOT, f)));
  }
}

if (!changed) {
  console.log("\nНичего не найдено. Разложи mp3 по папкам audio/<игра>/<id станции>/");
  console.log("id станций: " + CFG.games.map((g) => `${g.id}: ${g.stations.map((s) => s.id).join(", ")}`).join("\n            "));
  process.exit(0);
}

if (APPLY) {
  fs.writeFileSync(cfgPath, cfgText);
  console.log(`\n✅ js/config.js обновлён (${changed} станций). Проверь сайт и закоммить.`);
} else {
  console.log(`\nГотово к применению: ${changed} станций. Запусти с --apply, чтобы вписать в js/config.js.`);
}
