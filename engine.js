/**
 * CARTOON ENGINE (9:16 VERTICAL SHORTS & REELS EDITION) — Root Synchronous Module Loader
 * Loaded via <script src="../../engine.js"></script>
 * Each module lives in its own standalone file inside /engine/ for easy editing.
 */
(function () {
  // 1. Inject Google Fonts used by the 9:16 Editorial Cartoon style
  //    - Caveat & Kalam: Handwritten italic text on black screens, charts & arrows
  //    - Fredoka & Nunito: Clean bold UI labels, top hook banners, stamps & speech bubbles
  //    - Space Mono: Tickers, timestamps, code & counters
  //    - Merriweather: Newspaper clippings, legal documents & quotes
  if (typeof document !== 'undefined' && document.head && !document.getElementById('cartoon-engine-fonts')) {
    const link = document.createElement('link');
    link.id = 'cartoon-engine-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Fredoka:wght@600;700&family=Kalam:wght@400;700&family=Merriweather:ital,wght@0,700;1,400&family=Nunito:wght@600;700;800;900&family=Space+Mono:wght@400;700&display=swap';
    document.head.appendChild(link);
  }

  // 2. Resolve base path relative to engine.js
  const scripts = typeof document !== 'undefined' ? document.getElementsByTagName('script') : [];
  let basePath = '../../engine/';
  for (let i = scripts.length - 1; i >= 0; i--) {
    const src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('engine.js') !== -1) {
      basePath = src.replace(/engine\.js(\?.*)?$/, '') + 'engine/';
      break;
    }
  }

  // 3. Single-purpose 9:16 modules (1 file = 1 responsibility)
  const MODULES = [
    '01_core.js',      // 1080x1920 Stage, SAFE Box, FloorY=1320, Math, Palettes, Outlines & Hatching
    '02_camera.js',    // 9:16 2D Camera, Vertical 2row/3row Splits & UI Safe-Zone Overlay
    '03_text.js',      // Safe-Zone Black Screens, Bubbles, Subtitles (y=1380), Stamps & Quotes
    '04_char.js',      // Phone-Scale Capsule+Stick Characters, Mascots, Animals & Crowds
    '05_env.js',       // 9:16 Studio Curve (floorY=1320), Vertical Rooms, Exteriors & Sky/Space
    '06_props.js',     // Vertical Props (Desks, Flippers, Scales, Conveyors, Docs & Vehicles)
    '07_charts.js',    // 9:16 Safe-Zone Hatched Bar/Line/Pie Charts, Counters & Endless Receipts
    '08_diagrams.js',  // Top-to-Bottom Flowcharts, Cutaways, Cycles, ScaleCompare & Orbits
    '09_maps.js',      // 9:16 Safe-Zone 2D Vector Maps, Routes, Pulsing Pins & Globes
    '10_sound.js'      // Action-Synced Cartoon Foley SFX, Ambient Beds & High-Tempo BGM Composer
  ];

  MODULES.forEach(function (file) {
    if (typeof document !== 'undefined') {
      document.write('<script src="' + basePath + file + '"><\/script>');
    }
  });
})();