/**
 * MODULE 01: CORE — 9:16 VERTICAL SHORTS & REELS EDITION (engine/01_core.js)
 * 1080x1920 Vertical Stage, UI Safe-Zone constants (C.SAFE), raised floor (y=1320),
 * math, easing, deterministic RNG, color palettes, bold ink outlines,
 * diagonal hatching, and hand-drawn vector primitives.
 */
(function () {
  const W = 1080;
  const H = 1920;
  const FLOOR_Y = 1320;

  // --- 0. YouTube Shorts / Instagram Reels / TikTok UI Safe-Zone Box ---
  // Keeps all key animations & text away from:
  //   - Top Status/Search Bar (y: 0..220)
  //   - Right Like/Comment/Share/Audio Column (x: 880..1080, y: 820..1700)
  //   - Bottom Channel Handle/Title/Caption/Audio Bar (y: 1450..1920)
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

  // --- 2. Math, Safe-Zone Clamp & Keyframe Helpers ---
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // Clamps a center X coordinate so an element of `halfW` stays inside C.SAFE.left..C.SAFE.right
  function safeX(x, halfW) {
    const hw = halfW || 0;
    const minX = SAFE.left + hw;
    const maxX = SAFE.right - hw;
    if (minX > maxX) return SAFE.cx;
    return clamp(x !== undefined ? x : SAFE.cx, minX, maxX);
  }

  // Clamps a center Y coordinate so an element of `halfH` stays inside C.SAFE.top..C.SAFE.bottom
  function safeY(y, halfH) {
    const hh = halfH || 0;
    const minY = SAFE.top + hh;
    const maxY = SAFE.bottom - hh;
    if (minY > maxY) return SAFE.cy;
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

  // Multi-point keyframe evaluator: C.key(lt, [[0, 100], [1.5, 500], [3.0, 500]], C.ease.outCubic)
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

  // Snappy pop-in scale helper for Shorts (0 -> 1.12 -> 1.0)
  function pop(t, t0, dur) {
    const d = dur || 0.24;
    if (t < t0) return 0;
    return ease.outBack(prog(t, t0, t0 + d));
  }

  // Gentle continuous sine bobbing/pulsing
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

  // --- 4. Editorial Cartoon Color Palettes ---
  const PAL = {
    ink: '#18181B',         // Signature bold black/charcoal outline
    paper: '#F5F2EB',       // Warm editorial paper white
    studioWall: '#D8D2C5',  // Classic warm beige studio wall
    studioFloor: '#9E9789', // Classic curved studio floor
    coolWall: '#CBD5E1',    // Cool grey-blue studio wall
    coolFloor: '#64748B',
    darkWall: '#1E293B',    // Night / Server / Noir wall
    darkFloor: '#0F172A',
    red: '#DC2626',         // Loss / Alert / Stamp red
    redSoft: '#FCA5A5',
    green: '#16A34A',       // Profit / Growth / Money green
    greenSoft: '#86EFAC',
    blue: '#2563EB',        // Tech / Science blue
    blueSoft: '#93C5FD',
    yellow: '#EAB308',      // Gold / Coins / Warning
    highlighter: 'rgba(253, 224, 71, 0.55)',
    orange: '#EA580C',
    purple: '#7C3AED',
    grey: '#6B7280',
    lightGrey: '#E5E7EB'
  };

  function hexToRgb(hex) {
    const h = String(hex || '#000000').replace('#', '');
    const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
    const num = parseInt(full, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
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

  // --- 5. Editorial Cartoon Drawing Primitives ---

  function inkStyle(g, lw, stroke, fill) {
    g.lineWidth = lw !== undefined ? lw : 3.5;
    g.strokeStyle = stroke || PAL.ink;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    if (fill) g.fillStyle = fill;
  }

  // Rounded rectangle path helper
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
   * Draws an editorial cartoon rounded rectangle with optional shadow,
   * 2-tone top highlight, diagonal hatching, and bold ink outline.
   */
  function roundRect(g, x, y, w, h, r, opts) {
    const o = opts || {};
    const rad = r !== undefined ? r : 12;
    g.save();

    if (o.shadow) {
      const sx = o.shadowX !== undefined ? o.shadowX : 5;
      const sy = o.shadowY !== undefined ? o.shadowY : 6;
      pathRoundRect(g, x + sx, y + sy, w, h, rad);
      g.fillStyle = o.shadowColor || 'rgba(0,0,0,0.22)';
      g.fill();
    }

    pathRoundRect(g, x, y, w, h, rad);

    if (o.fill !== false) {
      if (o.grad && o.fill) {
        const grd = g.createLinearGradient(x, y, x, y + h);
        grd.addColorStop(0, shadeColor(o.fill, 8));
        grd.addColorStop(1, shadeColor(o.fill, -10));
        g.fillStyle = grd;
      } else {
        g.fillStyle = o.fill || '#FFFFFF';
      }
      g.fill();
    }

    if (o.hatch) {
      hatchRect(g, x, y, w, h, {
        rad: rad,
        color: o.hatchColor || 'rgba(0,0,0,0.22)',
        spacing: o.hatchSpacing || 12,
        lw: o.hatchLw || 2.5,
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
   * Draws a circle with optional 2-tone soft radial shading and bold ink outline.
   */
  function circle(g, x, y, r, opts) {
    const o = opts || {};
    if (r <= 0) return;
    g.save();

    if (o.shadow) {
      g.beginPath();
      g.arc(x + (o.shadowX || 4), y + (o.shadowY || 5), r, 0, Math.PI * 2);
      g.fillStyle = o.shadowColor || 'rgba(0,0,0,0.22)';
      g.fill();
    }

    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);

    if (o.fill !== false) {
      if (o.shade !== false && String(o.fill || '').startsWith('#')) {
        const grd = g.createRadialGradient(x - r * 0.28, y - r * 0.28, r * 0.1, x, y, r);
        grd.addColorStop(0, shadeColor(o.fill, 10));
        grd.addColorStop(1, shadeColor(o.fill, -8));
        g.fillStyle = grd;
      } else {
        g.fillStyle = o.fill || '#FFFFFF';
      }
      g.fill();
    }

    if (o.stroke !== false) {
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
    const col = o.color || 'rgba(24,24,27,0.28)';

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
    g.save();
    s.draw(g, lt, gt, u);
    if (s.transition && window.CAM && typeof window.CAM.transition === 'function') {
      window.CAM.transition(g, lt, s.duration, s.transition);
    }
    g.restore();
  }

  function linkShotTransitions(shots) {
    return shots;
  }

  const CORE = {
    W,
    H,
    FLOOR_Y,
    SAFE,
    ease,
    clamp,
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
    rgba,
    shadeColor,
    inkStyle,
    pathRoundRect,
    roundRect,
    circle,
    hatchRect,
    line,
    arrow,
    drawShot,
    linkShotTransitions
  };

  window.CORE = CORE;
  window.C = CORE;
  window.DK = CORE;
  window.E = { W, H, FLOOR_Y, SAFE };
})();