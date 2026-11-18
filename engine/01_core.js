/**
 * MODULE 01: CORE — 9:16 VERTICAL SHORTS & REELS PAPER BILLIONS EDITION (engine/01_core.js)
 * 1080x1920 Vertical Stage, UI Safe-Zone constants (C.SAFE), raised floor (y=1320),
 * camera-aware safe clamping, auto-contrast background detection,
 * Paper Billions Editorial Matte Color Harmonizer, Situation-Adaptive Lighting & Brightness
 * Controller, Even-Odd Crescent Rim Shadow helper, and vector primitives.
 */
(function () {
  const W = 1080;
  const H = 1920;
  const FLOOR_Y = 1320;

  // --- 0. YouTube Shorts / Instagram Reels / TikTok UI Safe-Zone Box ---
  const SAFE = {
    left: 90,
    right: 860,
    top: 240,
    bottom: 1340,
    w: 770,
    h: 1100,
    cx: 500,      // Optical center X (shifted left of 540 to clear right-side buttons)
    cy: 820,      // Optical center Y
    floorY: FLOOR_Y
  };

  let _activeCam = null;
  let _inSplitPanel = false;
  let _sceneIsDark = false;

  // --- 0B. Universal Situation-Adaptive Lighting Presets ---
  const LIGHTING_PRESETS = {
    editorial: { mode: 'editorial', brightness: 0.94, vignette: 0.22, warmth: 0.03, desat: 0.12, spotlightAlpha: 0.11, dark: false },
    paper:     { mode: 'paper',     brightness: 0.94, vignette: 0.20, warmth: 0.04, desat: 0.12, spotlightAlpha: 0.10, dark: false },
    day:       { mode: 'day',       brightness: 0.96, vignette: 0.18, warmth: 0.02, desat: 0.10, spotlightAlpha: 0.10, dark: false },
    indoor:    { mode: 'indoor',    brightness: 0.92, vignette: 0.25, warmth: 0.03, desat: 0.14, spotlightAlpha: 0.11, dark: false },
    office:    { mode: 'office',    brightness: 0.92, vignette: 0.25, warmth: 0.02, desat: 0.14, spotlightAlpha: 0.11, dark: false },
    lab:       { mode: 'lab',       brightness: 0.93, vignette: 0.24, warmth: 0.00, desat: 0.14, spotlightAlpha: 0.11, dark: false },
    dusk:      { mode: 'dusk',      brightness: 0.90, vignette: 0.30, warmth: 0.06, desat: 0.16, spotlightAlpha: 0.09, dark: false },
    sunset:    { mode: 'sunset',    brightness: 0.90, vignette: 0.30, warmth: 0.06, desat: 0.16, spotlightAlpha: 0.09, dark: false },
    night:     { mode: 'night',     brightness: 0.86, vignette: 0.36, warmth: 0.00, desat: 0.14, spotlightAlpha: 0.12, dark: true  },
    server:    { mode: 'server',    brightness: 0.85, vignette: 0.38, warmth: 0.00, desat: 0.12, spotlightAlpha: 0.12, dark: true  },
    noir:      { mode: 'noir',      brightness: 0.83, vignette: 0.42, warmth: 0.01, desat: 0.18, spotlightAlpha: 0.13, dark: true  },
    danger:    { mode: 'danger',    brightness: 0.84, vignette: 0.40, warmth: 0.02, desat: 0.16, spotlightAlpha: 0.12, dark: true  },
    space:     { mode: 'space',     brightness: 0.88, vignette: 0.34, warmth: 0.00, desat: 0.10, spotlightAlpha: 0.08, dark: true  }
  };

  let _activeLighting = Object.assign({}, LIGHTING_PRESETS.editorial);
  let _lightingAppliedThisShot = false;

  // --- 1. Easing Functions ---
  const ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => t * (2 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    outBack: (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
    step: (t) => (t < 1 ? 0 : 1)
  };

  // --- 2. Math, Camera-Aware Safe-Zone Clamp & Keyframe Helpers ---
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function getSafeBoundsX() {
    let minX = SAFE.left;
    let maxX = SAFE.right;
    if (_activeCam && !_inSplitPanel) {
      const z = Math.max(0.25, _activeCam.zoom || 1);
      const camLeft = (SAFE.left - 540) / z + _activeCam.fx;
      const camRight = (SAFE.right - 540) / z + _activeCam.fx;
      minX = Math.max(SAFE.left - 30, camLeft + 14 / z);
      maxX = Math.min(SAFE.right + 10, camRight - 14 / z);
      if (minX > maxX) {
        const mid = (camLeft + camRight) / 2;
        return { minX: mid, maxX: mid, cx: mid };
      }
    }
    return { minX, maxX, cx: (minX + maxX) / 2 };
  }

  function getSafeBoundsY() {
    let minY = SAFE.top;
    let maxY = SAFE.bottom;
    if (_activeCam && !_inSplitPanel) {
      const z = Math.max(0.25, _activeCam.zoom || 1);
      const camTop = (SAFE.top - 960) / z + _activeCam.fy;
      const camBot = (SAFE.bottom - 960) / z + _activeCam.fy;
      minY = Math.max(SAFE.top - 20, camTop + 14 / z);
      maxY = Math.min(SAFE.bottom + 40, camBot - 14 / z);
      if (minY > maxY) {
        const mid = (camTop + camBot) / 2;
        return { minY: mid, maxY: mid, cy: mid };
      }
    }
    return { minY, maxY, cy: (minY + maxY) / 2 };
  }

  function safeX(x, halfW) {
    const hw = halfW || 0;
    const b = getSafeBoundsX();
    const minX = b.minX + hw;
    const maxX = b.maxX - hw;
    if (minX > maxX) return b.cx;
    return clamp(x !== undefined ? x : SAFE.cx, minX, maxX);
  }

  function safeY(y, halfH) {
    const hh = halfH || 0;
    const b = getSafeBoundsY();
    const minY = b.minY + hh;
    const maxY = b.maxY - hh;
    if (minY > maxY) return b.cy;
    return clamp(y !== undefined ? y : SAFE.cy, minY, maxY);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function prog(t, t0, t1) {
    if (t1 <= t0) return t >= t1 ? 1 : 0;
    return clamp((t - t0) / (t1 - t0), 0, 1);
  }

  function seg(t, t0, t1, easeFn) {
    const p = prog(t, t0, t1);
    return (easeFn || ease.outCubic)(p);
  }

  function key(t, frames, easeFn) {
    if (!frames || !frames.length) return 0;
    if (t <= frames[0][0]) return frames[0][1];
    for (let i = 0; i < frames.length - 1; i++) {
      const f0 = frames[i];
      const f1 = frames[i + 1];
      if (t <= f1[0]) {
        const fn = f1[2] || easeFn || ease.outCubic;
        const p = seg(t, f0[0], f1[0], fn);
        return lerp(f0[1], f1[1], p);
      }
    }
    return frames[frames.length - 1][1];
  }

  function pop(t, t0, dur) {
    const d = dur || 0.24;
    if (t < t0) return 0;
    return ease.outBack(prog(t, t0, t0 + d));
  }

  function pulse(t, speed, amp, phase) {
    return Math.sin(t * (speed || 3) + (phase || 0)) * (amp || 1);
  }

  // --- 3. Deterministic Seeded RNG & Shake ---
  function rng(seed) {
    let s = (seed || 1) % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function noise(x, seed) {
    const n = Math.sin(x * 12.9898 + (seed || 1) * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  function shake(t, amp, freq, seed) {
    if (!amp || amp <= 0) return { x: 0, y: 0 };
    const f = freq || 28;
    const s = seed || 1;
    const dx = (noise(t * f, s) - 0.5) * 2 * amp;
    const dy = (noise(t * f, s + 97) - 0.5) * 2 * amp;
    return { x: dx, y: dy };
  }

  // --- 4. Paper Billions Editorial Matte Color Palettes & Harmonizer ---
  const PAL = {
    ink: '#18181B',         // Signature bold charcoal-black outline
    paper: '#F4F0E6',       // Warm Paper Billions editorial cream (never blinding #FFFFFF)
    paperPure: '#FAF8F3',   // Crisp highlight white for sclera/teeth
    studioWall: '#DCD5C7',  // Muted warm oatmeal studio wall
    studioFloor: '#9E9687', // Warm muted taupe studio floor
    coolWall: '#C5D0DA',    // Muted editorial slate-blue wall
    coolFloor: '#6C7D8E',
    darkWall: '#1B2434',    // Paper Billions moody night/server navy-slate
    darkFloor: '#0F1622',
    red: '#D93829',         // Editorial crimson red
    redSoft: '#F4A69E',
    green: '#1F9D55',       // Editorial money green
    greenSoft: '#8CE0AE',
    blue: '#2B6CB0',        // Editorial tech blue
    blueSoft: '#90CDF4',
    yellow: '#E3B330',      // Warm editorial gold
    highlighter: 'rgba(246, 216, 78, 0.52)',
    orange: '#DD6B20',
    purple: '#6B46C1',
    grey: '#64748B',
    lightGrey: '#E2E6EC'
  };

  function hexToRgb(hex) {
    const h = String(hex || '#000000').replace('#', '').trim();
    if (h.startsWith('rgb')) {
      const m = h.match(/\d+/g);
      if (m && m.length >= 3) return { r: +m[0], g: +m[1], b: +m[2] };
    }
    const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
    const num = parseInt(full, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    const cr = clamp(Math.round(r), 0, 255);
    const cg = clamp(Math.round(g), 0, 255);
    const cb = clamp(Math.round(b), 0, 255);
    return '#' + ((1 << 24) + (cr << 16) + (cg << 8) + cb).toString(16).slice(1);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  /**
   * Harmonizes raw hex colors into Paper Billions Editorial Matte tones:
   * - Softens blinding #FFFFFF card/wall surfaces into warm editorial paper (#F5F2EA)
   * - Gently desaturates overly neon colors so scenes never look harsh or blown-out
   */
  function harmonizeColor(col, role) {
    if (!col || typeof col !== 'string' || !col.startsWith('#')) return col;
    const upper = col.toUpperCase().trim();

    // Keep ink black and crisp sclera/teeth white untouched
    if (upper === '#18181B' || upper === '#000000' || role === 'eye' || role === 'ink') return col;

    // Soften blinding #FFFFFF on surfaces/cards/props into warm editorial cream
    if ((upper === '#FFFFFF' || upper === '#F8FAFC') && role !== 'pureWhite') {
      return role === 'wall' ? '#E4DFD3' : '#F6F3EC';
    }

    const rgb = hexToRgb(col);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const desatAmt = (_activeLighting && _activeLighting.desat !== undefined) ? _activeLighting.desat : 0.12;

    // Tame neon saturation (> 0.76) and overly bright pastel walls (> 0.90 lightness)
    if (hsl.s > 0.72) {
      hsl.s = Math.min(0.76, hsl.s * (1 - desatAmt));
    }
    if (role === 'wall' || role === 'sky') {
      hsl.s = Math.min(0.58, hsl.s * 0.85);
      if (hsl.l > 0.86) hsl.l = 0.84;
    } else if (hsl.l > 0.94 && hsl.s < 0.25) {
      hsl.l = 0.93;
    }

    const out = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(out.r, out.g, out.b);
  }

  function luminance(hex) {
    const c = hexToRgb(hex);
    return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  }

  function isDarkColor(hex) {
    if (!hex) return false;
    return luminance(hex) < 0.42;
  }

  function isCanvasDarkAt(g, x, y) {
    if (_sceneIsDark) return true;
    if (!g || typeof g.getImageData !== 'function') return false;
    try {
      const m = typeof g.getTransform === 'function' ? g.getTransform() : { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
      const px = clamp(Math.round(m.a * x + m.c * y + m.e), 2, W - 3);
      const py = clamp(Math.round(m.b * x + m.d * y + m.f), 2, H - 3);
      const d = g.getImageData(px, py, 1, 1).data;
      if (d[3] < 30) return false;
      const lum = (0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2]) / 255;
      return lum < 0.42;
    } catch (e) {
      return _sceneIsDark;
    }
  }

  function drawContrastText(g, text, x, y, opts) {
    const o = opts || {};
    const str = String(text || '');
    if (!str) return;
    g.save();
    const darkBg = o.darkBg !== undefined ? o.darkBg : isCanvasDarkAt(g, x, y);
    let fillCol = o.fill || PAL.ink;
    if ((fillCol === PAL.ink || fillCol === '#18181B' || fillCol === '#0F172A') && darkBg) {
      fillCol = '#F6F3EC';
    }
    const fillDark = isDarkColor(fillCol);
    const haloCol = o.haloColor || (fillDark ? 'rgba(246,243,236,0.90)' : 'rgba(15,23,42,0.88)');
    if (o.halo !== false) {
      g.lineJoin = 'round';
      g.lineCap = 'round';
      g.lineWidth = o.haloW || 5.5;
      g.strokeStyle = haloCol;
      g.strokeText(str, x, y);
    }
    g.fillStyle = fillCol;
    g.fillText(str, x, y);
    g.restore();
  }

  function rgba(hex, alpha) {
    if (String(hex).startsWith('rgb')) return hex;
    const c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + clamp(alpha, 0, 1) + ')';
  }

  function shadeColor(hex, percent) {
    if (!String(hex).startsWith('#')) return hex;
    const c = hexToRgb(hex);
    const amt = Math.round(2.55 * percent);
    const r = clamp(c.r + amt, 0, 255);
    const g = clamp(c.g + amt, 0, 255);
    const b = clamp(c.b + amt, 0, 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // --- 4B. Universal Situation-Adaptive Lighting Controller ---
  function setLighting(cfg) {
    if (!cfg) {
      _activeLighting = Object.assign({}, LIGHTING_PRESETS.editorial);
    } else if (typeof cfg === 'string') {
      const keyName = cfg.toLowerCase().trim();
      _activeLighting = Object.assign({}, LIGHTING_PRESETS[keyName] || LIGHTING_PRESETS.editorial);
    } else if (typeof cfg === 'object') {
      const baseKey = String(cfg.mode || cfg.preset || cfg.theme || 'editorial').toLowerCase().trim();
      const base = LIGHTING_PRESETS[baseKey] || LIGHTING_PRESETS.editorial;
      _activeLighting = Object.assign({}, base, cfg);
    }

    // Apply optional global video override (`window.VIDEO_LIGHTING`)
    if (typeof window !== 'undefined' && window.VIDEO_LIGHTING) {
      const vl = window.VIDEO_LIGHTING;
      if (vl.brightness !== undefined) _activeLighting.brightness = vl.brightness;
      if (vl.vignette !== undefined) _activeLighting.vignette = vl.vignette;
      if (vl.desat !== undefined) _activeLighting.desat = vl.desat;
    }

    _sceneIsDark = Boolean(_activeLighting.dark);
    return _activeLighting;
  }

  function getLighting() {
    return _activeLighting;
  }

  /**
   * Applies the Paper Billions final atmospheric lighting pass:
   * - Controls overall brightness so bright daytime/studio scenes never look washed-out
   * - Adds soft peripheral vignette framing the 9:16 Safe Zone
   * - Adds subtle situational warmth (dusk/editorial) or cool noir depth (night/server)
   */
  function applyLightingPass(g, overrides) {
    if (_lightingAppliedThisShot) return;
    _lightingAppliedThisShot = true;

    const L = Object.assign({}, _activeLighting, overrides || {});
    const br = clamp(L.brightness !== undefined ? L.brightness : 0.94, 0.65, 1.15);
    const vig = clamp(L.vignette !== undefined ? L.vignette : 0.22, 0, 0.65);

    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);

    // 1. Situational brightness control (prevents over-exposed / blinding backgrounds)
    if (br < 0.99) {
      const dimAlpha = clamp((1.0 - br) * 0.72, 0.02, 0.28);
      g.fillStyle = L.dark ? 'rgba(6, 10, 18, ' + (dimAlpha * 0.65).toFixed(3) + ')' : 'rgba(20, 18, 15, ' + dimAlpha.toFixed(3) + ')';
      g.fillRect(0, 0, W, H);
    } else if (br > 1.01) {
      const liftAlpha = clamp((br - 1.0) * 0.45, 0.01, 0.14);
      g.fillStyle = 'rgba(255, 250, 240, ' + liftAlpha.toFixed(3) + ')';
      g.fillRect(0, 0, W, H);
    }

    // 2. Subtle warm editorial paper glaze
    if (L.warmth && L.warmth > 0.005) {
      g.fillStyle = 'rgba(245, 215, 165, ' + clamp(L.warmth, 0, 0.08).toFixed(3) + ')';
      g.fillRect(0, 0, W, H);
    }

    // 3. Soft Paper Billions peripheral vignette centered on the Safe Action Zone (500, 840)
    if (vig > 0.01) {
      const vGrd = g.createRadialGradient(SAFE.cx, 840, 360, 540, 960, 1180);
      vGrd.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrd.addColorStop(0.62, 'rgba(10, 14, 22, ' + (vig * 0.28).toFixed(3) + ')');
      vGrd.addColorStop(1, 'rgba(8, 11, 18, ' + vig.toFixed(3) + ')');
      g.fillStyle = vGrd;
      g.fillRect(0, 0, W, H);
    }

    g.restore();
  }

  // --- 5. Editorial Cartoon Drawing Primitives & Crescent Shadow Helper ---

  function inkStyle(g, lw, stroke, fill) {
    g.lineWidth = lw !== undefined ? lw : 3.5;
    g.strokeStyle = stroke || PAL.ink;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    if (fill) g.fillStyle = fill;
  }

  function pathRoundRect(g, x, y, w, h, r) {
    const rad = Math.min(r || 0, Math.abs(w) / 2, Math.abs(h) / 2);
    g.beginPath();
    g.moveTo(x + rad, y);
    g.arcTo(x + w, y, x + w, y + h, rad);
    g.arcTo(x + w, y + h, x, y + h, rad);
    g.arcTo(x, y + h, x, y, rad);
    g.arcTo(x, y, x + w, y, rad);
    g.closePath();
  }

  /**
   * Authentic Paper Billions Even-Odd Crescent Rim Shadow for Ellipses / Heads / Circles.
   * Draws a razor-clean cel-shaded crescent moon shadow along the rim of an ellipse `(cx, cy, rx, ry)`.
   */
  function drawCrescentShadow(g, cx, cy, rx, ry, opts) {
    const o = opts || {};
    const dir = o.dir !== undefined ? o.dir : 1; // +1 = facing right (shadow on left/back + bottom jaw)
    const alpha = o.alpha !== undefined ? o.alpha : 0.135;
    const shiftX = o.shiftX !== undefined ? o.shiftX : dir * rx * 0.20;
    const shiftY = o.shiftY !== undefined ? o.shiftY : -ry * 0.14;
    const innerScaleX = o.innerScaleX !== undefined ? o.innerScaleX : 0.96;
    const innerScaleY = o.innerScaleY !== undefined ? o.innerScaleY : 0.93;

    g.save();
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    g.clip();

    g.fillStyle = o.color || ('rgba(15, 20, 32, ' + alpha + ')');
    g.beginPath();
    // Outer ellipse covering full shape
    g.ellipse(cx, cy, rx + 2, ry + 2, 0, 0, Math.PI * 2);
    // Offset inner lit ellipse subtracted via even-odd winding
    g.ellipse(cx + shiftX, cy + shiftY, rx * innerScaleX, ry * innerScaleY, 0, 0, Math.PI * 2);
    g.fill('evenodd');
    g.restore();
  }

  /**
   * Draws an editorial cartoon rounded rectangle with optional shadow,
   * harmonized matte fill, subtle rim shading, diagonal hatching, and bold ink outline.
   */
  function roundRect(g, x, y, w, h, r, opts) {
    const o = opts || {};
    const rad = r !== undefined ? r : 12;
    g.save();

    if (o.shadow) {
      const sx = o.shadowX !== undefined ? o.shadowX : 5;
      const sy = o.shadowY !== undefined ? o.shadowY : 6;
      pathRoundRect(g, x + sx, y + sy, w, h, rad);
      g.fillStyle = o.shadowColor || 'rgba(15, 20, 30, 0.20)';
      g.fill();
    }

    pathRoundRect(g, x, y, w, h, rad);

    if (o.fill !== false) {
      const rawFill = o.fill || PAL.paper;
      const fillStr = o.pureWhite ? String(rawFill) : String(harmonizeColor(rawFill, o.role));
      if (o.grad !== false && fillStr.startsWith('#') && h > 24) {
        // Subtle Paper Billions matte tonal shift (never shiny plastic)
        const grd = g.createLinearGradient(x, y, x, y + h);
        grd.addColorStop(0, shadeColor(fillStr, o.grad ? 4 : 2));
        grd.addColorStop(0.7, fillStr);
        grd.addColorStop(1, shadeColor(fillStr, o.grad ? -7 : -4));
        g.fillStyle = grd;
      } else {
        g.fillStyle = fillStr;
      }
      g.fill();
    }

    if (o.hatch) {
      hatchRect(g, x, y, w, h, {
        rad: rad,
        color: o.hatchColor || 'rgba(24, 24, 27, 0.16)',
        spacing: o.hatchSpacing || 13,
        lw: o.hatchLw || 2.2,
        angle: o.hatchAngle || -45
      });
    }

    if (o.stroke !== false) {
      pathRoundRect(g, x, y, w, h, rad);
      inkStyle(g, o.lw !== undefined ? o.lw : 3.5, o.stroke || PAL.ink);
      g.stroke();
    }

    g.restore();
  }

  /**
   * Draws a circle with Paper Billions matte fill + clean crescent rim shadow and bold ink outline.
   */
  function circle(g, x, y, r, opts) {
    const o = opts || {};
    if (r <= 0) return;
    g.save();

    if (o.shadow) {
      g.beginPath();
      g.arc(x + (o.shadowX || 4), y + (o.shadowY || 5), r, 0, Math.PI * 2);
      g.fillStyle = o.shadowColor || 'rgba(15, 20, 30, 0.20)';
      g.fill();
    }

    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);

    if (o.fill !== false) {
      const rawFill = o.fill || PAL.paper;
      const fillStr = o.pureWhite ? String(rawFill) : String(harmonizeColor(rawFill, o.role));
      g.fillStyle = fillStr;
      g.fill();

      // Authentic Paper Billions crescent shadow on shaded circles (r >= 9)
      if (o.shade !== false && r >= 9 && fillStr.startsWith('#')) {
        drawCrescentShadow(g, x, y, r, r, {
          dir: o.shadeDir || -1,
          alpha: o.shadeAlpha || 0.13
        });
      }
    }

    if (o.stroke !== false) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      inkStyle(g, o.lw !== undefined ? o.lw : 3.5, o.stroke || PAL.ink);
      g.stroke();
    }
    g.restore();
  }

  /**
   * Fills a rectangular or rounded-rect region with diagonal hand-drawn hatch lines.
   */
  function hatchRect(g, x, y, w, h, opts) {
    const o = opts || {};
    const spacing = o.spacing || 12;
    const lw = o.lw || 2.5;
    const col = o.color || 'rgba(24,24,27,0.22)';

    g.save();
    pathRoundRect(g, x, y, w, h, o.rad || 0);
    g.clip();

    g.strokeStyle = col;
    g.lineWidth = lw;
    g.lineCap = 'butt';

    const diag = w + h;
    g.beginPath();
    for (let d = -h; d <= diag; d += spacing) {
      if (o.reverse) {
        g.moveTo(x + d, y);
        g.lineTo(x + d + h, y + h);
      } else {
        g.moveTo(x + d, y);
        g.lineTo(x + d - h, y + h);
      }
    }
    g.stroke();
    g.restore();
  }

  /**
   * Draws a clean line.
   */
  function line(g, x1, y1, x2, y2, opts) {
    const o = opts || {};
    g.save();
    inkStyle(g, o.lw !== undefined ? o.lw : 3.5, o.color || o.stroke || PAL.ink);
    if (o.dash) g.setLineDash(o.dash);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    g.restore();
  }

  /**
   * Draws an animated straight or curved arrow (with optional draw-in progress `p`).
   */
  function arrow(g, x1, y1, x2, y2, opts) {
    const o = opts || {};
    const p = o.p !== undefined ? clamp(o.p, 0, 1) : 1;
    if (p <= 0.01) return;

    const col = o.color || PAL.ink;
    const lw = o.lw || 4;
    const headSize = o.headSize || 16;

    g.save();
    inkStyle(g, lw, col);
    if (o.dash) g.setLineDash(o.dash);

    let endX = lerp(x1, x2, p);
    let endY = lerp(y1, y2, p);
    let angle = Math.atan2(y2 - y1, x2 - x1);

    g.beginPath();
    if (o.curve) {
      const mx = (x1 + x2) / 2 + (o.curveX || 0);
      const my = (y1 + y2) / 2 + (o.curveY !== undefined ? o.curveY : -50);
      const steps = 24;
      g.moveTo(x1, y1);
      let prevX = x1, prevY = y1;
      for (let i = 1; i <= steps; i++) {
        const t = (i / steps) * p;
        const it = 1 - t;
        const qx = it * it * x1 + 2 * it * t * mx + t * t * x2;
        const qy = it * it * y1 + 2 * it * t * my + t * t * y2;
        g.lineTo(qx, qy);
        if (i === steps) {
          angle = Math.atan2(qy - prevY, qx - prevX);
          endX = qx;
          endY = qy;
        }
        prevX = qx;
        prevY = qy;
      }
    } else {
      g.moveTo(x1, y1);
      g.lineTo(endX, endY);
    }
    g.stroke();

    if (p > 0.15) {
      g.setLineDash([]);
      g.beginPath();
      g.moveTo(endX, endY);
      g.lineTo(endX - headSize * Math.cos(angle - 0.45), endY - headSize * Math.sin(angle - 0.45));
      g.moveTo(endX, endY);
      g.lineTo(endX - headSize * Math.cos(angle + 0.45), endY - headSize * Math.sin(angle + 0.45));
      g.stroke();
    }
    g.restore();
  }

  // --- 6. Shot Wrapper for Studio Player & Renderer Compatibility ---
  function drawShot(g, s, lt, gt, u) {
    if (!s || typeof s.draw !== 'function') return;
    _activeCam = null;
    _inSplitPanel = false;
    _sceneIsDark = false;
    _lightingAppliedThisShot = false;

    // Initialize shot lighting (can be overridden inside s.draw by ENV.studio / ENV.create)
    if (s.lighting || s.brightness !== undefined) {
      setLighting(Object.assign(
        {},
        typeof s.lighting === 'string' ? (LIGHTING_PRESETS[s.lighting] || LIGHTING_PRESETS.editorial) : (s.lighting || {}),
        s.brightness !== undefined ? { brightness: s.brightness } : {}
      ));
    } else {
      setLighting('editorial');
    }

    g.save();
    s.draw(g, lt, gt, u);

    // Apply Paper Billions situational lighting & brightness balance
    if (s.lighting !== false) {
      applyLightingPass(g, s.brightness !== undefined ? { brightness: s.brightness } : null);
    }

    if (s.transition && window.CAM && typeof window.CAM.transition === 'function') {
      window.CAM.transition(g, lt, s.duration, s.transition);
    }
    g.restore();
    _activeCam = null;
    _inSplitPanel = false;
  }

  function linkShotTransitions(shots) {
    return shots;
  }

  const CORE = {
    W,
    H,
    FLOOR_Y,
    SAFE,
    LIGHTING_PRESETS,
    ease,
    clamp,
    getSafeBoundsX,
    getSafeBoundsY,
    safeX,
    safeY,
    lerp,
    prog,
    seg,
    key,
    pop,
    pulse,
    rng,
    noise,
    shake,
    PAL,
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    harmonizeColor,
    luminance,
    isDarkColor,
    isCanvasDarkAt,
    drawContrastText,
    rgba,
    shadeColor,
    setLighting,
    getLighting,
    applyLightingPass,
    inkStyle,
    pathRoundRect,
    drawCrescentShadow,
    roundRect,
    circle,
    hatchRect,
    line,
    arrow,
    drawShot,
    linkShotTransitions,
    _setCam: (cam) => { _activeCam = cam; },
    _getCam: () => _activeCam,
    _setSplit: (flag) => { _inSplitPanel = !!flag; },
    _isSplit: () => _inSplitPanel,
    setSceneDark: (flag) => { _sceneIsDark = !!flag; },
    isSceneDark: () => _sceneIsDark
  };

  window.CORE = CORE;
  window.C = CORE;
  window.DK = CORE;
  window.E = { W, H, FLOOR_Y, SAFE };
})();