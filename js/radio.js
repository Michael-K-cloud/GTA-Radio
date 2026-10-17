/* =========================================================================
   radio.js — экран «в игре»: колесо/список станций, HUD, эквалайзер
   Вся логика обёрнута в window.__startRadio(gameId, stIndex), чтобы экран
   можно было инициализировать повторно (single-file демо, hash-роутинг).
   ========================================================================= */
(function () {
  const CFG = window.RADIO_CONFIG;
  const A = window.radioAudio;
  const $ = (s) => document.querySelector(s);
  const ART = () => window.RADIO_ART || { home: "", games: {}, logos: {} };
  const artImg = (gid, st) => {
    const a = (ART().logos || {})[gid + "/" + st.id];
    return a ? `<img class="art" src="${a}" alt="" onerror="this.remove()">` : "";
  };
  function setBG(src) {
    document.querySelectorAll(".bgimg").forEach((e) => e.remove());
    document.body.classList.toggle("has-bg", !!src);
    if (!src) return;
    const d = document.createElement("div");
    d.className = "bgimg";
    d.style.backgroundImage = `url("${src}")`;
    document.body.prepend(d);
  }

  let controller = null;   // AbortController для снятия слушателей при ре-ините

  function startRadio(gameId, stIndex) {
    if (controller) controller.abort();
    controller = new AbortController();
    const signal = controller.signal;
    const on = (el, ev, fn, opt) => el.addEventListener(ev, fn, Object.assign({ signal }, opt));

    const game = CFG.getGame(gameId || "v");
    const stations = game.stations || [];

    const ring = $("#ring"), rlist = $("#rlist");
    const wheelStage = $("#wheelStage"), listStage = $("#listStage");
    const hudIcon = $("#hudIcon"), hudName = $("#hudName"), hudTag = $("#hudTag");
    const hudTrack = $("#hudTrack"), hudArtist = $("#hudArtist"), hudLive = $("#hudLive");
    const nowStation = $("#nowStation"), nowTrack = $("#nowTrack");
    const tCur = $("#tCur"), tDur = $("#tDur"), progFill = $("#progFill");
    const toastEl = $("#toast");

    let idx = Math.min(stations.length - 1, Math.max(0, parseInt(stIndex || 0, 10) || 0));
    let playing = false;
    let chipEls = [], itemEls = [], miniCanvases = [];
    let demoTimer = null, demoTick = 0, progressTimer = null;

    /* сброс DOM колеса/списка от прошлой инициализации */
    ring.innerHTML = ""; rlist.innerHTML = "";
    ring.style.removeProperty("--rot");

    document.body.className = "theme-" + game.theme;
    setBG((ART().games || {})[game.id]);
    document.documentElement.style.setProperty("--accent", game.accent);
    document.title = game.name + " — радио · GTA RADIO";
    const gLogo = (ART().gameLogos || {})[game.id];
    $("#gameTag").innerHTML = `${gLogo ? `<img class="g-logo-sm" src="${gLogo}" alt=""> ` : `<b>${game.num}</b>`} · ${game.city} · ${stations.length} волн`;

    const goHome = () => { if (window.SINGLE && window.__showHome) window.__showHome(); };

    /* ------------------------------- утилиты ------------------------------ */
    function toast(msg, err) {
      toastEl.textContent = msg;
      toastEl.classList.toggle("err", !!err);
      toastEl.classList.add("show");
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toastEl.classList.remove("show"), err ? 5200 : 2600);
    }
    const fmt = (s) => {
      if (!isFinite(s) || s < 0) s = 0;
      const m = Math.floor(s / 60), r = Math.floor(s % 60);
      return m + ":" + String(r).padStart(2, "0");
    };
    const ICON = {
      play: '<path d="M8 5v14l11-7z"/>',
      pause: '<path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z"/>'
    };

    /* --------------------------- построение UI ---------------------------- */
    if (game.ui === "wheel") {
      wheelStage.classList.remove("hidden");
      listStage.classList.add("hidden");
      const step = 360 / stations.length;
      stations.forEach((st, i) => {
        const b = document.createElement("button");
        b.className = "st-chip";
        b.style.setProperty("--a", (i * step).toFixed(3) + "deg");
        b.style.setProperty("--sc", st.accent);
        b.dataset.i = i;
        b.title = st.name + " — " + st.tagline;
        b.innerHTML = `<span class="disc">${CFG.stationIcon(st, 96, 16)}${artImg(game.id, st)}</span><span class="lbl">${st.name}</span>`;
        on(b, "click", () => select(i, true));
        ring.appendChild(b);
        chipEls.push(b);
      });
    } else {
      wheelStage.classList.add("hidden");
      listStage.classList.remove("hidden");
      const num = document.getElementById("stageNum");
      if (num) num.textContent = game.num;
      stations.forEach((st, i) => {
        const li = document.createElement("li");
        li.dataset.i = i;
        li.innerHTML = `<button type="button">
            <span class="ico">${CFG.stationIcon(st, 30, 7)}${artImg(game.id, st)}</span>
            <span><span class="nm">${st.name}</span><span class="tg">${st.tagline || ""}</span></span>
            <canvas class="eqmini" width="52" height="32"></canvas>
          </button>`;
        on(li.querySelector("button"), "click", () => select(i, true));
        rlist.appendChild(li);
        itemEls.push(li);
      });
    }
    miniCanvases = itemEls.map((li) => li.querySelector(".eqmini"));

    /* ------------------------------ эквалайзер ---------------------------- */
    const eqHub = $("#eqHub"), hubCtx = eqHub.getContext("2d");
    const barsWrap = $("#eqbars");
    if (!barsWrap.children.length) {
      const NB = 22;
      for (let i = 0; i < NB; i++) barsWrap.appendChild(document.createElement("i"));
    }
    const barEls = [...barsWrap.children];

    function drawEq() {
      if (signal.aborted) return;
      const spec = A.spectrum();
      if (spec) {
        for (let i = 0; i < barEls.length; i++) {
          const v = spec[Math.floor(Math.pow(i / barEls.length, 1.4) * 90) + 1] / 255;
          barEls[i].style.height = Math.max(6, v * 100) + "%";
        }
      } else {
        barEls.forEach((b, i) => (b.style.height = 8 + Math.abs(Math.sin(Date.now() / 400 + i)) * 12 + "%"));
      }
      if (game.ui === "wheel") {
        const w = eqHub.width, h = eqHub.height, n = 26;
        hubCtx.clearRect(0, 0, w, h);
        const grad = hubCtx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, game.accent);
        grad.addColorStop(1, "#ffffff");
        hubCtx.fillStyle = grad;
        for (let i = 0; i < n; i++) {
          const v = spec ? spec[Math.floor(Math.pow(i / n, 1.5) * 80) + 1] / 255 : (0.15 + Math.abs(Math.sin(Date.now() / 500 + i)) * 0.2);
          const bh = Math.max(2, v * h * 0.92);
          hubCtx.globalAlpha = 0.35 + v * 0.65;
          hubCtx.fillRect(i * (w / n), h - bh, w / n - 2, bh);
        }
        hubCtx.globalAlpha = 1;
      }
      miniCanvases.forEach((c, i) => {
        if (!c || i !== idx) return;
        const cx = c.getContext("2d"), w = c.width, h = c.height, n = 7;
        cx.clearRect(0, 0, w, h);
        cx.fillStyle = stations[i].accent || game.accent;
        for (let k = 0; k < n; k++) {
          const v = spec ? spec[k * 5 + 2] / 255 : 0.3 + Math.abs(Math.sin(Date.now() / 300 + k)) * 0.4;
          cx.fillRect(k * (w / n), h - Math.max(2, v * h), w / n - 2, Math.max(2, v * h));
        }
      });
      requestAnimationFrame(drawEq);
    }

    /* --------------------------- демо-метаданные -------------------------- */
    const DEMO_TITLES = {
      house: ["Midnight Circuit", "Neon Overdrive", "Warehouse 88", "Sunset Boulevard"],
      rock: ["Chrome Highway", "Blvd. of Noise", "Gasoline Heart", "Riot Avenue"],
      metal: ["Iron Requiem", "Skull Doctrine", "Blackout Engine", "Grave Machine"],
      hop: ["Low Slow", "Concrete Crown", "Block Party '04", "Candy Paint"],
      funk: ["Velvet Groove", "Boogie Contract", "Silk & Steel", "Funky Diplomat"],
      soul: ["Slow Burn", "Golden Hour", "Honey & Smoke", "Sunday Best"],
      jazz: ["Blue Interlude", "Late Set", "Smoke Ring Suite", "After Hours"],
      amb: ["Night Drive", "Static Bloom", "Empty Freeway", "Pale Horizon"],
      reggae: ["Island Signal", "Riddim & Dust", "Coconut Grove", "One Drop"],
      country: ["Dust County", "Pickup Anthem", "Whiskey Road", "Open Range"],
      surf: ["Pipeline Dream", "Salt Air", "Wet Suit Boogie", "Point Break"],
      talk: ["Эфир: разговорное шоу", "Рекламная пауза", "Звонок в студию", "Новости часа"],
      world: ["Eastern Winds", "Volga Nights", "Bazaar Beat", "Steppe Radio"]
    };
    function startDemoMeta(station) {
      stopDemoMeta();
      const prog = (station.demo && station.demo.prog) || "rock";
      const list = DEMO_TITLES[prog] || DEMO_TITLES.rock;
      let k = Math.floor(Math.random() * list.length);
      const set = () => {
        hudTrack.textContent = list[k % list.length] + "  ·  демо-эфир";
        hudArtist.textContent = prog === "talk" ? "" : "процедурный микс";
        nowTrack.innerHTML = `<span class="sep">▶</span> ${list[k % list.length]} <span class="sep">—</span> сгенерировано браузером`;
        k++;
      };
      set();
      demoTimer = setInterval(set, 9000);
    }
    function stopDemoMeta() { if (demoTimer) clearInterval(demoTimer); demoTimer = null; }

    /* ------------------------------- выбор -------------------------------- */
    function select(i, startAudio) {
      idx = (i + stations.length) % stations.length;
      const st = stations[idx];
      document.documentElement.style.setProperty("--accent", st.accent || game.accent);

      if (game.ui === "wheel") {
        const step = 360 / stations.length;
        ring.style.setProperty("--rot", (-idx * step).toFixed(3) + "deg");
        chipEls.forEach((c, k) => c.classList.toggle("active", k === idx));
      } else {
        itemEls.forEach((li, k) => li.classList.toggle("active", k === idx));
        const active = itemEls[idx];
        if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      hudIcon.innerHTML = CFG.stationIcon(st, 46, 11) + artImg(game.id, st);
      hudName.textContent = st.name;
      hudTag.textContent = st.tagline || "";
      nowStation.textContent = st.name;
      hudLive.classList.add("hidden");

      if (!window.SINGLE) {
        const url = new URL(location.href);
        url.searchParams.set("game", game.id);
        url.searchParams.set("st", idx);
        history.replaceState(null, "", url);
      }

      A.tuningFx();
      stopDemoMeta();
      if (startAudio) {
        playing = true;
        setIcons(true);
        try {
          A.playStation(st);
          if (A.mode === "demo") startDemoMeta(st);
        } catch (e) {
          console.error(e);
          toast("Не удалось запустить звук: " + e.message, true);
        }
      }
    }

    function setIcons(isPlaying) {
      $("#playIcon").innerHTML = isPlaying ? ICON.pause : ICON.play;
      $("#powerIcon").innerHTML = isPlaying ? ICON.pause : ICON.play;
    }

    function togglePlay() {
      const el = A._el;
      if (!playing) { select(idx, true); return; }
      if (A.mode === "demo") {
        const g = A.master;
        if (g) {
          const t = A.ctx.currentTime;
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(g.gain.value, t);
          g.gain.linearRampToValueAtTime(0.0001, t + 0.15);
          A._paused = true;
          playing = false; setIcons(false);
        }
      } else if (el) {
        if (el.paused) { el.play(); playing = true; } else { el.pause(); playing = false; }
        setIcons(playing);
      }
    }
    function resumeFromPause() {
      if (A._paused && A.master) {
        const t = A.ctx.currentTime;
        A.master.gain.cancelScheduledValues(t);
        A.master.gain.linearRampToValueAtTime(A.muted ? 0 : A.volume * 0.85, t + 0.2);
        A._paused = false;
        playing = true; setIcons(true);
        return true;
      }
      return false;
    }

    /* ------------------------------ события ------------------------------- */
    A.setCallbacks({
      onMeta: (m) => {
        if (!m) return;
        hudLive.classList.toggle("hidden", !m.live);
        hudTrack.textContent = m.title || "";
        hudArtist.textContent = m.artist ? "— " + m.artist : "";
        nowTrack.innerHTML = `<span class="sep">▶</span> ${m.title || ""}${m.artist ? ` <span class="sep">—</span> ${m.artist}` : ""}`;
      },
      onError: (t, e) => {
        const src = t && t.src ? t.src : "";
        toast(`Не удалось загрузить: ${src || "поток"}. Проверь путь к файлу / CORS.`, true);
        console.warn("audio error", src, e);
      }
    });

    on($("#btnPlay"), "click", () => { if (!resumeFromPause()) togglePlay(); });
    on($("#btnPower"), "click", () => { if (!resumeFromPause()) togglePlay(); });
    on($("#btnNext"), "click", () => select(idx + 1, true));
    on($("#btnPrev"), "click", () => select(idx - 1, true));
    on($("#btnBack"), "click", () => { if (window.SINGLE) goHome(); else history.back(); });
    on($("#btnHome"), "click", () => { if (window.SINGLE) goHome(); else location.href = "index.html"; });

    const vol = $("#vol");
    const paintVol = () => vol.style.setProperty("--p", vol.value + "%");
    on(vol, "input", () => { A.setVolume(vol.value / 100); paintVol(); });
    paintVol();

    on($("#btnMute"), "click", () => {
      A.setMuted(!A.muted);
      $("#volIcon").innerHTML = A.muted
        ? '<path d="M4 9v6h4l5 4V5L8 9zm15.5 3 2.5-2.5-1.4-1.4L18 10.6 15.4 8 14 9.4l2.6 2.6L14 14.6 15.4 16l2.6-2.6 2.6 2.6 1.4-1.4z"/>'
        : '<path d="M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/>';
    });

    let wheelLock = 0;
    on($("#wheel"), "wheel", (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLock < 220) return;
      wheelLock = now;
      select(idx + (e.deltaY > 0 ? 1 : -1), playing);
    }, { passive: false });

    let tx = 0;
    on(document, "touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
    on(document, "touchend", (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 60) select(idx + (dx < 0 ? 1 : -1), playing);
    }, { passive: true });

    on(document, "keydown", (e) => {
      if (e.target.matches("input,textarea,select")) return;
      switch (e.key) {
        case "ArrowRight": case "ArrowDown": e.preventDefault(); select(idx + 1, playing); break;
        case "ArrowLeft": case "ArrowUp": e.preventDefault(); select(idx - 1, playing); break;
        case " ": e.preventDefault(); if (!resumeFromPause()) togglePlay(); break;
        case "m": case "M": case "ь": $("#btnMute").click(); break;
        case "Escape": if (window.SINGLE) goHome(); else location.href = "index.html"; break;
        default:
          if (/^[1-9]$/.test(e.key)) { const n = parseInt(e.key, 10) - 1; if (n < stations.length) select(n, true); }
      }
    });

    progressTimer = setInterval(() => {
      const el = A._el;
      if (el && A.mode === "audio" && el.duration && isFinite(el.duration)) {
        tCur.textContent = fmt(el.currentTime);
        tDur.textContent = fmt(el.duration);
        progFill.style.width = (el.currentTime / el.duration) * 100 + "%";
      } else if (A.mode === "demo") {
        demoTick += 0.5;
        tCur.textContent = fmt(demoTick);
        tDur.textContent = "∞ live";
        progFill.style.width = ((demoTick % 30) / 30) * 100 + "%";
      } else {
        tCur.textContent = "0:00"; tDur.textContent = "0:00"; progFill.style.width = "0%";
      }
    }, 500);

    /* ------------------------------- старт -------------------------------- */
    ring.style.transition = "none";
    chipEls.forEach((c) => (c.style.transition = "none"));
    select(idx, false);
    void ring.offsetWidth;
    requestAnimationFrame(() => {
      ring.style.transition = "";
      chipEls.forEach((c) => (c.style.transition = ""));
    });
    drawEq();

    const start = () => {
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
      if (!playing) { select(idx, true); toast("Эфир включён — «как в машине». Крути колесо."); }
    };
    on(document, "pointerdown", start);
    on(document, "keydown", start);
    // single-file: клик по карточке игры — уже жест пользователя, заводим эфир сразу
    window.__radioKick = () => { if (!signal.aborted) start(); };
    signal.addEventListener("abort", () => { window.__radioKick = null; });

    const anyReal = stations.some((s) => CFG.stationMode(s) === "audio");
    if (!anyReal) setTimeout(() => { if (!signal.aborted) toast("Демо-режим: музыка генерируется в браузере. Подключи mp3 в редакторе станций."); }, 1200);

    /* остановка при выходе с экрана */
    signal.addEventListener("abort", () => {
      stopDemoMeta();
      clearInterval(progressTimer);
      A.stop();
    });
  }

  window.__startRadio = startRadio;

  /* мультистраничный режим: стартуем сразу из URL */
  if (!window.SINGLE) {
    const p = new URLSearchParams(location.search);
    startRadio(p.get("game") || "v", parseInt(p.get("st") || "0", 10) || 0);
  }
})();
