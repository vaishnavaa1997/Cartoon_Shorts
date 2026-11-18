/**
 * MODULE 09: UNIVERSAL 9:16 EDITORIAL VECTOR MAP & GLOBE CREATOR (engine/09_maps.js)
 * Paper Billions / RealLifeLore / Kurzgesagt 1080x1920 (9:16 Vertical) Edition.
 * Renders warm editorial maps, custom regions/empires, animated route vehicles (planes/ships/rockets),
 * pulsing radar pins, and 2.5D spinning vector Earth globes inside the Golden Safe Box (x: 80..860).
 */
(function () {
  const C = window.CORE;

  // Clean Editorial Continent & Region Polygons (Normalized [lon: -180..180, lat: -90..90])
  const CONTINENTS = {
    northAmerica: [[-166, 66], [-140, 70], [-95, 72], [-72, 66], [-54, 48], [-76, 35], [-81, 25], [-96, 19], [-84, 9], [-105, 20], [-118, 34], [-126, 49]],
    greenland:    [[-52, 60], [-70, 76], [-22, 82], [-18, 70], [-42, 60]],
    southAmerica: [[-80, 10], [-62, 11], [-35, -6], [-40, -22], [-56, -36], [-68, -54], [-75, -46], [-71, -18], [-81, -4]],
    europe:       [[-9, 37], [-9, 43], [-2, 48], [8, 55], [5, 62], [20, 70], [52, 68], [56, 52], [32, 45], [24, 36], [14, 38], [3, 42]],
    uk:           [[-6, 50], [-5, 58], [1, 53], [-1, 50]],
    africa:       [[-17, 15], [-6, 35], [11, 37], [33, 31], [51, 12], [41, -11], [32, -26], [20, -35], [13, -18], [9, 4], [-8, 5]],
    madagascar:   [[44, -25], [49, -13], [50, -18], [46, -25]],
    middleEast:   [[33, 31], [48, 38], [56, 26], [59, 21], [44, 13], [35, 28]],
    asia:         [[32, 42], [56, 52], [72, 72], [135, 71], [170, 66], [142, 48], [130, 34], [121, 23], [104, 2], [96, 16], [88, 22], [78, 8], [68, 24], [55, 25]],
    india:        [[68, 24], [76, 34], [88, 27], [88, 22], [78, 8], [72, 18]],
    sriLanka:     [[79.5, 9.6], [81.8, 7.5], [80.5, 6.0], [79.8, 7.8]],
    indonesia:    [[96, 5], [106, -6], [118, -8], [120, -2], [110, 1]],
    australia:    [[114, -22], [129, -12], [142, -11], [153, -26], [147, -39], [131, -32], [115, -34]],
    japan:        [[130, 31], [136, 35], [141, 41], [145, 44], [141, 36], [132, 32]]
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

  // Helper: Draw a small cohesive vector airplane / ship / rocket at the head of a map route
  function drawRouteHeadIcon(g, kind, x, y, angle, color) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);

    if (kind === 'plane' || kind === 'flight' || kind === 'air') {
      g.fillStyle = '#FFFFFF';
      C.inkStyle(g, 2.8, C.PAL.ink);
      // Swept wings
      g.beginPath();
      g.moveTo(4, 0);
      g.lineTo(-10, -22);
      g.lineTo(-16, -22);
      g.lineTo(-8, 0);
      g.lineTo(-16, 22);
      g.lineTo(-10, 22);
      g.closePath();
      g.fill(); g.stroke();
      // Fuselage
      C.roundRect(g, -20, -5, 36, 10, 5, { fill: '#FFFFFF', lw: 2.8 });
      // Tail fin
      g.beginPath();
      g.moveTo(-16, 0);
      g.lineTo(-24, -10);
      g.lineTo(-20, 0);
      g.lineTo(-24, 10);
      g.closePath();
      g.fillStyle = color || C.PAL.red;
      g.fill(); g.stroke();
    } else if (kind === 'rocket' || kind === 'starship') {
      C.roundRect(g, -16, -6, 24, 12, 3, { fill: '#E2E8F0', lw: 2.6 });
      g.beginPath();
      g.moveTo(8, -6);
      g.lineTo(18, 0);
      g.lineTo(8, 6);
      g.closePath();
      g.fillStyle = color || '#EF4444';
      g.fill();
      C.inkStyle(g, 2.6, C.PAL.ink);
      g.stroke();
    } else if (kind === 'ship' || kind === 'boat') {
      g.rotate(-angle); // Keep ship upright
      C.roundRect(g, -14, -10, 22, 10, 2, { fill: '#FACC15', lw: 2.4 });
      g.beginPath();
      g.moveTo(-20, -2);
      g.lineTo(20, -2);
      g.lineTo(14, 8);
      g.lineTo(-14, 8);
      g.closePath();
      g.fillStyle = color || '#1E293B';
      g.fill();
      C.inkStyle(g, 2.6, C.PAL.ink);
      g.stroke();
    }
    g.restore();
  }

  /**
   * 1. EDITORIAL 9:16 2D VECTOR MAP CREATOR (`MAP.draw(g, lt, opts)`)
   * Default frame sits at `x: 80, y: 320, w: 780, h: 880` inside the Golden Safe Zone.
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

    // Warm Paper-Billions Ocean Card Frame
    C.roundRect(g, mx, my, mw, mh, 20, {
      fill: o.oceanColor || '#BAE6FD',
      lw: 4.5,
      shadow: true
    });

    g.save();
    C.pathRoundRect(g, mx, my, mw, mh, 20);
    g.clip();

    // Soft radial ocean depth vignette
    const oceanGrad = g.createRadialGradient(mx + mw * 0.5, my + mh * 0.45, mw * 0.1, mx + mw * 0.5, my + mh * 0.5, mw * 0.85);
    oceanGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
    oceanGrad.addColorStop(1, 'rgba(2, 132, 199, 0.18)');
    g.fillStyle = oceanGrad;
    g.fillRect(mx, my, mw, mh);

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

    // Base Continents with Paper-Billions coastal shelf rim
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

        // Outer shallow coastal water halo
        g.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        g.lineWidth = 9;
        g.lineJoin = 'round';
        g.stroke();

        g.fillStyle = isHi ? (o.highlightColor || '#FCA5A5') : (o.landColor || '#EDE5D5');
        g.fill();

        if (isHi && o.highlightHatch !== false) {
          const xs = screenPts.map((p) => p[0]);
          const ys = screenPts.map((p) => p[1]);
          const rx = Math.min.apply(null, xs);
          const ry = Math.min.apply(null, ys);
          g.save();
          g.clip();
          C.hatchRect(g, rx, ry, Math.max.apply(null, xs) - rx, Math.max.apply(null, ys) - ry, {
            color: 'rgba(220, 38, 38, 0.22)',
            spacing: 12,
            lw: 2.2
          });
          g.restore();
        }

        C.inkStyle(g, isHi ? 4.2 : 3.2, C.PAL.ink);
        g.stroke();
      });
    }

    // Custom Polygons / Regions / Empires
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
        const cx = C.clamp(pts.reduce((a, p) => a + p[0], 0) / pts.length, mx + 85, mx + mw - 85);
        const cy = C.clamp(pts.reduce((a, p) => a + p[1], 0) / pts.length, my + 50, my + mh - 50);
        g.font = '900 22px "Nunito", sans-serif';
        const tw = g.measureText(reg.label).width + 24;
        C.roundRect(g, cx - tw / 2, cy - 18, tw, 36, 8, { fill: 'rgba(255,255,255,0.92)', lw: 2.8 });
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(reg.label, cx, cy);
      }
    });

    // Animated Travel Routes + Optional Flying Plane / Ship / Rocket Icon
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

      // Optional Vehicle Icon along quadratic Bezier curve (`rt.icon: 'plane'|'ship'|'rocket'`)
      const iconKind = rt.icon || (/flight|fly|air|plane/i.test(rt.label || '') ? 'plane' : '');
      if (iconKind && rp > 0.05 && rp < 0.99) {
        const cx = (p0[0] + p1[0]) / 2;
        const cy = (p0[1] + p1[1]) / 2 + (rt.curve !== false ? curveY : 0);
        const u = rp;
        const ix = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * cx + u * u * p1[0];
        const iy = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * cy + u * u * p1[1];
        const dx = 2 * (1 - u) * (cx - p0[0]) + 2 * u * (p1[0] - cx);
        const dy = 2 * (1 - u) * (cy - p0[1]) + 2 * u * (p1[1] - cy);
        drawRouteHeadIcon(g, iconKind, ix, iy, Math.atan2(dy, dx), rt.color || C.PAL.red);
      }

      if (rt.label && rp > 0.4) {
        const lx = C.clamp((p0[0] + p1[0]) / 2, mx + 95, mx + mw - 95);
        const ly = C.clamp((p0[1] + p1[1]) / 2 + curveY * 0.55 - 22, my + 75, my + mh - 45);
        g.font = '700 30px "Caveat", cursive';
        const tw = g.measureText(rt.label).width + 26;
        C.roundRect(g, lx - tw / 2, ly - 20, tw, 38, 10, {
          fill: 'rgba(255, 255, 255, 0.95)',
          stroke: rt.color || C.PAL.red,
          lw: 3
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
   * Helper: Core 2.5D Vector Earth Sphere Renderer (`MAP.drawEarthCore`)
   * Used both by `MAP.globe` and by `DIAGRAM.orbit` so Earth never renders as an emoji in a blue circle!
   */
  function drawEarthCore(g, lt, cx, cy, r, opts) {
    const o = opts || {};
    const rotLon = (o.lon !== undefined ? o.lon : 78) + (o.spin !== undefined ? lt * o.spin : lt * 16);

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

    // 1. Outer Atmosphere Halo Glow
    if (o.glow !== false) {
      const grd = g.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.24);
      grd.addColorStop(0, C.rgba(o.glowColor || '#38BDF8', 0.32));
      grd.addColorStop(1, C.rgba(o.glowColor || '#38BDF8', 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(cx, cy, r * 1.24, 0, Math.PI * 2);
      g.fill();
    }

    // 2. Base Ocean Sphere
    C.circle(g, cx, cy, r, { fill: o.oceanColor || '#0284C7', lw: 4.5, shadow: true });

    g.save();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.clip();

    // Subtle Graticule Rings
    const gratCol = 'rgba(255,255,255,0.18)';
    [-0.5, 0, 0.5].forEach((latK) => {
      C.line(g, cx - r, cy + latK * r, cx + r, cy + latK * r, { lw: Math.max(1.2, r * 0.006), color: gratCol });
      g.strokeStyle = gratCol;
      g.lineWidth = Math.max(1.2, r * 0.006);
      g.beginPath();
      g.ellipse(cx, cy, r * Math.abs(latK || 0.25), r, 0, 0, Math.PI * 2);
      g.stroke();
    });

    // 3. Rotating Vector Continents
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
        C.inkStyle(g, Math.max(2.0, r * 0.011), C.PAL.ink);
        g.stroke();
      }
    });

    // 4. Soft Atmospheric Cloud Wisps
    if (o.clouds !== false && r >= 55) {
      g.fillStyle = 'rgba(255, 255, 255, 0.45)';
      [
        { y: -0.42, w: 0.48, speed: 14, phase: 0.1 },
        { y: 0.08,  w: 0.56, speed: 20, phase: 0.55 },
        { y: 0.48,  w: 0.42, speed: 12, phase: 0.82 }
      ].forEach((cl) => {
        const u = ((lt * (cl.speed / 120) + cl.phase) % 1) * 2 - 1;
        const cw = r * cl.w;
        const ch = Math.max(6, r * 0.075);
        C.roundRect(g, cx + u * r * 0.75 - cw / 2, cy + cl.y * r - ch / 2, cw, ch, ch / 2, {
          fill: 'rgba(255, 255, 255, 0.42)',
          stroke: false
        });
      });
    }

    // 5. Optional 3D-Projected Pins on Globe
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

    // 6. 2.5D Spherical Specular Highlight & Night Terminator Shadow
    const shd = g.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r);
    shd.addColorStop(0, 'rgba(255,255,255,0.22)');
    shd.addColorStop(0.65, 'rgba(0,0,0,0)');
    shd.addColorStop(1, 'rgba(15,23,42,0.34)');
    g.fillStyle = shd;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);

    g.restore();

    // Bold Outer Ink Rim
    C.circle(g, cx, cy, r, { fill: false, lw: Math.max(3.8, r * 0.016), stroke: C.PAL.ink });
    g.restore();
  }

  /**
   * 2. ORTHOGRAPHIC 2.5D EDITORIAL GLOBE (`MAP.globe(g, lt, opts)`)
   */
  function globe(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? o.x : 485;
    const cy = o.y !== undefined ? o.y : 820;
    const r = o.r || 320;

    drawEarthCore(g, lt, cx, cy, r, o);

    if (o.title && window.TEXT) {
      window.TEXT.badge(g, lt, {
        x: cx,
        y: Math.max(265, cy - r - 56),
        text: o.title,
        size: 28,
        fill: '#FFFFFF',
        t0: 0.05
      });
    }
  }

  function preloadAll() {
    return Promise.resolve();
  }

  window.MAP = {
    draw,
    world: draw,
    region: draw,
    globe,
    drawEarthCore,
    CONTINENTS,
    preloadAll
  };
})();