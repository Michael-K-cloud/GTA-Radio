/* =========================================================================
   GTA RADIO — единый конфиг сайта
   -------------------------------------------------------------------------
   ВСЁ содержимое (игры, станции, треки, цвета, иконки) правится ЗДЕСЬ
   или через визуальный редактор: /editor.html  (кнопка «Сохранить config.js»).

   Типы источников звука у трека (поле src):
     "demo"   — процедурный звук прямо в браузере (WebAudio). Ничего качать
                не надо, работает сразу. Идеально для прототипа.
     "file"   — локальный mp3/ogg из папки audio/<game>/...
                src: "v/los-santos-rock.mp3"  (путь ОТНОСИТЕЛЬНО папки audio/)
                или абсолютный: "/music/track.mp3"
     "stream" — внешний URL (S3 / R2 / Icecast / любой https-линк).
                ВНИМАНИЕ: сервер должен отдавать заголовок
                Access-Control-Allow-Origin: * , иначе браузер заблокирует.

   Если у станции несколько треков — они играют по очереди, без пауз.
   ========================================================================= */

window.RADIO_CONFIG = {
  meta: {
    title: "GTA RADIO",
    subtitle: "Фанатский концепт-прототип · радиостанции из игр серии",
    // Папка с аудиофайлами (относительно корня сайта)
    audioBase: "audio/",
    // Дисклеймер показывается в подвале и на экране радио
    disclaimer:
      "Неофициальный фанатский проект. Не связан с Rockstar Games и Take-Two Interactive. " +
      "Все названия станций вымышлены, музыка в демо генерируется браузером. " +
      "Публикуйте только те аудиозаписи, на которые у вас есть права.",
    version: "0.1.0"
  },

  games: [
    /* ---------------------------------------------------------------- V */
    {
      id: "v",
      num: "V",
      name: "Grand Theft Auto V",
      year: 2013,
      city: "Los Santos",
      ui: "wheel",            // круговой селектор, как в игре
      theme: "v",
      accent: "#7fd4ff",
      tagline: "Los Santos · круговой селектор станций",
      stations: [
        { id: "surf",      name: "Blaine County Surf", tagline: "west coast / surf rock", accent: "#4fc3f7", bg: "#08303f", motif: "wave",     demo: { key: "D",  bpm: 104, prog: "surf", drums: "rock",  noise: 0.02 } },
        { id: "rock",      name: "Vinewood Rock",      tagline: "classic rock",           accent: "#ff5b4a", bg: "#3a0d09", motif: "bolt",     demo: { key: "E",  bpm: 128, prog: "rock",  drums: "rock",  noise: 0.02 } },
        { id: "stars",     name: "Fame or Shame FM",   tagline: "talk / celebrity",       accent: "#ffd54a", bg: "#3a2c05", motif: "star",     demo: { key: "A",  bpm: 96,  prog: "talk",  drums: "none",  noise: 0.05 } },
        { id: "santos",    name: "Los Santos FM",      tagline: "hip-hop / west coast",   accent: "#8dff6a", bg: "#10300c", motif: "mic",      demo: { key: "G",  bpm: 92,  prog: "hop",   drums: "hop",   noise: 0.03 } },
        { id: "space",     name: "Space 103.7",        tagline: "funk / soul",            accent: "#c07bff", bg: "#241038", motif: "planet",   demo: { key: "F",  bpm: 100, prog: "funk",  drums: "funk",  noise: 0.02 } },
        { id: "vinyl",     name: "Vinewood Vinyl",     tagline: "soul / rare groove",     accent: "#ffb15c", bg: "#3a2109", motif: "vinyl",    demo: { key: "C",  bpm: 96,  prog: "soul",  drums: "funk",  noise: 0.07 } },
        { id: "lowrider",  name: "Lowrider Classics",  tagline: "chicano / oldies",       accent: "#6affd4", bg: "#06322b", motif: "car",      demo: { key: "Bb", bpm: 88,  prog: "soul",  drums: "hop",   noise: 0.04 } },
        { id: "country",   name: "Rebel Country",      tagline: "country / outlaw",       accent: "#ffc46a", bg: "#38240a", motif: "hat",      demo: { key: "G",  bpm: 112, prog: "country", drums: "country", noise: 0.03 } },
        { id: "reggae",    name: "Blue Palms Reggae",  tagline: "reggae / dub",           accent: "#6bff9c", bg: "#0a3018", motif: "palm",     demo: { key: "A",  bpm: 76,  prog: "reggae", drums: "reggae", noise: 0.02 } },
        { id: "dance",     name: "Neon Dancefloor",    tagline: "house / electro",        accent: "#ff5ce1", bg: "#350a2c", motif: "disc",     demo: { key: "F",  bpm: 124, prog: "house", drums: "house", noise: 0.01 } },
        { id: "ambient",   name: "Nightcall Ambient",  tagline: "ambient / chillwave",    accent: "#8fd0ff", bg: "#0c1c33", motif: "moon",     demo: { key: "D",  bpm: 72,  prog: "amb",   drums: "none",  noise: 0.05 } },
        { id: "metal",     name: "Iron Skull Metal",   tagline: "metal / hard",           accent: "#c9ced6", bg: "#17181b", motif: "skull",    demo: { key: "E",  bpm: 148, prog: "metal", drums: "metal", noise: 0.02 } },
        { id: "jazz",      name: "Vinewood Jazz Club", tagline: "jazz / lounge",          accent: "#ffd9a0", bg: "#2e2010", motif: "note",     demo: { key: "Eb", bpm: 84,  prog: "jazz",  drums: "jazz",  noise: 0.06 } },
        { id: "blaine",    name: "Blaine County Radio",tagline: "country talk / AM",      accent: "#e8b25c", bg: "#33230c", motif: "cactus",   demo: { key: "D",  bpm: 100, prog: "country", drums: "none", noise: 0.09 } }
      ]
    },

    /* --------------------------------------------------------------- IV */
    {
      id: "iv",
      num: "IV",
      name: "Grand Theft Auto IV",
      year: 2008,
      city: "Liberty City",
      ui: "wheel",
      theme: "iv",
      accent: "#b9c4a8",
      tagline: "Liberty City · грязный мегаполис, приглушённая палитра",
      stations: [
        { id: "liberty", name: "Liberty Rock",       tagline: "classic rock",        accent: "#d9e0cf", bg: "#1c1f18", motif: "bolt",   demo: { key: "A",  bpm: 122, prog: "rock",  drums: "rock",  noise: 0.03 } },
        { id: "beat",    name: "The Beat 102",       tagline: "hip-hop",             accent: "#e7c98a", bg: "#241f13", motif: "mic",    demo: { key: "F",  bpm: 90,  prog: "hop",   drums: "hop",   noise: 0.03 } },
        { id: "jazz",    name: "Jazz Nation",        tagline: "jazz / standards",    accent: "#cfd8e3", bg: "#151b22", motif: "note",   demo: { key: "Bb", bpm: 82,  prog: "jazz",  drums: "jazz",  noise: 0.06 } },
        { id: "electro", name: "Electro Liberty",    tagline: "electro / dance",     accent: "#9fd8ff", bg: "#101d28", motif: "disc",   demo: { key: "C",  bpm: 126, prog: "house", drums: "house", noise: 0.01 } },
        { id: "kifflom", name: "Kifflom Radio",      tagline: "weird / talk",        accent: "#c9b6ff", bg: "#1a1428", motif: "star",   demo: { key: "D",  bpm: 98,  prog: "talk",  drums: "none",  noise: 0.07 } },
        { id: "russian", name: "Vladivostok FM",     tagline: "eastern / russian",   accent: "#ffb3a0", bg: "#2a1410", motif: "globe",  demo: { key: "E",  bpm: 108, prog: "world", drums: "rock",  noise: 0.04 } },
        { id: "irish",   name: "McReary Irish Pub",  tagline: "irish / folk",        accent: "#a8e6a0", bg: "#12240f", motif: "hat",    demo: { key: "G",  bpm: 116, prog: "country", drums: "country", noise: 0.03 } },
        { id: "sanjuan", name: "San Juan Sounds",    tagline: "latin / reggaeton",   accent: "#ffd27a", bg: "#2a1e08", motif: "palm",   demo: { key: "A",  bpm: 96,  prog: "reggae", drums: "hop",  noise: 0.02 } },
        { id: "lrr",     name: "LRR 92.9 Talk",      tagline: "talk radio / AM",     accent: "#e3ddc9", bg: "#201e16", motif: "wave",   demo: { key: "C",  bpm: 92,  prog: "talk",  drums: "none",  noise: 0.10 } },
        { id: "fusion",  name: "Fusion FM",          tagline: "smooth / acid jazz",  accent: "#9fe0d0", bg: "#0e211d", motif: "vinyl",  demo: { key: "Eb", bpm: 88,  prog: "soul",  drums: "funk",  noise: 0.05 } }
      ]
    },

    /* -------------------------------------------------------------- SA */
    {
      id: "sa",
      num: "SA",
      name: "GTA: San Andreas",
      year: 2004,
      city: "San Andreas",
      ui: "list",              // прямоугольный список, как в PS2-версии
      theme: "sa",
      accent: "#ffb03a",
      tagline: "Grove Street · список станций в стиле PS2",
      stations: [
        { id: "groove",  name: "Grove Street FM",   tagline: "west coast rap",    accent: "#7cff5a", bg: "#122b0a", motif: "mic",    demo: { key: "G",  bpm: 92,  prog: "hop",   drums: "hop",   noise: 0.03 } },
        { id: "krose",   name: "K-Rose Country",    tagline: "country",           accent: "#ffcb6a", bg: "#33230a", motif: "hat",    demo: { key: "D",  bpm: 110, prog: "country", drums: "country", noise: 0.03 } },
        { id: "bounce",  name: "Bounce FM",         tagline: "funk / soul",       accent: "#ff8ad4", bg: "#33092a", motif: "disc",   demo: { key: "F",  bpm: 102, prog: "funk",  drums: "funk",  noise: 0.02 } },
        { id: "sfurg",   name: "SF URG Rock",       tagline: "rock",              accent: "#ff6a4a", bg: "#331009", motif: "bolt",   demo: { key: "E",  bpm: 130, prog: "rock",  drums: "rock",  noise: 0.02 } },
        { id: "radiox",  name: "Radio X",           tagline: "alt / grunge",      accent: "#d0d6de", bg: "#171a1e", motif: "skull",  demo: { key: "A",  bpm: 120, prog: "metal", drums: "metal", noise: 0.02 } },
        { id: "kdst",    name: "K-DST The Dust",    tagline: "classic rock",      accent: "#ffc98a", bg: "#301d0a", motif: "vinyl",  demo: { key: "C",  bpm: 108, prog: "rock",  drums: "rock",  noise: 0.05 } },
        { id: "kjawz",   name: "K-JAWZ Hip-Hop",    tagline: "hip-hop classics",  accent: "#8affd4", bg: "#07302a", motif: "car",    demo: { key: "Bb", bpm: 88,  prog: "hop",   drums: "hop",   noise: 0.03 } },
        { id: "master",  name: "Master Sounds",     tagline: "rare groove",       accent: "#ffd54a", bg: "#33280a", motif: "vinyl",  demo: { key: "F",  bpm: 98,  prog: "soul",  drums: "funk",  noise: 0.07 } },
        { id: "playback",name: "Playback FM",       tagline: "house / electro",   accent: "#ff5ce1", bg: "#33092b", motif: "disc",   demo: { key: "F",  bpm: 124, prog: "house", drums: "house", noise: 0.01 } },
        { id: "kchat",   name: "K-CHAT Talk",       tagline: "talk radio",        accent: "#e0dac4", bg: "#221f14", motif: "wave",   demo: { key: "D",  bpm: 90,  prog: "talk",  drums: "none",  noise: 0.09 } }
      ]
    },

    /* -------------------------------------------------------------- VC */
    {
      id: "vc",
      num: "VC",
      name: "GTA: Vice City",
      year: 2002,
      city: "Vice City",
      ui: "list",
      theme: "vc",
      accent: "#ff4fa3",
      tagline: "1986 · неон, пальмы, кассеты",
      stations: [
        { id: "flash",  name: "Flash FM",        tagline: "80s pop",        accent: "#ff4fa3", bg: "#33091f", motif: "disc",   demo: { key: "C",  bpm: 118, prog: "house", drums: "house", noise: 0.02 } },
        { id: "wave",   name: "Wave 103",        tagline: "new wave",       accent: "#4fd8ff", bg: "#06283a", motif: "wave",   demo: { key: "A",  bpm: 122, prog: "rock",  drums: "rock",  noise: 0.02 } },
        { id: "vrock",  name: "V-Rock",          tagline: "hard rock",      accent: "#ff5b3a", bg: "#33100a", motif: "bolt",   demo: { key: "E",  bpm: 134, prog: "metal", drums: "metal", noise: 0.02 } },
        { id: "emotion",name: "Emotion 98.3",    tagline: "power ballads",  accent: "#ff9ac4", bg: "#331023", motif: "moon",   demo: { key: "D",  bpm: 78,  prog: "amb",   drums: "none",  noise: 0.05 } },
        { id: "espeso", name: "Radio Espeso",    tagline: "latin / salsa",  accent: "#ffc44f", bg: "#33250a", motif: "palm",   demo: { key: "G",  bpm: 104, prog: "reggae", drums: "reggae", noise: 0.02 } },
        { id: "vcs",    name: "VCS Fresh",       tagline: "hip-hop 80s",    accent: "#8aff6a", bg: "#133009", motif: "mic",    demo: { key: "F",  bpm: 94,  prog: "hop",   drums: "hop",   noise: 0.03 } }
      ]
    },

    /* ------------------------------------------------------------- III */
    {
      id: "iii",
      num: "III",
      name: "GTA III",
      year: 2001,
      city: "Liberty City",
      ui: "list",
      theme: "iii",
      accent: "#8ee06a",
      tagline: "2001 · первое 3D, зелёный HUD",
      stations: [
        { id: "rise",   name: "Rise FM",         tagline: "dance / trance",   accent: "#8ee06a", bg: "#0f2a08", motif: "disc",  demo: { key: "F",  bpm: 128, prog: "house", drums: "house", noise: 0.01 } },
        { id: "lips",   name: "Lips 106",        tagline: "pop hits",         accent: "#ff8ad4", bg: "#33092a", motif: "star",  demo: { key: "C",  bpm: 116, prog: "house", drums: "house", noise: 0.02 } },
        { id: "game",   name: "Game Radio",      tagline: "hip-hop",          accent: "#ffd54a", bg: "#33280a", motif: "mic",   demo: { key: "G",  bpm: 92,  prog: "hop",   drums: "hop",   noise: 0.03 } },
        { id: "msx",    name: "MSX FM",          tagline: "drum & bass",      accent: "#6affd4", bg: "#06302b", motif: "bolt",  demo: { key: "A",  bpm: 150, prog: "house", drums: "metal", noise: 0.02 } },
        { id: "head",   name: "Head Radio",      tagline: "chill / lounge",   accent: "#8fd0ff", bg: "#0c1c33", motif: "moon",  demo: { key: "D",  bpm: 76,  prog: "amb",   drums: "none",  noise: 0.05 } },
        { id: "double", name: "Double Clef",     tagline: "opera / classical",accent: "#e6dcc4", bg: "#241f14", motif: "note",  demo: { key: "Eb", bpm: 70,  prog: "jazz",  drums: "none",  noise: 0.04 } },
        { id: "chatterbox", name: "Chatterbox",  tagline: "talk radio",       accent: "#d8d2c0", bg: "#211f16", motif: "wave",  demo: { key: "C",  bpm: 88,  prog: "talk",  drums: "none",  noise: 0.10 } }
      ]
    }
  ]
};

/* =========================================================================
   Служебные функции конфига + генератор иконок станций (чистый SVG,
   без внешних картинок — чтобы не зависеть от чужих логотипов).
   ========================================================================= */

(function () {
  const CFG = window.RADIO_CONFIG;

  CFG.getGame = (id) => CFG.games.find((g) => g.id === id) || CFG.games[0];
  CFG.gameIds = () => CFG.games.map((g) => g.id);

  /** Все треки станции в порядке воспроизведения */
  CFG.tracksOf = (st) => (st && st.tracks && st.tracks.length ? st.tracks : []);

  /**
   * Куда грузить звук: file → audio/<...>, stream → как есть, demo → синтез
   */
  CFG.resolveSrc = (t, game) => {
    if (!t) return null;
    if (t.type === "stream") return t.src;
    if (t.type === "file") {
      const s = t.src || "";
      return /^https?:|^\/|^\.\.\//.test(s) ? s : CFG.meta.audioBase + s;
    }
    return null; // demo
  };

  /** Какую музыку заводить: есть file/stream → HTMLAudio, иначе → синтез */
  CFG.stationMode = (st) =>
    CFG.tracksOf(st).some((t) => t.type === "file" || t.type === "stream") ? "audio" : "demo";

  /* ------------------------------ иконки ------------------------------ */

  const M = {
    wave:  '<path d="M4 14c2.4-3.4 4.2-3.4 6.6 0s4.2 3.4 6.6 0 3.2-2.6 4.4-1.2" fill="none" stroke="@A@" stroke-width="2.2" stroke-linecap="round"/><path d="M4 20c2.4-3.4 4.2-3.4 6.6 0s4.2 3.4 6.6 0 3.2-2.6 4.4-1.2" fill="none" stroke="@A@" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>',
    bolt:  '<path d="M18 3 8 17h6l-2 12 12-16h-7z" fill="@A@"/>',
    star:  '<path d="M16 3.5 19.6 11l8.1 1.1-5.9 5.7 1.5 8-7.3-3.9-7.3 3.9 1.5-8L4.3 12.1 12.4 11z" fill="@A@"/>',
    vinyl: '<circle cx="16" cy="16" r="12" fill="none" stroke="@A@" stroke-width="2.2"/><circle cx="16" cy="16" r="7.5" fill="none" stroke="@A@" stroke-width="1.2" opacity=".5"/><circle cx="16" cy="16" r="2.6" fill="@A@"/>',
    mic:   '<rect x="12" y="4" width="8" height="14" rx="4" fill="@A@"/><path d="M8 15a8 8 0 0 0 16 0" fill="none" stroke="@A@" stroke-width="2.2" stroke-linecap="round"/><path d="M16 23v4M11 28h10" stroke="@A@" stroke-width="2.2" stroke-linecap="round"/>',
    palm:  '<path d="M16 29c-1-8-1-13 1-17" stroke="@A@" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M17 12c-4-4-9-4-12-1 4-1 8 0 12 1zm0 0c4-4 9-4 12-1-4-1-8 0-12 1zm0 0c-1-5 2-9 6-10-3 3-5 6-6 10zm0 0c1-5-2-9-6-10 3 3 5 6 6 10z" fill="@A@" opacity=".9"/>',
    skull: '<path d="M16 4c6.6 0 11 4.5 11 10.4 0 3.6-1.6 5.6-3 6.8-.7.6-1 1.2-1 2v1.4c0 1.4-1.1 2.4-2.5 2.4h-9c-1.4 0-2.5-1-2.5-2.4v-1.4c0-.8-.3-1.4-1-2-1.4-1.2-3-3.2-3-6.8C5 8.5 9.4 4 16 4z" fill="@A@"/><circle cx="11.5" cy="14" r="2.6" fill="@B@"/><circle cx="20.5" cy="14" r="2.6" fill="@B@"/><path d="M16 18.5 14 22h4z" fill="@B@"/>',
    disc:  '<circle cx="16" cy="16" r="12" fill="@A@" opacity=".18"/><circle cx="16" cy="16" r="12" fill="none" stroke="@A@" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="@A@"/><path d="M16 4v5M28 16h-5M16 28v-5M4 16h5" stroke="@A@" stroke-width="1.6" opacity=".6"/>',
    car:   '<path d="M5 20.5 7.5 13A3 3 0 0 1 10.4 11h11.2A3 3 0 0 1 24.5 13L27 20.5v5a1 1 0 0 1-1 1h-2.5a1 1 0 0 1-1-1V25H9.5v1.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" fill="@A@"/><path d="M9.4 19.2h13.2L21 13.6h-10z" fill="@B@" opacity=".55"/><circle cx="10" cy="22" r="1.4" fill="@B@"/><circle cx="22" cy="22" r="1.4" fill="@B@"/>',
    moon:  '<path d="M21 4a12 12 0 1 0 9 19A12.5 12.5 0 0 1 21 4z" fill="@A@"/><circle cx="9" cy="9" r="1.1" fill="@A@" opacity=".6"/><circle cx="6" cy="15" r=".8" fill="@A@" opacity=".45"/>',
    hat:   '<path d="M4 22h24c0 4-5.4 6-12 6S4 26 4 22z" fill="@A@"/><path d="M10 22c0-8 1.6-13 6-13s6 5 6 13z" fill="@A@" opacity=".75"/><path d="M9.6 19.5h12.8" stroke="@B@" stroke-width="2" opacity=".6"/>',
    note:  '<circle cx="11" cy="24" r="4.2" fill="@A@"/><circle cx="25" cy="21" r="4.2" fill="@A@"/><path d="M15.2 24V10l14-4v15" fill="none" stroke="@A@" stroke-width="2.6"/><path d="M15.2 13.2 29.2 9.4" stroke="@A@" stroke-width="2.6"/>',
    globe: '<circle cx="16" cy="16" r="12" fill="none" stroke="@A@" stroke-width="2.2"/><ellipse cx="16" cy="16" rx="5.4" ry="12" fill="none" stroke="@A@" stroke-width="1.6"/><path d="M4.6 12h22.8M4.6 20h22.8" stroke="@A@" stroke-width="1.6"/>',
    dice:  '<rect x="5" y="5" width="22" height="22" rx="5" fill="none" stroke="@A@" stroke-width="2.2"/><circle cx="11.5" cy="11.5" r="2.1" fill="@A@"/><circle cx="20.5" cy="20.5" r="2.1" fill="@A@"/><circle cx="16" cy="16" r="2.1" fill="@A@"/>',
    money: '<rect x="3.5" y="8.5" width="25" height="15" rx="2.5" fill="none" stroke="@A@" stroke-width="2.2"/><circle cx="16" cy="16" r="4" fill="none" stroke="@A@" stroke-width="2"/><path d="M7.5 12v8M24.5 12v8" stroke="@A@" stroke-width="1.6" opacity=".7"/>',
    cactus:'<path d="M14 29V13a2 2 0 0 1 4 0v16z" fill="@A@"/><path d="M14 20H9a2 2 0 0 1-2-2v-4a2 2 0 0 1 4 0v3h3zM18 22h4a2 2 0 0 0 2-2v-6a2 2 0 0 0-4 0v5h-2z" fill="@A@" opacity=".8"/>',
    heart: '<path d="M16 28S4 20.8 4 13.2A6.7 6.7 0 0 1 16 9.6a6.7 6.7 0 0 1 12 3.6C28 20.8 16 28 16 28z" fill="@A@"/>',
    cassette:'<rect x="3" y="8" width="26" height="17" rx="2.5" fill="none" stroke="@A@" stroke-width="2.2"/><circle cx="11.5" cy="16" r="3.4" fill="none" stroke="@A@" stroke-width="2"/><circle cx="20.5" cy="16" r="3.4" fill="none" stroke="@A@" stroke-width="2"/><path d="M8 25h16" stroke="@A@" stroke-width="1.8" opacity=".6"/>',
    antenna:'<circle cx="16" cy="24" r="3" fill="@A@"/><path d="M9.5 17.5a9 9 0 0 1 13 0M6 13.5a14 14 0 0 1 20 0" fill="none" stroke="@A@" stroke-width="2.2" stroke-linecap="round"/>'
  };

  CFG.motifs = () => Object.keys(M);

  CFG.stationIcon = (st, size = 72, rounded = 14) => {
    const acc = st.accent || "#9ad";
    const bg = st.bg || "#101318";
    // ВНИМАНИЕ: меняем только токены @A@/@B@ (а не буквы C/B — иначе ломается
    // SVG-команда кривой "C" в path).
    const art = (M[st.motif] || M.disc).replace(/@A@/g, acc).replace(/@B@/g, bg);
    const initials = (st.name || "?")
      .split(/\s+/)
      .filter((w) => /[A-Za-zА-Яа-я0-9]/.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
    return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${bg}"/>
          <stop offset="1" stop-color="#05070a"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="${rounded / (size / 32) / 4 + 2}" fill="url(#g)" stroke="${acc}" stroke-opacity=".45" stroke-width=".8"/>
      <g opacity=".95">${art}</g>
      <text x="16" y="31" font-size="3.4" text-anchor="middle" font-family="Inter,system-ui,sans-serif"
            font-weight="700" letter-spacing=".2" fill="${acc}" opacity=".65">${initials}</text>
    </svg>`;
  };
})();
