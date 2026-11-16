/**
 * MODULE 09: UNIVERSAL 9:16 EDITORIAL VECTOR MAP & GLOBE CREATOR (engine/09_maps.js)
 * Native 1080x1920 (9:16 Vertical) Edition — 100% UI Safe-Zone Compliant.
 * Zero external tile servers, zero lag. Renders clean vertical editorial maps,
 * custom regions/empires, animated travel routes, pulsing radar pins, and 2.5D globes
 * inside the Golden Safe Box (x: 80..860, y: 320..1240) clear of Likes/Comments & Titles.
 */
(function () {
  const C = window.CORE;

  // Clean Simplified Editorial Continent & Region Polygons (Normalized [lon: -180..180, lat: -90..90])
  const CONTINENTS = {
    northAmerica: [[-165, 65], [-130, 70], [-75, 68], [-55, 48], [-80, 25], [-90, 18], [-80, 8], [-105, 20], [-125, 48]],
    southAmerica: [[-80, 10], [-60, 10], [-35, -6], [-48, -28], [-68, -54], [-75, -45], [-72, -18], [-81, -4]],
    europe:       [[-10, 36], [0, 44], [-5, 58], [15, 70], [45, 68], [55, 50], [30, 42], [24, 36], [12, 38]],
    africa:       [[-17, 15], [-5, 35], [12, 37], [33, 31], [50, 12], [40, -12], [20, -34], [12, -18], [8, 4], [-8, 5]],
    middleEast:   [[33, 31], [55, 38], [62, 25], [55, 16], [44, 12], [35, 28]],
    asia:         [[30, 40], [55, 50], [70, 72], [140, 70], [145, 45], [122, 22], [104, 2], [96, 16], [88, 22], [78, 8], [68, 24], [55, 24], [45, 12], [35, 30]],
    india:        [[68, 24], [77, 34], [88, 27], [88, 22], [78, 8], [72, 18]],
    australia:    [[114, -22], [132, -12], [153, -26], [146, -40], [130, -33], [115, -34]],
    japan:        [[130, 31], [136, 35], [141, 41], [145, 44], [141, 36], [132, 32]],
    uk:           [[-6, 50], [-2, 58], [2, 53], [-1, 50]]
  };

  function projectLonLat(lon, lat, box) {
    const minLon = box.minLon !== undefined ? box.minLon : -180;
    const maxLon = box.maxLon !== undefined ? box.maxLon : 180;
    const minLat = box.minLat !== undefined ? box.minLat : -65;
    const maxLat = box.maxLat !== undefined ? box.maxLat : 78;
    const u = (lon - minLon) / ((maxLon - minLon) || 1);
    const v = 1 - (lat - minLat) / ((maxLat - minLat) || 1);
    return [box.x + u * box.w, box.y + v * box.h];
  }

  /**
   * 1. EDITORIAL 9:16 2D VECTOR MAP CREATOR (`MAP.draw(g, lt, opts)`)
   * Default frame sits at `x: 80, y: 320, w: 780, h: 880` (right edge = 860, bottom = 1200)
   * so the map, pins, and labels are NEVER covered by Likes/Comments (`x > 880`) or Titles (`y > 1450`).
   *
   * Usage:
   *   MAP.draw(g, lt, {
   *     title: 'THE SMUGGLING ROUTE',
   *     bbox: [60, -12, 145, 45], // [minLon, minLat, maxLon, maxLat] (Defaults to World)
   *     highlight: ['india'],     // Or custom `regions: [{ pts: [[x,y],...], color, label, hatch }]`
   *     routes: [
   *       { from: [103.8, 1.3], to: [114.1, 22.3], label: 'CHIP SHIPMENT', color: '#EF4444', t0: 0.15, dur: 0.85 }
   *     ],
   *     pins: [
   *       { lonLat: [103.8, 1.3], label: 'SINGAPORE', color: '#FACC15', pulse: true, t0: 0.08 },
   *       { lonLat: [114.1, 22.3], label: 'SHENZHEN', color: '#EF4444', t0: 0.55 }
   *     ]
   *   });
   */
  function draw(g, lt, opts) {
    const o = opts || {};
    const mx = o.x !== undefined ? o.x : 80;
    const my = o.y !== undefined ? o.y : 320;
    const mw = o.w !== undefined ? o.w : 780;
    const mh = o.h !== undefined ? o.h : 880;
    const bb = o.bbox || [-170, -60, 175, 78];
    const box = {
      x: mx,
      y: my,
      w: mw,
      h: mh,
      minLon: bb[0],
      minLat: bb[1],
      maxLon: bb[2],
      maxLat: bb[3]
    };

    g.save();

    // Ocean card frame inside 9:16 Safe Zone
    C.roundRect(g, mx, my, mw, mh, 20, {
      fill: o.oceanColor || '#BAE6FD',
      lw: 4.5,
      shadow: true
    });

    g.save();
    C.pathRoundRect(g, mx, my, mw, mh, 20);
    g.clip();

    // Subtle latitude/longitude grid lines
    const gridCol = o.gridColor || 'rgba(15, 23, 42, 0.08)';
    const stepX = Math.max(110, Math.round(mw / 5));
    const stepY = Math.max(120, Math.round(mh / 6));
    for (let gx = mx + stepX; gx < mx + mw; gx += stepX) {
      C.line(g, gx, my, gx, my + mh, { lw: 1.5, color: gridCol, dash: [8, 8] });
    }
    for (let gy = my + stepY; gy < my + mh; gy += stepY) {
      C.line(g, mx, gy, mx + mw, gy, { lw: 1.5, color: gridCol, dash: [8, 8] });
    }

    // Base Continents
    if (o.continents !== false) {
      const hiList = (o.highlight || []).map((s) => String(s).toLowerCase());
      Object.keys(CONTINENTS).forEach((name) => {
        const poly = CONTINENTS[name];
        const isHi = hiList.indexOf(name.toLowerCase()) !== -1;
        const screenPts = poly.map((pt) => projectLonLat(pt[0], pt[1], box));

        g.beginPath();
        screenPts.forEach((p, idx) => {
          if (idx === 0) g.moveTo(p[0], p[1]);
          else g.lineTo(p[0], p[1]);
        });
        g.closePath();
        g.fillStyle = isHi ? (o.highlightColor || '#FCA5A5') : (o.landColor || '#E7E0D0');
        g.fill();

        if (isHi && o.highlightHatch) {
          const xs = screenPts.map((p) => p[0]);
          const ys = screenPts.map((p) => p[1]);
          const rx = Math.min.apply(null, xs);
          const ry = Math.min.apply(null, ys);
          const rw = Math.max.apply(null, xs) - rx;
          const rh = Math.max.apply(null, ys) - ry;
          g.save();
          g.clip();
          C.hatchRect(g, rx, ry, rw, rh, { color: 'rgba(220, 38, 38, 0.25)', spacing: 12, lw: 2.2 });
          g.restore();
        }

        C.inkStyle(g, isHi ? 4.2 : 3.2, C.PAL.ink);
        g.stroke();
      });
    }

    // Custom Polygons / Regions / Empires (`regions: [{ pts: [[x,y] or [lon,lat]], useLonLat, color, label, hatch }]`)
    (o.regions || o.territories || []).forEach((reg) => {
      if (!Array.isArray(reg.pts) || reg.pts.length < 3) return;
      const isLonLat = reg.useLonLat || (Math.abs(reg.pts[0][0]) <= 180 && Math.abs(reg.pts[0][1]) <= 90);
      const pts = reg.pts.map((pt) => (isLonLat ? projectLonLat(pt[0], pt[1], box) : pt));

      g.beginPath();
      pts.forEach((p, idx) => (idx === 0 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1])));
      g.closePath();
      g.fillStyle = reg.color || 'rgba(239, 68, 68, 0.38)';
      g.fill();

      if (reg.hatch) {
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        const rx = Math.min.apply(null, xs);
        const ry = Math.min.apply(null, ys);
        g.save();
        g.clip();
        C.hatchRect(g, rx, ry, Math.max.apply(null, xs) - rx, Math.max.apply(null, ys) - ry, {
          color: 'rgba(24,24,27,0.22)',
          spacing: 12,
          lw: 2.2
        });
        g.restore();
      }

      C.inkStyle(g, 3.8, reg.border || C.PAL.ink);
      g.stroke();

      if (reg.label) {
        const cx = C.clamp(pts.reduce((a, p) => a + p[0], 0) / pts.length, mx + 70, mx + mw - 70);
        const cy = C.clamp(pts.reduce((a, p) => a + p[1], 0) / pts.length, my + 50, my + mh - 50);
        g.font = '900 24px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(reg.label, cx, cy);
      }
    });

    // Animated Travel Routes (`from` / `to` can be `[lon, lat]` or screen `[x, y]`)
    (o.routes || []).forEach((rt) => {
      const p0 = (rt.screen || Math.abs(rt.from[0]) > 180) ? rt.from : projectLonLat(rt.from[0], rt.from[1], box);
      const p1 = (rt.screen || Math.abs(rt.to[0]) > 180) ? rt.to : projectLonLat(rt.to[0], rt.to[1], box);
      const t0 = rt.t0 !== undefined ? rt.t0 : 0.15;
      const dur = rt.dur !== undefined ? rt.dur : 0.85;
      const rp = C.seg(lt, t0, t0 + dur, C.ease.inOutCubic);
      if (rp <= 0.01) return;

      const curveY = rt.curveY !== undefined ? rt.curveY : -55;
      C.arrow(g, p0[0], p0[1], p1[0], p1[1], {
        p: rp,
        lw: rt.lw || 5.5,
        color: rt.color || C.PAL.red,
        dash: rt.dash !== false ? [12, 8] : undefined,
        curve: rt.curve !== false,
        curveY: curveY
      });

      if (rt.label && rp > 0.4) {
        const lx = C.clamp((p0[0] + p1[0]) / 2, mx + 95, mx + mw - 95);
        const ly = C.clamp((p0[1] + p1[1]) / 2 + curveY * 0.55 - 22, my + 75, my + mh - 45);
        g.font = '700 30px "Caveat", cursive';
        const tw = g.measureText(rt.label).width + 24;
        C.roundRect(g, lx - tw / 2, ly - 20, tw, 38, 10, {
          fill: 'rgba(255, 255, 255, 0.92)',
          stroke: rt.color || C.PAL.red,
          lw: 2.8
        });
        g.fillStyle = rt.color || C.PAL.red;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(rt.label, lx, ly);
      }
    });

    // Location Pins & Pulsing Radar Rings (Safe-Zone Clamped inside Map Card)
    (o.pins || []).forEach((pin, idx) => {
      const t0 = pin.t0 !== undefined ? pin.t0 : idx * 0.14;
      if (lt < t0) return;
      const sc = C.pop(lt, t0, 0.26);
      const raw = pin.lonLat || pin.pos || [0, 0];
      const pt = (pin.screen || Math.abs(raw[0]) > 180) ? raw : projectLonLat(raw[0], raw[1], box);
      const px = C.clamp(pt[0], mx + 24, mx + mw - 24);
      const py = C.clamp(pt[1], my + 28, my + mh - 28);
      const col = pin.color || C.PAL.red;

      if (pin.pulse !== false) {
        const pulseP = ((lt * 1.3 + idx * 0.25) % 1);
        C.circle(g, px, py, 12 + pulseP * 44, {
          fill: false,
          stroke: C.rgba(col, 1 - pulseP),
          lw: 3.2
        });
      }

      g.save();
      g.translate(px, py);
      g.scale(sc, sc);
      C.circle(g, 0, 0, 12, { fill: col, lw: 3.5 });
      C.circle(g, 0, 0, 4.5, { fill: '#FFFFFF', stroke: false });

      if (pin.label) {
        g.font = '900 22px "Nunito", sans-serif';
        const tw = g.measureText(pin.label).width + 28;
        // Shift label horizontally if pin is near left/right edge of map card
        let labelOffX = 0;
        if (px - tw / 2 < mx + 12) labelOffX = (mx + 12) - (px - tw / 2);
        if (px + tw / 2 > mx + mw - 12) labelOffX = (mx + mw - 12) - (px + tw / 2);
        const labelOffY = py - 58 < my + 60 ? 44 : -42;

        C.roundRect(g, labelOffX - tw / 2, labelOffY - 18, tw, 36, 9, {
          fill: '#FFFFFF',
          lw: 3.2,
          shadow: true
        });
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(pin.label, labelOffX, labelOffY + 1);
      }
      g.restore();
    });

    g.restore();

    // Map Card Outer Re-Stroke
    C.roundRect(g, mx, my, mw, mh, 20, { fill: false, lw: 4.5, stroke: C.PAL.ink });

    // Optional Map Title Header Pill (Centered at top of map inside Safe Zone)
    if (o.title && window.TEXT) {
      window.TEXT.badge(g, lt, {
        x: mx + mw / 2,
        y: my - 42 >= 255 ? my - 38 : my + 44,
        text: o.title,
        size: 28,
        fill: '#FFFFFF',
        t0: 0.04
      });
    }

    g.restore();
  }

  /**
   * 2. ORTHOGRAPHIC 2.5D EDITORIAL GLOBE (`MAP.globe(g, lt, opts)`)
   * Centered in the 9:16 Safe Zone (`x: 485, y: 820, r: 320`) with support for
   * spinning continents, 3D projected pins, and orbital arcs.
   */
  function globe(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 485;
    const cy = o.y !== undefined ? o.y : 820;
    const r = o.r || 320;
    const rotLon = (o.lon !== undefined ? o.lon : 78) + (o.spin ? lt * o.spin : 0);

    function projectOnGlobe(lon, lat) {
      const dLon = ((lon - rotLon + 540) % 360) - 180;
      const radLon = (dLon * Math.PI) / 180;
      const radLat = (lat * Math.PI) / 180;
      return {
        x: cx + Math.sin(radLon) * r * Math.cos(radLat),
        y: cy - Math.sin(radLat) * r,
        visible: Math.abs(dLon) < 92
      };
    }

    g.save();

    // Optional outer atmosphere glow
    if (o.glow !== false) {
      const grd = g.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.22);
      grd.addColorStop(0, C.rgba(o.glowColor || '#38BDF8', 0.28));
      grd.addColorStop(1, C.rgba(o.glowColor || '#38BDF8', 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
      g.fill();
    }

    C.circle(g, cx, cy, r, { fill: o.oceanColor || '#38BDF8', lw: 5, shadow: true });

    g.save();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.clip();

    // Graticule rings
    const gratCol = 'rgba(255,255,255,0.24)';
    [-0.5, 0, 0.5].forEach((latK) => {
      C.line(g, cx - r, cy + latK * r, cx + r, cy + latK * r, { lw: 2, color: gratCol });
      g.strokeStyle = gratCol;
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(cx, cy, r * Math.abs(latK || 0.25), r, 0, 0, Math.PI * 2);
      g.stroke();
    });

    // Rotating continent polygons on globe
    const hiList = (o.highlight || []).map((s) => String(s).toLowerCase());
    Object.keys(CONTINENTS).forEach((name) => {
      const poly = CONTINENTS[name];
      const isHi = hiList.indexOf(name.toLowerCase()) !== -1;
      g.beginPath();
      let visible = false;
      poly.forEach((pt, idx) => {
        const gp = projectOnGlobe(pt[0], pt[1]);
        if (gp.visible) visible = true;
        if (idx === 0) g.moveTo(gp.x, gp.y);
        else g.lineTo(gp.x, gp.y);
      });
      if (visible) {
        g.closePath();
        g.fillStyle = isHi ? (o.highlightColor || '#FCA5A5') : (o.landColor || '#4ADE80');
        g.fill();
        C.inkStyle(g, 3.2, C.PAL.ink);
        g.stroke();
      }
    });

    // Optional 3D-projected Pins on Globe
    (o.pins || []).forEach((pin, idx) => {
      const raw = pin.lonLat || pin.pos || [78, 20];
      const gp = projectOnGlobe(raw[0], raw[1]);
      if (!gp.visible) return;
      const sc = C.pop(lt, pin.t0 !== undefined ? pin.t0 : idx * 0.15, 0.28);
      const col = pin.color || C.PAL.red;

      if (pin.pulse !== false) {
        const pulseP = ((lt * 1.3 + idx * 0.2) % 1);
        C.circle(g, gp.x, gp.y, 10 + pulseP * 38, {
          fill: false,
          stroke: C.rgba(col, 1 - pulseP),
          lw: 3
        });
      }

      g.save();
      g.translate(gp.x, gp.y);
      g.scale(sc, sc);
      C.circle(g, 0, 0, 11, { fill: col, lw: 3.2 });
      if (pin.label) {
        g.font = '900 20px "Nunito", sans-serif';
        const tw = g.measureText(pin.label).width + 24;
        C.roundRect(g, -tw / 2, -46, tw, 32, 8, { fill: '#FFFFFF', lw: 3, shadow: true });
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(pin.label, 0, -29);
      }
      g.restore();
    });

    // Subtle 2.5D spherical terminator shadow on right edge of globe
    const shd = g.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.2, cx, cy, r);
    shd.addColorStop(0, 'rgba(255,255,255,0.12)');
    shd.addColorStop(0.7, 'rgba(0,0,0,0)');
    shd.addColorStop(1, 'rgba(15,23,42,0.28)');
    g.fillStyle = shd;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);

    g.restore();

    // Bold outer ink rim
    C.circle(g, cx, cy, r, { fill: false, lw: 5, stroke: C.PAL.ink });

    if (o.title && window.TEXT) {
      window.TEXT.badge(g, lt, {
        x: cx,
        y: cy - r - 56,
        text: o.title,
        size: 28,
        fill: '#FFFFFF',
        t0: 0.05
      });
    }

    g.restore();
  }

  // Instant 0ms preloader stub for Studio Player / Renderer compatibility
  function preloadAll() {
    return Promise.resolve();
  }

  window.MAP = {
    draw,
    world: draw,
    region: draw,
    globe,
    preloadAll
  };
})();