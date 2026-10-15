/* =========================================================================
   editor.js — визуальное редактирование config.js + экспорт файла
   ========================================================================= */
(function () {
  const CFG = window.RADIO_CONFIG;
  const A = window.radioAudio;
  const ORIGINAL = JSON.parse(JSON.stringify({ meta: CFG.meta, games: CFG.games }));
  let data = JSON.parse(JSON.stringify(ORIGINAL));

  /* Служебный блок config.js (функции + генератор иконок) подтягивается прямо
     из файла, чтобы в экспортируемом config.js не было дублей и расхождений. */
  let HELPERS = "";
  const HELPER_MARK = "/* =========================================================================\n   Служебные функции конфига";
  async function loadHelpers() {
    try {
      const txt = await (await fetch("js/config.js", { cache: "no-store" })).text();
      const i = txt.indexOf(HELPER_MARK);
      if (i > -1) HELPERS = "\n" + txt.slice(i);
    } catch (e) { /* file:// — fetch недоступен */ }
    if (!HELPERS) HELPERS = "\n/* ВНИМАНИЕ: служебный блок не подтянулся (сайт открыт не по http://). Скопируй хвост исходного js/config.js вручную. */\n";
  }
  loadHelpers();

  const $ = (s) => document.querySelector(s);
  const gameSel = $("#gameSel"), out = $("#out"), listEl = $("#stationList");

  function toast(msg, err) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("err", !!err);
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 3000);
  }
  const cur = () => data.games.find((g) => g.id === gameSel.value) || data.games[0];

  /* ------------------------------ селекты ------------------------------ */
  function fillGames() {
    gameSel.innerHTML = data.games
      .map((g) => `<option value="${g.id}">${g.num} — ${g.name} (${g.stations.length})</option>`)
      .join("");
  }

  /* ---------------------------- список станций --------------------------- */
  function render() {
    const g = cur();
    listEl.innerHTML = "";
    g.stations.forEach((st, i) => {
      const mode = CFG.stationMode(st) === "audio" ? "аудио" : "демо";
      const wrap = document.createElement("div");
      wrap.className = "stn";
      wrap.innerHTML = `
        <span class="ico">${CFG.stationIcon(st, 34, 8)}</span>
        <span style="flex:1;min-width:0">
          <span class="nm" data-f="name"></span>
          <span class="mt" data-f="meta"></span>
        </span>
        <span class="pill ${mode === "аудио" ? "ok" : "demo"}">${mode}</span>
        <button class="btn" data-a="edit">Править</button>
        <button class="btn" data-a="del">✕</button>`;
      wrap.querySelector('[data-f="name"]').textContent = st.name;
      const tracks = CFG.tracksOf(st);
      wrap.querySelector('[data-f="meta"]').textContent =
        (st.tagline || "") + " · " + (tracks.length ? tracks.length + " трек(ов): " + tracks.map((t) => t.type).join(", ") : "звук генерируется браузером");
      wrap.querySelector('[data-a="del"]').addEventListener("click", () => {
        if (!confirm(`Удалить станцию «${st.name}»?`)) return;
        g.stations.splice(i, 1); render();
      });
      wrap.querySelector('[data-a="edit"]').addEventListener("click", () => editStation(g, st, i));
      listEl.appendChild(wrap);
    });
    if (!g.stations.length) listEl.innerHTML = '<p class="lead">Станций нет — нажми «+ Станция».</p>';
  }

  /* ------------------------------ модалка -------------------------------- */
  function modal(title, bodyHtml, onOk) {
    const old = document.getElementById("modal");
    if (old) old.remove();
    const m = document.createElement("div");
    m.id = "modal";
    m.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(3,5,9,.78);backdrop-filter:blur(6px);display:grid;place-items:center;padding:20px";
    m.innerHTML = `<div style="width:min(680px,100%);max-height:90vh;overflow:auto;background:#0a0e14;border:1px solid rgba(255,255,255,.13);border-radius:16px;padding:22px;box-shadow:0 40px 90px rgba(0,0,0,.8)">
      <h2 style="margin:0 0 14px;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent)">${title}</h2>
      <div>${bodyHtml}</div>
      <div class="row" style="margin-top:18px;justify-content:flex-end">
        <button class="btn" data-x>Отмена</button>
        <button class="btn primary" data-ok>Сохранить</button>
      </div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.hasAttribute("data-x")) m.remove(); });
    m.querySelector("[data-ok]").addEventListener("click", () => { onOk(m); m.remove(); });
    // живые иконки
    const live = () => {
      const icon = m.querySelector("#mIcon");
      if (!icon) return;
      icon.innerHTML = CFG.stationIcon({
        name: m.querySelector("#mName").value || "?",
        accent: m.querySelector("#mAccent").value,
        bg: m.querySelector("#mBg").value,
        motif: m.querySelector("#mMotif").value
      }, 46, 11);
    };
    m.querySelectorAll("#mName,#mAccent,#mBg,#mMotif").forEach((el) => el.addEventListener("input", live));
    live();
    // треки
    const tr = m.querySelector("#mTracks");
    if (tr) {
      const add = () => {
        const row = document.createElement("div");
        row.className = "row";
        row.style.cssText = "margin-bottom:6px";
        row.innerHTML = `<select class="t-type" style="width:110px">
            <option value="file">file</option><option value="stream">stream</option><option value="demo">demo</option></select>
          <input type="text" class="t-src" placeholder="v/track.mp3 или https://…" style="flex:1;min-width:180px">
          <input type="text" class="t-title" placeholder="Название (необязательно)" style="flex:1;min-width:140px">
          <button class="btn" data-del>✕</button>`;
        row.querySelector("[data-del]").addEventListener("click", () => row.remove());
        tr.appendChild(row);
      };
      m.querySelector("#mAddTrack").addEventListener("click", add);
      if (!tr.children.length) add();
    }
  }

  function editStation(g, st, i) {
    const motifs = CFG.motifs().map((k) => `<option ${k === st.motif ? "selected" : ""}>${k}</option>`).join("");
    const tracks = CFG.tracksOf(st);
    const isNew = !st;
    const s = st || { name: "Новая станция", tagline: "", accent: "#7fd4ff", bg: "#0b1119", motif: "disc", demo: { key: "C", bpm: 100, prog: "rock", drums: "rock", noise: 0.02 } };
    modal(isNew ? "Новая станция" : "Станция: " + st.name, `
      <div class="row" style="align-items:center;gap:14px;margin-bottom:6px">
        <span id="mIcon" style="width:46px;height:46px;flex:none"></span>
        <div style="flex:1">
          <label>Название</label><input type="text" id="mName" value="${s.name}">
        </div>
      </div>
      <div class="grid2">
        <div><label>Подпись (жанр)</label><input type="text" id="mTag" value="${s.tagline || ""}"></div>
        <div><label>Иконка (мотив)</label><select id="mMotif">${motifs}</select></div>
        <div><label>Цвет акцента</label><input type="text" id="mAccent" value="${s.accent || "#7fd4ff"}"></div>
        <div><label>Цвет фона иконки</label><input type="text" id="mBg" value="${s.bg || "#0b1119"}"></div>
      </div>
      <label>Треки (источники звука)</label>
      <div id="mTracks"></div>
      <div class="row" style="margin-top:8px"><button class="btn" id="mAddTrack">+ трек</button>
        <span class="mt" style="color:#8b96a7;font-size:11.5px">пусто = звук генерируется браузером (demo)</span></div>
      <div class="grid2" style="margin-top:14px">
        <div><label>Демо: тональность</label><input type="text" id="mKey" value="${(s.demo && s.demo.key) || "C"}"></div>
        <div><label>Демо: темп (BPM)</label><input type="text" id="mBpm" value="${(s.demo && s.demo.bpm) || 100}"></div>
        <div><label>Демо: стиль</label><select id="mProg">${["house","rock","metal","hop","funk","soul","jazz","amb","reggae","country","talk","world"].map((p) => `<option ${s.demo && s.demo.prog === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
        <div><label>Демо: барабаны</label><select id="mDrums">${["house","rock","metal","hop","funk","reggae","country","jazz","none"].map((p) => `<option ${s.demo && s.demo.drums === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
      </div>
      <p class="lead" style="margin:12px 0 0;font-size:12px">Треки вставляются в список по порядку. ID3-теги mp3 читаются автоматически, так что «Название» можно не заполнять.</p>
    `, (m) => {
      const tracks = [...m.querySelectorAll("#mTracks .row")].map((r) => {
        const type = r.querySelector(".t-type").value;
        const src = r.querySelector(".t-src").value.trim();
        const title = r.querySelector(".t-title").value.trim();
        if (type === "demo") return { type: "demo" };
        if (!src) return null;
        return { type, src, title: title || undefined };
      }).filter(Boolean);
      const obj = {
        id: (s.id || (s.name || "st").toLowerCase().replace(/[^a-z0-9]+/g, "-")).toString(),
        name: m.querySelector("#mName").value.trim() || "Без названия",
        tagline: m.querySelector("#mTag").value.trim(),
        accent: m.querySelector("#mAccent").value.trim(),
        bg: m.querySelector("#mBg").value.trim(),
        motif: m.querySelector("#mMotif").value,
        demo: {
          key: m.querySelector("#mKey").value.trim() || "C",
          bpm: parseInt(m.querySelector("#mBpm").value, 10) || 100,
          prog: m.querySelector("#mProg").value,
          drums: m.querySelector("#mDrums").value,
          noise: (s.demo && s.demo.noise) || 0.02
        }
      };
      if (tracks.length) obj.tracks = tracks;
      if (isNew) g.stations.push(obj);
      else g.stations[i] = obj;
      render(); fillGames();
      toast("Сохранено в памяти — не забудь сгенерировать и скачать config.js");
    });
    // предзаполнение треков (после создания DOM)
    const tr = document.querySelector("#mTracks");
    if (tr && tracks.length) {
      tr.innerHTML = "";
      tracks.forEach((t) => {
        const row = document.createElement("div");
        row.className = "row"; row.style.cssText = "margin-bottom:6px";
        row.innerHTML = `<select class="t-type" style="width:110px">
            <option value="file" ${t.type === "file" ? "selected" : ""}>file</option>
            <option value="stream" ${t.type === "stream" ? "selected" : ""}>stream</option>
            <option value="demo" ${t.type === "demo" ? "selected" : ""}>demo</option></select>
          <input type="text" class="t-src" value="${t.src || ""}" placeholder="v/track.mp3 или https://…" style="flex:1;min-width:180px">
          <input type="text" class="t-title" value="${t.title || ""}" placeholder="Название (необязательно)" style="flex:1;min-width:140px">
          <button class="btn" data-del>✕</button>`;
        row.querySelector("[data-del]").addEventListener("click", () => row.remove());
        tr.appendChild(row);
      });
    }
  }

  /* ------------------------------- экспорт ------------------------------- */
  function q(v) { return typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v); }
  function gen() {
    const L = [];
    L.push("/* GTA RADIO — config.js (сгенерировано редактором) */");
    L.push("window.RADIO_CONFIG = {");
    L.push("  meta: " + JSON.stringify(data.meta, null, 2).replace(/\n/g, "\n  ") + ",");
    L.push("  games: [");
    data.games.forEach((g, gi) => {
      L.push("    {");
      L.push(`      id: ${q(g.id)}, num: ${q(g.num)}, name: ${q(g.name)}, year: ${g.year}, city: ${q(g.city || "")},`);
      L.push(`      ui: ${q(g.ui)}, theme: ${q(g.theme)}, accent: ${q(g.accent)}, tagline: ${q(g.tagline || "")},`);
      L.push("      stations: [");
      g.stations.forEach((s, si) => {
        const parts = [
          `id: ${q(s.id)}`, `name: ${q(s.name)}`, `tagline: ${q(s.tagline || "")}`,
          `accent: ${q(s.accent)}`, `bg: ${q(s.bg)}`, `motif: ${q(s.motif)}`
        ];
        if (s.tracks && s.tracks.length) {
          parts.push("tracks: [" + s.tracks.map((t) =>
            "{" + ["type", "src", "title", "artist"].filter((k) => t[k] != null).map((k) => `${k}: ${q(t[k])}`).join(", ") + "}").join(", ") + "]");
        }
        if (s.demo) {
          parts.push("demo: { " + Object.keys(s.demo).map((k) => `${k}: ${q(s.demo[k])}`).join(", ") + " }");
        }
        L.push(`        { ${parts.join(", ")} }${si < g.stations.length - 1 ? "," : ""}`);
      });
      L.push("      ]");
      L.push("    }" + (gi < data.games.length - 1 ? "," : ""));
    });
    L.push("  ]");
    L.push("};");
    L.push("");
    L.push("/* служебные функции + генератор иконок — не удаляй этот блок */");
    L.push(HELPERS);
    return L.join("\n");
  }


  /* ------------------------------- кнопки -------------------------------- */
  gameSel.addEventListener("change", render);
  $("#btnOpen").addEventListener("click", () => window.open("radio.html?game=" + cur().id, "_blank"));
  $("#btnAddSt").addEventListener("click", () => editStation(cur(), null, -1));
  $("#btnGen").addEventListener("click", () => { out.value = gen(); toast("Готово — можно скачать или скопировать"); });
  $("#btnCopy").addEventListener("click", async () => {
    if (!out.value) out.value = gen();
    try { await navigator.clipboard.writeText(out.value); toast("Скопировано в буфер обмена"); }
    catch (_) { out.select(); toast("Не вышло — выдели текст вручную", true); }
  });
  $("#btnDl").addEventListener("click", () => {
    const blob = new Blob([out.value || gen()], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "config.js";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Скачан config.js — замени им js/config.js в проекте");
  });
  $("#btnApply").addEventListener("click", () => {
    try {
      data.meta && (CFG.meta = data.meta);
      CFG.games = JSON.parse(JSON.stringify(data.games));
      toast("Применено в этой вкладке — открой «Экран радио», чтобы послушать");
    } catch (e) { toast("Ошибка применения: " + e.message, true); }
  });
  $("#btnReset").addEventListener("click", () => {
    if (!confirm("Вернуть исходный конфиг? Несохранённые правки пропадут.")) return;
    data = JSON.parse(JSON.stringify(ORIGINAL));
    fillGames(); render(); out.value = "";
    toast("Сброшено");
  });

  // Тестовый плеер: играет файл/поток напрямую (путь вводится как есть,
  // например "audio/v/track.mp3" или полный https-URL).
  const testEl = new Audio();
  testEl.crossOrigin = "anonymous";
  testEl.volume = 0.8;
  $("#btnTest").addEventListener("click", async () => {
    const src = $("#testSrc").value.trim();
    if (!src) return toast("Вставь путь или ссылку", true);
    try {
      testEl.src = src;
      await testEl.play();
      toast("Играю: " + src);
    } catch (e) {
      toast("Не сыграло: " + e.message + " (проверь путь, CORS и что сайт открыт по http://)", true);
    }
  });
  $("#btnStop").addEventListener("click", () => {
    testEl.pause(); A.stop(); toast("Остановлено");
  });

  fillGames();
  render();
})();
