/* =========================================================================
   RadioAudio — звуковой движок сайта
   -------------------------------------------------------------------------
   Два режима:
     1) demo  — процедурная музыка на WebAudio (аккорды, бас, барабаны,
                шум винила/эфира). Работает без единого файла.
     2) audio — обычный <audio> с плейлистом (локальные mp3 или внешние
                стримы), кроссфейдом и чтением ID3-тегов.

   Плюс: эффект «переключения волны» (свип + треск), аналитер для эквалайзера.
   ========================================================================= */

(function () {
  const NOTE = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const scale = (root, i) => {
    const deg = ((i % 7) + 7) % 7;
    const oct = Math.floor(i / 7);
    const steps = [0, 2, 4, 5, 7, 9, 11];
    return root + steps[deg] + oct * 12;
  };

  /* Аккордовые прогрессии — набор ступеней (в долях такта 4/4) */
  const PROG = {
    surf:    [{ b: 0, s: [0, 4, 7] }, { b: 2, s: [5, 9, 12] }, { b: 4, s: [7, 11, 14] }, { b: 6, s: [0, 4, 7] },
              { b: 8, s: [9, 12, 16] }, { b: 12, s: [7, 11, 14] }],
    house:   [{ b: 0, s: [0, 3, 7] }, { b: 2, s: [5, 9, 12] }, { b: 4, s: [3, 7, 10] }, { b: 6, s: [7, 11, 14] }],
    rock:    [{ b: 0, s: [0, 4, 7] }, { b: 4, s: [5, 9, 12] }, { b: 8, s: [7, 11, 14] }, { b: 10, s: [0, 4, 7] }],
    metal:   [{ b: 0, s: [0, 7] }, { b: 2, s: [1, 8] }, { b: 4, s: [0, 7] }, { b: 6, s: [6, 10] }, { b: 8, s: [0, 7] }, { b: 10, s: [3, 10] }, { b: 12, s: [5, 12] }, { b: 14, s: [0, 7] }],
    hop:     [{ b: 0, s: [0, 3, 7, 10] }, { b: 4, s: [5, 8, 12, 15] }],
    funk:    [{ b: 0, s: [0, 4, 7, 10] }, { b: 2, s: [0, 4, 7, 10] }, { b: 4, s: [3, 7, 10, 14] }, { b: 6, s: [5, 9, 12, 15] }],
    soul:    [{ b: 0, s: [0, 4, 7, 11] }, { b: 4, s: [2, 5, 9] }, { b: 8, s: [7, 11, 14] }, { b: 12, s: [0, 4, 7] }],
    jazz:    [{ b: 0, s: [0, 4, 7, 11] }, { b: 2, s: [2, 5, 9, 12] }, { b: 4, s: [7, 11, 14, 17] }, { b: 6, s: [0, 4, 7, 10] }],
    amb:     [{ b: 0, s: [0, 7, 12] }, { b: 8, s: [5, 12, 17] }],
    reggae:  [{ b: 0, s: [0, 4, 7] }, { b: 4, s: [5, 9, 12] }, { b: 6, s: [7, 11, 14] }],
    country: [{ b: 0, s: [0, 4, 7] }, { b: 4, s: [5, 9, 12] }, { b: 8, s: [7, 11, 14] }, { b: 12, s: [0, 4, 7] }],
    talk:    [{ b: 0, s: [0, 7, 12] }],
    world:   [{ b: 0, s: [0, 3, 7, 10] }, { b: 4, s: [5, 8, 12] }, { b: 8, s: [3, 7, 10] }]
  };

  const DRUMS = {
    house:   { kick: [0, 1, 2, 3], hat: [0.5, 1.5, 2.5, 3.5], clap: [1, 3] },
    rock:    { kick: [0, 2.5], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] },
    metal:   { kick: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], snare: [1, 3], hat: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75] },
    hop:     { kick: [0, 1.75], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.75] },
    funk:    { kick: [0, 2.25], snare: [1, 3], hat: [0, 0.25, 0.75, 1, 1.5, 1.75, 2, 2.5, 3, 3.5] },
    reggae:  { kick: [2], snare: [1, 3], hat: [0.5, 1.5, 2.5, 3.5] },
    country: { kick: [0, 2], snare: [1, 3], hat: [0, 1, 2, 3] },
    surf:    { kick: [0, 2], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] },
    jazz:    { kick: [], snare: [], hat: [0, 0.66, 1.33, 2, 2.66, 3.33] },
    none:    { kick: [], snare: [], hat: [] }
  };

  const LEAD = { house: [0, 7, 12, 10, 7, 12, 14, 10], rock: [0, 3, 7, 10, 7, 3, 0, -5], metal: [0, 1, 0, 3, 0, 1, 5, 3], hop: [0, 3, 5, 3, 0, -2, 0, 3], funk: [0, 3, 7, 10, 12, 10, 7, 3], soul: [0, 4, 7, 4, 9, 7, 4, 0], jazz: [0, 2, 4, 6, 4, 2, 7, 4], amb: [0, 7, 12, 7], reggae: [0, 3, 7, 3], country: [0, 2, 4, 2, 7, 4, 2, 0], talk: [], world: [0, 3, 5, 7, 5, 3, 0, -2] };

  class RadioAudio {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.analyser = null;
      this.data = null;
      this.volume = 0.8;
      this.muted = false;
      this.mode = null;            // "demo" | "audio"
      this.station = null;
      this._engine = null;
      this._el = null;
      this._playlist = [];
      this._index = 0;
      this._onEnd = null;
      this._onMeta = null;
      this._onError = null;
      this._fadeTimer = null;
    }

    /* ----------------------------- WebAudio ---------------------------- */
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error("WebAudio не поддерживается этим браузером");
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.78;
        this.data = new Uint8Array(this.analyser.frequencyBinCount);

        this.master.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }

    setVolume(v) {
      this.volume = Math.max(0, Math.min(1, v));
      if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
      if (this._el) this._el.volume = this.volume;
    }
    setMuted(m) {
      this.muted = !!m;
      this.setVolume(this.volume);
    }
    spectrum() {
      if (!this.analyser) return null;
      this.analyser.getByteFrequencyData(this.data);
      return this.data;
    }

    /* ------------------------ процедурное демо ------------------------- */
    startDemo(station) {
      const ctx = this.ensure();
      this.stopEngine();
      const cfg = station.demo || {};
      const root = (NOTE[cfg.key] != null ? NOTE[cfg.key] : 0) + 48;
      const bpm = cfg.bpm || 100;
      const prog = PROG[cfg.prog] || PROG.rock;
      const drums = DRUMS[cfg.drums] || DRUMS.none;
      const leadNotes = LEAD[cfg.prog] || [];
      const loopLen = 16;                 // 4 такта
      const beat = 60 / bpm;

      const bus = ctx.createGain();
      bus.gain.value = 0;
      bus.connect(this.master);

      // лёгкий «эфирный» фильтр + реверб
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = cfg.prog === "talk" ? 2600 : 9000;
      tone.Q.value = 0.6;
      tone.connect(bus);

      const rev = ctx.createConvolver();
      rev.buffer = this._impulse(1.9, 2.4);
      const revGain = ctx.createGain();
      revGain.gain.value = cfg.prog === "amb" ? 0.5 : 0.22;
      rev.connect(revGain);
      revGain.connect(bus);

      const noise = ctx.createBufferSource();
      noise.buffer = this._noiseBuffer(4);
      noise.loop = true;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = "bandpass";
      nFilter.frequency.value = 1400;
      nFilter.Q.value = 0.5;
      const nGain = ctx.createGain();
      nGain.gain.value = (cfg.noise || 0.02) * 0.35;
      noise.connect(nFilter); nFilter.connect(nGain); nGain.connect(bus);
      noise.start();

      const out = ctx.createGain();
      out.gain.value = 1;
      out.connect(tone);
      out.connect(rev);

      // синхронизация «одно радио на всех»: музыкальная фаза привязана к epoch-времени,
      // поэтому у всех посетителей одна и та же доля такта в одну и ту же секунду
      const stepDur = beat / 2;
      const cycleSec = 16 * beat;                       // 4 такта цикла
      const wall = Date.now() / 1000;
      const phase = ((wall % cycleSec) + cycleSec) % cycleSec;
      const firstStep = Math.ceil(phase / stepDur);
      const eng = { bus, noise, out, timer: null, wall0: wall, step: firstStep, station, probe: null,
                    t0: ctx.currentTime - phase };      // t0 — для внешних проверок фазы

      const kick = (t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.85, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3);
      };
      const snare = (t) => {
        const s = ctx.createBufferSource(); s.buffer = this._noiseBuffer(0.3);
        const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1300;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.2);
      };
      const hat = (t, open) => {
        const s = ctx.createBufferSource(); s.buffer = this._noiseBuffer(0.2);
        const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000;
        const g = ctx.createGain();
        const d = open ? 0.12 : 0.045;
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + d + 0.05);
      };
      const pad = (t, dur, midis, amp = 0.075) => {
        midis.forEach((m, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
          o.type = cfg.prog === "metal" || cfg.prog === "rock" ? "sawtooth" : "triangle";
          o.frequency.value = midi(m);
          o.detune.value = (i - 1) * 7;
          f.type = "lowpass"; f.frequency.value = cfg.prog === "amb" ? 1400 : 2600;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(amp, t + Math.min(0.4, dur * 0.3));
          g.gain.setValueAtTime(amp, t + dur * 0.7);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
        });
      };
      const bass = (t, dur, m) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = cfg.prog === "hop" ? "sine" : "sawtooth";
        o.frequency.value = midi(m - 12);
        f.type = "lowpass"; f.frequency.value = cfg.prog === "hop" ? 320 : 700;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.26, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
        o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
      };
      const lead = (t, m) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "square";
        o.frequency.value = midi(m + 12);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.055, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.45);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + beat * 0.5);
      };

      const hit = (arr, v) => !!arr && arr.indexOf(v) !== -1;
      const scheduleStep = (step, t) => {
        // step = номер восьмой; доля в такте = step/2 (целые и .5 — без float-дрейфа)
        const pos = step % (loopLen * 2);              // 0..31
        const bar = Math.round(pos / 2 * 100) / 100;   // 0..15.5
        const chord = prog.reduce((a, c) => (c.b <= bar ? c : a), prog[0]);
        const inBar = bar % 4;                         // доля внутри такта 0..3.5
        if (step % 8 === 0) {                          // аккорд на каждый такт
          const dur = beat * 4 * (cfg.prog === "amb" ? 2 : 1);
          pad(t, dur, chord.s.map((s) => root + s), cfg.prog === "amb" ? 0.05 : 0.075);
        }
        if (step % 4 === 0) bass(t, beat * 1.6, root + chord.s[0]);
        if (leadNotes.length && step % 4 === 2 && Math.random() < 0.65) {
          lead(t, root + leadNotes[(step >> 2) % leadNotes.length] + chord.s[0]);
        }
        if (hit(drums.kick, inBar)) kick(t);
        if (hit(drums.snare, inBar)) snare(t);
        if (hit(drums.hat, inBar)) hat(t, inBar === 1.5 || inBar === 3.5);
      };

      // планировщик привязан к wall-clock: даже если аудиочасы браузера плывут
      // (headless, спящий ноут), музыкальная фаза остаётся синхронной с epoch
      const pump = () => {
        const ahead = 0.3;
        for (;;) {
          const tWall = eng.wall0 + (eng.step * stepDur - phase);   // когда шаг должен звучать по часам Земли
          const wallNow = Date.now() / 1000;
          if (tWall > wallNow + ahead) break;
          let tCtx = ctx.currentTime + (tWall - wallNow);
          if (tCtx < ctx.currentTime + 0.015) tCtx = ctx.currentTime + 0.015;
          eng.probe = { k: eng.step, tWall };
          scheduleStep(eng.step, tCtx);
          eng.step++;
        }
        eng.timer = setTimeout(pump, 60);
      };

      bus.gain.setValueAtTime(0.0001, ctx.currentTime);
      bus.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.9);
      pump();
      this._engine = eng;
      this.mode = "demo";
      this.station = station;
      return true;
    }

    stopEngine() {
      const e = this._engine;
      this._engine = null;
      if (!e) return;
      clearTimeout(e.timer);
      try {
        const t = this.ctx.currentTime;
        e.bus.gain.cancelScheduledValues(t);
        e.bus.gain.setValueAtTime(e.bus.gain.value, t);
        e.bus.gain.linearRampToValueAtTime(0.0001, t + 0.25);
        setTimeout(() => { try { e.noise.stop(); e.bus.disconnect(); } catch (_) {} }, 350);
      } catch (_) {}
    }

    _impulse(dur, decay) {
      const ctx = this.ctx, len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return buf;
    }
    _noiseBuffer(dur) {
      const ctx = this.ctx, len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }

    /* ----------------------- файлы / стримы ---------------------------- */
    /**
     * @param {Array} tracks — [{type:'file'|'stream', src, title, artist}]
     */
    playTracks(station, tracks) {
      this.stopEngine();
      this._playlist = tracks.filter((t) => t.type === "file" || t.type === "stream");
      if (!this._playlist.length) return this.startDemo(station);
      this.ensure();
      this.mode = "audio";
      this.station = station;
      this._index = 0;
      this._attach();
      this._loadCurrent(true);
      return true;
    }

    _attach() {
      if (this._el) return;
      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.preload = "auto";
      el.volume = this.volume;
      el.addEventListener("ended", () => {
        if (this._synced) { const st = this.station, tr = this._playlist; if (st && tr) this.playSynced(st, tr); }
        else this.next();
      });
      el.addEventListener("error", () => {
        const t = this._playlist[this._index];
        if (this._onError) this._onError(t, el.error);
        // не зацикливаемся на битом файле — пробуем следующий
        setTimeout(() => this.next(), 400);
      });
      el.addEventListener("loadedmetadata", () => {
        if (this._onMeta) this._onMeta(this.currentTrack());
      });
      // подключаем к аналитеру (для эквалайзера)
      try {
        const src = this.ctx.createMediaElementSource(el);
        src.connect(this.master);
      } catch (_) { /* уже подключён */ }
      this._el = el;
    }

    currentTrack() { return this._playlist[this._index] || null; }

    _loadCurrent(autoplay) {
      const t = this.currentTrack();
      if (!t || !this._el) return;
      this._el.src = t.type === "stream" ? t.src : RadioAudio.resolvePath(t.src);
      this._el.load();
      if (t.type === "stream") {
        if (this._onMeta) this._onMeta({ title: t.title || "Прямой эфир", artist: t.artist || this.station?.name || "", live: true });
      } else {
        RadioAudio.readTags(this._el.src).then((tags) => {
          const cur = this.currentTrack();
          if (!cur || cur.src !== t.src) return;
          if (tags.title || tags.artist) cur._tags = tags;
          if (this._onMeta) this._onMeta({
            title: tags.title || t.title || RadioAudio.fileName(t.src),
            artist: tags.artist || t.artist || "",
            album: tags.album || ""
          });
        }).catch(() => {});
      }
      if (autoplay) this._el.play().catch((e) => { if (this._onError) this._onError(t, e); });
    }

    next() {
      if (!this._playlist.length) return;
      this._index = (this._index + 1) % this._playlist.length;
      this._loadCurrent(true);
    }

    playStation(station) {
      const mode = window.RADIO_CONFIG.stationMode(station);
      if (mode === "demo") return this.startDemo(station);
      const tracks = window.RADIO_CONFIG.tracksOf(station);
      const sync = window.RADIO_CONFIG.meta.sync !== false && station.sync !== false;
      if (sync && tracks.length && tracks.every((t) => t.type === "file")) {
        return this.playSynced(station, tracks);
      }
      return this.playTracks(station, tracks);
    }

    /* ---- «одно радио на всех» без сервера: позиция = epoch % сумма длительностей ---- */
    async _probeDurations(tracks) {
      await Promise.all(tracks.map((t) => new Promise((res) => {
        if (t._dur) return res();
        const el = new Audio();
        el.preload = "metadata";
        const done = () => { t._dur = isFinite(el.duration) && el.duration > 0 ? el.duration : 0; res(); };
        el.addEventListener("loadedmetadata", done, { once: true });
        el.addEventListener("error", () => { t._dur = 0; res(); }, { once: true });
        setTimeout(() => { if (!t._dur) { t._dur = 0; res(); } }, 6000);
        el.src = RadioAudio.resolvePath(t.src);
      })));
      return tracks.filter((t) => t._dur > 0);
    }

    _syncPoint(tracks) {
      const total = tracks.reduce((a, t) => a + t._dur, 0);
      if (!total) return null;
      let pos = ((Date.now() / 1000) % total + total) % total;
      for (let i = 0; i < tracks.length; i++) {
        if (pos < tracks[i]._dur) return { i, off: pos, total };
        pos -= tracks[i]._dur;
      }
      return { i: 0, off: 0, total };
    }

    async playSynced(station, tracks) {
      this.stopEngine();
      clearInterval(this._syncTimer);
      const usable = await this._probeDurations(tracks);
      if (usable.length < tracks.length || !usable.length) return this.playTracks(station, tracks);
      this.ensure();
      this.mode = "audio";
      this.station = station;
      this._playlist = tracks;
      this._synced = true;
      this._attach();
      const load = () => {
        const pt = this._syncPoint(tracks);
        if (!pt) return;
        this._index = pt.i;
        const t = tracks[pt.i];
        const el = this._el;
        const url = RadioAudio.resolvePath(t.src);
        const seekPlay = () => { try { el.currentTime = pt.off; } catch (_) {} el.play().catch(() => {}); };
        if (el.src.endsWith(url) || el.src === new URL(url, location.href).href) seekPlay();
        else {
          el.src = url;
          el.addEventListener("loadedmetadata", seekPlay, { once: true });
          el.load();
        }
        if (this._onMeta) this._onMeta(this._syncMeta(t, pt));
      };
      load();
      // поддрерживаем синхрон: дрейф > 0.9 c → догоняем; трек кончился → пересчитываем из epoch
      this._syncTimer = setInterval(() => {
        const el = this._el;
        if (!el || el.paused) return;
        const pt = this._syncPoint(tracks);
        if (!pt) return;
        if (pt.i !== this._index) { this._index = pt.i; load(); return; }
        if (Math.abs(el.currentTime - pt.off) > 0.9) { try { el.currentTime = pt.off; } catch (_) {} }
      }, 4000);
      return true;
    }

    _syncMeta(t, pt) {
      const tags = t._tags || {};
      return {
        title: tags.title || t.title || RadioAudio.fileName(t.src),
        artist: tags.artist || t.artist || "",
        synced: true,
        total: pt.total
      };
    }

    stop() {
      this.stopEngine();
      if (this._el) { try { this._el.pause(); this._el.removeAttribute("src"); this._el.load(); } catch (_) {} }
      clearInterval(this._syncTimer);
      this._synced = false;
      this._playlist = [];
      this.mode = null;
      this.station = null;
    }

    setCallbacks({ onMeta, onError, onEnd } = {}) {
      if (onMeta) this._onMeta = onMeta;
      if (onError) this._onError = onError;
      if (onEnd) this._onEnd = onEnd;
    }

    /* «переключение волны» — короткий свип и треск, как в машине */
    tuningFx() {
      try {
        const ctx = this.ensure(), t = ctx.currentTime;
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(300, t);
        o.frequency.exponentialRampToValueAtTime(2400, t + 0.14);
        f.type = "bandpass"; f.frequency.value = 1600; f.Q.value = 1.2;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(f); f.connect(g); g.connect(this.master);
        o.start(t); o.stop(t + 0.25);
      } catch (_) {}
    }

    /* ---------------------------- утилиты ------------------------------ */
    static fileName(p) {
      const s = String(p || "").split("?")[0].split("/").pop() || "";
      return decodeURIComponent(s).replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_-]+/g, " ");
    }
    static resolvePath(src) {
      if (/^https?:|^\/|^\.\.\//.test(src)) return src;
      return window.RADIO_CONFIG.meta.audioBase + src;
    }

    /** Читаем ID3v2.3/2.4 из начала mp3 (TIT2/TPE1/TALB) */
    static async readTags(url) {
      const res = await fetch(url, { headers: { Range: "bytes=0-131071" } }).catch(() => fetch(url));
      if (!res.ok) return {};
      const buf = await res.arrayBuffer();
      const dv = new DataView(buf);
      if (buf.byteLength < 10 || dv.getUint8(0) !== 0x49 || dv.getUint8(1) !== 0x44 || dv.getUint8(2) !== 0x33) return {};
      const size = ((dv.getUint8(6) & 0x7f) << 21) | ((dv.getUint8(7) & 0x7f) << 14) | ((dv.getUint8(8) & 0x7f) << 7) | (dv.getUint8(9) & 0x7f);
      const end = Math.min(10 + size, buf.byteLength);
      let p = 10, out = {};
      const dec = (arr) => {
        const bom = arr[0] === 0xff && arr[1] === 0xfe;
        const u16 = arr[0] === 0x01 || arr[0] === 0x02;
        const bytes = u16 ? arr.slice(2) : arr.slice(1);
        try {
          if (u16) {
            let s = "";
            for (let i = 0; i + 1 < bytes.length; i += 2) s += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
            return s;
          }
          return new TextDecoder(bom ? "utf-16" : arr[0] === 0x03 ? "utf-8" : "windows-1251").decode(bytes);
        } catch (_) { return ""; }
      };
      while (p + 10 < end) {
        const id = String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3));
        if (!/^[A-Z0-9]{4}$/.test(id)) break;
        let len;
        if (dv.getUint8(3 + 0) && false) len = 0;
        len = (dv.getUint8(p + 4) << 24) | (dv.getUint8(p + 5) << 16) | (dv.getUint8(p + 6) << 8) | dv.getUint8(p + 7);
        // synchsafe у ID3v2.4
        if (dv.getUint8(3) === 4) len = ((dv.getUint8(p + 4) & 0x7f) << 21) | ((dv.getUint8(p + 5) & 0x7f) << 14) | ((dv.getUint8(p + 6) & 0x7f) << 7) | (dv.getUint8(p + 7) & 0x7f);
        if (len <= 0 || p + 10 + len > end) break;
        const body = new Uint8Array(buf, p + 10, len);
        if (id === "TIT2") out.title = dec(body).replace(/\0+$/, "").trim();
        if (id === "TPE1") out.artist = dec(body).replace(/\0+$/, "").trim();
        if (id === "TALB") out.album = dec(body).replace(/\0+$/, "").trim();
        p += 10 + len;
      }
      return out;
    }
  }

  window.RadioAudio = RadioAudio;
  window.radioAudio = new RadioAudio();
})();
