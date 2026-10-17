/* Сканирует папки с артом и генерирует js/art.auto.js (сайт подхватывает сам).
   Папки-соглашения:
     assets/bg/home.<ext>                  подложка главной
     assets/bg/<игра>.<ext>                подложка экрана радио (v, iv, sa, vc, iii)
     assets/logos/<игра>/<id станции>.<ext> логотип станции (png/jpg/webp/svg)
   Запуск:  node tools/add-art.mjs   (генерация сразу; файл коммитится вместе с артом)
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const EXT = /\.(png|jpe?g|webp|svg)$/i;
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js", "config.js"), "utf8"), ctx);
const CFG = ctx.window.RADIO_CONFIG;

const pick = (dir, base) => {
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).filter((f) => f.startsWith(base + ".") && EXT.test(f))
    .sort((a, b) => a.localeCompare(b))[0];
  return hit ? path.posix.join(...path.relative(ROOT, dir).split(path.sep), hit) : null;
};

const art = { home: "", games: {}, logos: {} };
art.home = pick(path.join(ROOT, "assets", "bg"), "home") || "";
for (const g of CFG.games) {
  const bg = pick(path.join(ROOT, "assets", "bg"), g.id);
  if (bg) art.games[g.id] = bg;
  for (const st of g.stations) {
    const lg = pick(path.join(ROOT, "assets", "logos", g.id), st.id);
    if (lg) art.logos[g.id + "/" + st.id] = lg;
  }
}

fs.writeFileSync(path.join(ROOT, "js", "art.auto.js"),
  "/* Сгенерировано tools/add-art.mjs — не править руками. */\nwindow.RADIO_ART = " +
  JSON.stringify(art, null, 2) + ";\n");

console.log("подложка главной:", art.home || "— нет файла assets/bg/home.*");
console.log("подложки игр:    ", Object.keys(art.games).length ? JSON.stringify(art.games) : "— нет файлов assets/bg/<игра>.*");
console.log("логотипов:       ", Object.keys(art.logos).length ? Object.keys(art.logos).join(", ") : "— нет файлов assets/logos/…");
