/**
 * MODULE 06: UNIVERSAL PROP, VEHICLE & METAPHOR CREATOR — 9:16 SHORTS EDITION (engine/06_props.js)
 * Zero reliance on fixed prop lists. Builds ANY object, artifact, machine,
 * furniture, container, document, vehicle, or physical metaphor from parameters & parts,
 * calibrated for the 1080x1920 vertical Safe Box (x: 90..860, floorY: 1320).
 */
(function () {
  const C = window.CORE;
  const SAFE = C.SAFE || { left: 90, right: 860, top: 240, bottom: 1340, cx: 500, cy: 820, floorY: 1320 };

  /**
   * 1. UNIVERSAL DECLARATIVE PROP CREATOR (`PROP.build(g, recipe, overrides)`)
   * Renders any custom prop defined in `DICT.PROPS` or inline.
   *
   * Supported part types inside `parts: [...]`:
   *   - Standard shapes (via CHAR.renderParts): 'rect', 'circle', 'ellipse', 'poly', 'line', 'arc', 'text'
   *   - Mechanical/Animated parts:
   *       { type: 'wheel', x, y, r, spokes, speed, color }
   *       { type: 'gear', x, y, r, teeth, speed, color }
   *       { type: 'flame', x, y, r, color, coreColor }
   *       { type: 'smoke', x, y, count, r, color }
   *       { type: 'liquid', x, y, w, h, level, color, bubbles }
   *       { type: 'screen', x, y, w, h, bg, text, lineColor }
   */
  function build(g, recipe, overrides) {
    const o = Object.assign({}, recipe || {}, overrides || {});
    const t = o.t !== undefined ? o.t : 0;
    const lt = o.lt !== undefined ? o.lt : t;
    const s = o.s !== undefined ? o.s : 1.0;

    let x = o.x !== undefined ? o.x : SAFE.cx;
    let y = o.y !== undefined ? o.y : SAFE.floorY;
    let dir = o.flipX ? -1 : 1;

    if (Array.isArray(o.moveX)) {
      const mx = o.moveX;
      const curT = mx[2] !== undefined ? mx[2] : lt;
      const t0 = mx.length >= 5 ? mx[3] : 0;
      const t1 = mx.length >= 5 ? mx[4] : (mx[3] || 1.5);
      const p = C.prog(curT, t0, t1);
      x = C.lerp(mx[0], mx[1], p);
      if (o.flipX === undefined && Math.abs(mx[1] - mx[0]) > 2) dir = mx[1] < mx[0] ? -1 : 1;
    }
    if (Array.isArray(o.moveY)) {
      const my = o.moveY;
      const curT = my[2] !== undefined ? my[2] : lt;
      const t0 = my.length >= 5 ? my[3] : 0;
      const t1 = my.length >= 5 ? my[4] : (my[3] || 1.5);
      const p = C.prog(curT, t0, t1);
      y = C.lerp(my[0], my[1], p);
    }
    if (o.float) {
      y += Math.sin(t * (o.floatSpeed || 3)) * (o.floatAmp || 8);
    }

    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate((o.rot * Math.PI) / 180);
    g.scale(s * dir, s);

    // Ground shadow
    if (o.shadow !== false && !o.float) {
      const sw = o.shadowW || 56;
      g.fillStyle = 'rgba(0, 0, 0, 0.20)';
      g.beginPath();
      g.ellipse(0, 3, sw, 10, 0, 0, Math.PI * 2);
      g.fill();
    }

    // Optional background glow aura
    if (o.glow) {
      const gr = o.glowR || 120;
      const grd = g.createRadialGradient(0, -(o.h || 80) / 2, 10, 0, -(o.h || 80) / 2, gr);
      grd.addColorStop(0, C.rgba(o.glow, 0.45));
      grd.addColorStop(1, C.rgba(o.glow, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, -(o.h || 80) / 2, gr, 0, Math.PI * 2);
      g.fill();
    }

    // Render parts array
    if (Array.isArray(o.parts)) {
      o.parts.forEach((p) => {
        if (!p) return;
        if (p.type === 'wheel') {
          drawWheelPart(g, p, t);
        } else if (p.type === 'gear') {
          drawGearPart(g, p, t);
        } else if (p.type === 'flame') {
          drawFlamePart(g, p, t);
        } else if (p.type === 'smoke') {
          drawSmokePart(g, p, t);
        } else if (p.type === 'liquid') {
          drawLiquidPart(g, p, t);
        } else if (p.type === 'screen') {
          drawScreenPart(g, p, t);
        } else if (window.CHAR && typeof window.CHAR.renderParts === 'function') {
          window.CHAR.renderParts(g, [p], t);
        }
      });
    }

    if (typeof o.draw === 'function') {
      o.draw(g, t, lt);
    }

    g.restore();
  }

  function drawWheelPart(g, p, t) {
    const x = p.x || 0, y = p.y || 0, r = p.r || 24;
    const ang = t * (p.speed !== undefined ? p.speed : 6);
    g.save();
    g.translate(x, y);
    C.circle(g, 0, 0, r, { fill: p.color || '#1E293B', lw: 3.8 });
    C.circle(g, 0, 0, r * 0.45, { fill: p.hubColor || '#CBD5E1', lw: 2.5 });
    const spokes = p.spokes || 4;
    for (let i = 0; i < spokes; i++) {
      const a = ang + (i / spokes) * Math.PI;
      C.line(g, -Math.cos(a) * (r * 0.42), -Math.sin(a) * (r * 0.42), Math.cos(a) * (r * 0.42), Math.sin(a) * (r * 0.42), { lw: 2.2 });
    }
    g.restore();
  }

  function drawGearPart(g, p, t) {
    const x = p.x || 0, y = p.y || 0, r = p.r || 32;
    const teeth = p.teeth || 8;
    const ang = t * (p.speed !== undefined ? p.speed : 2);
    const col = p.color || '#94A3B8';

    g.save();
    g.translate(x, y);
    g.rotate(ang);
    for (let i = 0; i < teeth; i++) {
      g.save();
      g.rotate((i / teeth) * Math.PI * 2);
      C.roundRect(g, -7, -r - 8, 14, 16, 3, { fill: col, lw: 3 });
      g.restore();
    }
    C.circle(g, 0, 0, r, { fill: col, lw: 3.5 });
    C.circle(g, 0, 0, r * 0.38, { fill: p.holeColor || '#334155', lw: 3 });
    g.restore();
  }

  function drawFlamePart(g, p, t) {
    const x = p.x || 0, y = p.y || 0, r = p.r || 28;
    const wob = Math.sin(t * 14 + x) * (r * 0.12);
    C.circle(g, x, y + wob * 0.5, r, { fill: p.color || '#EF4444', lw: 3 });
    C.circle(g, x + wob * 0.4, y + r * 0.18, r * 0.58, { fill: p.coreColor || '#FACC15', stroke: false });
  }

  function drawSmokePart(g, p, t) {
    const x = p.x || 0, y = p.y || 0, count = p.count || 3, r = p.r || 18;
    for (let i = 0; i < count; i++) {
      const prog = ((t * 0.6 + i / count) % 1);
      g.save();
      g.globalAlpha = 1 - prog;
      C.circle(g, x + Math.sin(t * 3 + i) * 14, y - prog * 70, r * (0.7 + prog * 0.6), {
        fill: p.color || '#94A3B8',
        lw: 2.5
      });
      g.restore();
    }
  }

  function drawLiquidPart(g, p, t) {
    const x = p.x || 0, y = p.y || 0, w = p.w || 60, h = p.h || 80;
    const level = C.clamp(p.level !== undefined ? p.level : 0.65, 0, 1);
    const lh = h * level;
    if (lh <= 1) return;
    C.roundRect(g, x - w / 2, y - lh, w, lh, p.r || 6, {
      fill: p.color || '#4ADE80',
      stroke: false
    });
    if (p.bubbles) {
      for (let i = 0; i < 3; i++) {
        const bp = ((t * 0.9 + i * 0.33) % 1);
        C.circle(g, x + (i - 1) * (w * 0.25), y - bp * lh, 4, {
          fill: 'rgba(255,255,255,0.6)',
          stroke: false
        });
      }
    }
  }

  function drawScreenPart(g, p, t) {
    const x = p.x || 0, y = p.y || 0, w = p.w || 120, h = p.h || 80;
    C.roundRect(g, x - w / 2, y - h / 2, w, h, 8, { fill: '#1E293B', lw: 3.5 });
    C.roundRect(g, x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, 4, { fill: p.bg || '#0F172A', lw: 2 });
    if (p.text) {
      g.font = '800 ' + (p.size || 20) + 'px "Space Mono", monospace';
      g.fillStyle = p.color || '#4ADE80';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(p.text, x, y);
    }
  }

  /**
   * 2. PARAMETRIC FURNITURE / WORKBENCH / PODIUM / SHELF CREATOR (`PROP.furniture`)
   * Builds any table, desk, bench, altar, throne, podium, or shelf rack at `y = 1320` floor.
   */
  function furniture(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : SAFE.cx;
    const y = o.y !== undefined ? o.y : SAFE.floorY;
    const w = o.w || 340;
    const h = o.h || 140;
    const s = o.s || 1.0;
    const col = o.color || '#A16207';
    const topCol = o.topColor || col;
    const style = o.style || 'table'; // 'table' | 'desk' | 'podium' | 'shelves' | 'bench'

    g.save();
    g.translate(x, y);
    g.scale(s, s);

    if (style === 'podium') {
      const pw = o.w || 140, ph = o.h || 200;
      C.roundRect(g, -pw / 2, -ph, pw, ph, 6, { fill: col, lw: 3.8, shadow: true });
      C.roundRect(g, -pw * 0.62, -ph - 16, pw * 1.24, 22, 6, { fill: topCol, lw: 3.8 });
      if (o.label) {
        C.roundRect(g, -pw * 0.38, -ph + 35, pw * 0.76, 44, 6, { fill: '#F8FAFC', lw: 2.5 });
        g.font = '900 22px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(o.label, 0, -ph + 57);
      }
    } else if (style === 'shelves') {
      const sw = o.w || 240, sh = o.h || 380, tiers = o.tiers || 4;
      C.roundRect(g, -sw / 2, -sh, sw, sh, 6, { fill: col, lw: 3.8, shadow: true });
      for (let i = 1; i < tiers; i++) {
        const sy = -sh + (i / tiers) * sh;
        C.line(g, -sw / 2, sy, sw / 2, sy, { lw: 5 });
      }
    } else {
      // Parametric table / desk / workbench / altar
      const legW = o.legW || 24;
      C.roundRect(g, -w / 2 + 20, -h, legW, h, 4, { fill: C.shadeColor(col, -15), lw: 3.5 });
      C.roundRect(g, w / 2 - 20 - legW, -h, legW, h, 4, { fill: C.shadeColor(col, -15), lw: 3.5 });
      if (style === 'desk' || o.panel) {
        C.roundRect(g, -w / 2 + 30, -h + 14, w - 60, h - 34, 4, { fill: col, lw: 3.5 });
      }
      C.roundRect(g, -w / 2, -h - 18, w, 24, 6, { fill: topCol, lw: 3.8, shadow: true });
    }
    g.restore();
  }

  /**
   * 3. PARAMETRIC CONTAINER / VESSEL / BATTERY / BOX CREATOR (`PROP.container`)
   * Builds any beaker, tank, barrel, battery, crate, chest, or silo with animated fill level!
   */
  function container(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : SAFE.cx;
    const y = o.y !== undefined ? o.y : SAFE.floorY;
    const w = o.w || 130;
    const h = o.h || 170;
    const s = o.s || 1.0;
    const style = o.style || 'tank'; // 'tank' | 'beaker' | 'battery' | 'box' | 'barrel'
    const level = o.level !== undefined
      ? o.level
      : (o.fromLevel !== undefined ? C.lerp(o.fromLevel, o.toLevel !== undefined ? o.toLevel : 1, C.seg(lt, o.t0 || 0, (o.t0 || 0) + (o.dur || 0.8))) : 0);

    g.save();
    g.translate(x, y);
    g.scale(s, s);

    if (style === 'box' || style === 'crate') {
      C.roundRect(g, -w / 2, -h, w, h, 8, { fill: o.color || '#D97706', hatch: o.hatch, lw: 3.8, shadow: true });
      C.line(g, -w / 2, -h * 0.72, w / 2, -h * 0.72, { lw: 3 });
    } else {
      // Vessel body
      if (style === 'battery') {
        C.roundRect(g, -w * 0.22, -h - 14, w * 0.44, 16, 4, { fill: '#94A3B8', lw: 3.5 });
      }
      C.roundRect(g, -w / 2, -h, w, h, 12, {
        fill: o.bodyColor || 'rgba(255, 255, 255, 0.75)',
        lw: 3.8,
        shadow: true
      });

      // Inner animated fill level
      if (level > 0.01) {
        drawLiquidPart(g, {
          x: 0,
          y: -6,
          w: w - 12,
          h: h - 12,
          level: level,
          color: o.fillColor || '#4ADE80',
          bubbles: o.bubbles
        }, lt);
      }

      // Outer border re-stroke
      C.roundRect(g, -w / 2, -h, w, h, 12, { fill: false, lw: 3.8 });
    }

    if (o.label) {
      g.font = '800 ' + (o.labelSize || 24) + 'px "Nunito", sans-serif';
      g.fillStyle = o.labelColor || C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.label, 0, -h / 2);
    }
    g.restore();
  }

  /**
   * 4. PARAMETRIC SHEET / DOCUMENT / SCROLL / SCREEN / SIGN CREATOR (`PROP.sheet`)
   */
  function sheet(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 485;
    const y = o.y !== undefined ? o.y : SAFE.cy;
    const w = o.w || 260;
    const h = o.h || 340;
    const s = o.s || 1.0;
    const style = o.style || 'document'; // 'document' | 'scroll' | 'check' | 'sign' | 'board'

    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate((o.rot * Math.PI) / 180);
    g.scale(s, s);

    if (style === 'sign') {
      C.roundRect(g, -6, 0, 12, o.poleH || 150, 2, { fill: '#64748B', lw: 3.5 });
    }

    const bg = o.color || (style === 'scroll' ? '#FDE68A' : '#FAF7F0');
    C.roundRect(g, -w / 2, -h / 2, w, h, 8, { fill: bg, lw: 3.8, shadow: true });

    if (style === 'scroll') {
      C.roundRect(g, -w / 2 - 12, -h / 2 - 10, w + 24, 20, 10, { fill: '#D97706', lw: 3.5 });
      C.roundRect(g, -w / 2 - 12, h / 2 - 10, w + 24, 20, 10, { fill: '#D97706', lw: 3.5 });
    }

    if (o.title) {
      g.font = '900 ' + (o.titleSize || 28) + 'px "Nunito", sans-serif';
      g.fillStyle = o.titleColor || C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.title, 0, o.lines === false ? 0 : -h / 2 + 44);
    }

    if (o.lines !== false && style !== 'sign') {
      const count = o.lineCount || 5;
      for (let i = 0; i < count; i++) {
        const ly = -h / 2 + 90 + i * 36;
        if (ly < h / 2 - 24) {
          C.line(g, -w / 2 + 28, ly, w / 2 - 28, ly, { lw: 3.5, color: '#94A3B8' });
        }
      }
    }

    if (o.parts && window.CHAR) {
      window.CHAR.renderParts(g, o.parts, lt);
    }
    g.restore();
  }

  /**
   * 5. UNIVERSAL PARAMETRIC VEHICLE CREATOR (`PROP.vehicle`)
   * Builds any wheeled, tracked, hull/sailed, winged, or rocket vehicle at `y = 1320` floor.
   */
  function vehicle(g, opts) {
    const o = opts || {};
    const t = o.t !== undefined ? o.t : 0;
    const lt = o.lt !== undefined ? o.lt : t;
    const s = o.s || 1.1;

    let x = o.x !== undefined ? o.x : SAFE.cx;
    let y = o.y !== undefined ? o.y : SAFE.floorY;
    let dir = o.flipX ? -1 : 1;

    if (Array.isArray(o.moveX)) {
      const mx = o.moveX;
      const curT = mx[2] !== undefined ? mx[2] : lt;
      const t0 = mx.length >= 5 ? mx[3] : 0;
      const t1 = mx.length >= 5 ? mx[4] : (mx[3] || 1.8);
      const p = C.prog(curT, t0, t1);
      x = C.lerp(mx[0], mx[1], p);
      if (o.flipX === undefined && Math.abs(mx[1] - mx[0]) > 2) dir = mx[1] < mx[0] ? -1 : 1;
    }

    // If custom `parts` are supplied, render via `PROP.build`
    if (Array.isArray(o.parts)) {
      build(g, o);
      return;
    }

    const kind = o.kind || o.type || 'truck';
    g.save();
    g.translate(x, y);
    g.scale(s * dir, s);

    if (kind === 'truck' || kind === 'van') {
      C.roundRect(g, -160, -145, 220, 115, 10, { fill: o.color || '#F8FAFC', lw: 4, shadow: true });
      C.roundRect(g, 60, -105, 85, 75, 10, { fill: o.cabColor || '#3B82F6', lw: 4 });
      C.roundRect(g, 82, -95, 52, 34, 4, { fill: '#BAE6FD', lw: 3 });
      [-100, 95].forEach((wx) => drawWheelPart(g, { x: wx, y: -26, r: 26 }, t));
      if (o.label) {
        g.save(); g.scale(dir, 1);
        g.font = '900 28px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink; g.textAlign = 'center';
        g.fillText(o.label, -50 * dir, -82);
        g.restore();
      }
    } else if (kind === 'car') {
      C.roundRect(g, -110, -68, 220, 46, 14, { fill: o.color || '#EF4444', lw: 4, shadow: true });
      C.roundRect(g, -65, -108, 125, 46, 14, { fill: o.color || '#EF4444', lw: 4 });
      C.roundRect(g, -52, -100, 100, 32, 8, { fill: '#BAE6FD', lw: 3 });
      [-65, 65].forEach((wx) => drawWheelPart(g, { x: wx, y: -22, r: 22 }, t));
    } else if (kind === 'ship' || kind === 'cargoShip' || kind === 'sailingShip') {
      if (kind === 'sailingShip' || o.sails) {
        C.line(g, 0, -70, 0, -240, { lw: 7, color: '#78350F' });
        C.roundRect(g, -75, -220, 150, 120, 24, { fill: o.sailColor || '#FAF7F0', lw: 3.8 });
      } else {
        C.roundRect(g, -160, -120, 90, 50, 4, { fill: '#EF4444', lw: 3.5 });
        C.roundRect(g, -65, -120, 90, 50, 4, { fill: '#3B82F6', lw: 3.5 });
        C.roundRect(g, 55, -145, 70, 75, 4, { fill: '#F8FAFC', lw: 3.5 });
      }
      if (window.CHAR) {
        window.CHAR.renderParts(g, [{
          type: 'poly',
          pts: [[-200, -70], [200, -70], [160, 0], [-175, 0]],
          fill: o.hullColor || (kind === 'sailingShip' ? '#78350F' : '#1E293B'),
          lw: 4
        }], t);
      }
    } else if (kind === 'plane') {
      C.roundRect(g, -160, -90, 320, 64, 32, { fill: o.color || '#F8FAFC', lw: 4, shadow: true });
      if (window.CHAR) {
        window.CHAR.renderParts(g, [{ type: 'poly', pts: [[-140, -90], [-180, -155], [-105, -90]], fill: o.tailColor || '#3B82F6', lw: 4 }], t);
      }
    } else if (kind === 'rocket') {
      drawFlamePart(g, { x: 0, y: 15, r: 28 }, t);
      C.roundRect(g, -42, -220, 84, 210, 42, { fill: o.color || '#F8FAFC', lw: 4, shadow: true });
      C.circle(g, 0, -135, 20, { fill: '#38BDF8', lw: 3.5 });
    } else if (kind === 'tank') {
      C.roundRect(g, -120, -46, 240, 44, 22, { fill: '#334155', lw: 4, shadow: true });
      C.roundRect(g, -95, -86, 190, 44, 10, { fill: o.color || '#4D7C0F', lw: 4 });
      C.roundRect(g, -50, -124, 100, 40, 14, { fill: o.color || '#3F6212', lw: 4 });
      C.roundRect(g, 50, -110, 110, 14, 4, { fill: o.color || '#3F6212', lw: 4 });
    } else if (kind === 'cart' || kind === 'chariot') {
      C.roundRect(g, -90, -85, 160, 55, 6, { fill: o.color || '#92400E', lw: 3.8, shadow: true });
      drawWheelPart(g, { x: -10, y: -28, r: 28, color: '#78350F', hubColor: '#D97706' }, t);
    }

    g.restore();
  }

  /**
   * 6. UNIVERSAL METAPHOR MECHANICS (9:16 Safe-Zone Calibrated)
   *    - PROP.flipper (also aliased as PROP.calendar)
   *    - PROP.scale (balance scale holding any custom props inside x: 90..860)
   *    - PROP.conveyor (moving belt carrying any custom props inside x: 90..860)
   *    - PROP.clock & PROP.gauge
   *    - PROP.magnifier
   */
  function flipper(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 485;
    const y = o.y !== undefined ? o.y : 760;
    const w = o.w || 240, h = o.h || 270, s = o.s || 1.0;
    const flipAt = o.flipAt !== undefined ? o.flipAt : 0.6;
    const flipped = lt >= flipAt;
    const headerText = flipped && o.nextHeader ? o.nextHeader : (o.header || 'JAN');
    const bodyText = flipped && o.nextDay ? o.nextDay : (o.day || '1');

    g.save();
    g.translate(x, y);
    g.scale(s, s);

    C.roundRect(g, -w / 2, -h / 2, w, h, 14, { fill: '#FFFFFF', lw: 4, shadow: true });
    C.roundRect(g, -w / 2, -h / 2, w, 72, 14, { fill: o.headerColor || '#DC2626', lw: 4 });
    g.fillStyle = o.headerColor || '#DC2626';
    g.fillRect(-w / 2 + 2, -h / 2 + 46, w - 4, 26);
    C.line(g, -w / 2, -h / 2 + 72, w / 2, -h / 2 + 72, { lw: 4 });

    [-w * 0.28, w * 0.28].forEach((rx) => {
      C.roundRect(g, rx - 8, -h / 2 - 16, 16, 32, 6, { fill: '#94A3B8', lw: 3 });
    });

    g.font = '900 36px "Fredoka", sans-serif';
    g.fillStyle = '#FFFFFF';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(headerText, 0, -h / 2 + 38);

    g.font = '900 ' + (o.daySize || 90) + 'px "Nunito", sans-serif';
    g.fillStyle = C.PAL.ink;
    g.fillText(String(bodyText), 0, 36);

    if (o.circleDate) {
      g.strokeStyle = '#DC2626';
      g.lineWidth = 4.5;
      g.beginPath();
      g.ellipse(0, 36, 66, 56, -0.1, 0, Math.PI * 2);
      g.stroke();
    }

    if (o.flipAt !== undefined && lt > flipAt && lt < flipAt + 0.55) {
      const fp = C.prog(lt, flipAt, flipAt + 0.55);
      g.save();
      g.translate(fp * 140, fp * 90 - Math.sin(fp * Math.PI) * 50);
      g.rotate(fp * 0.55);
      g.globalAlpha = 1 - fp;
      C.roundRect(g, -w / 2, -h / 2 + 72, w, h - 72, 8, { fill: '#FFFFFF', lw: 3 });
      g.font = '900 ' + (o.daySize || 90) + 'px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.fillText(String(o.day || '1'), 0, 36);
      g.restore();
    }
    g.restore();
  }

  function scale(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 485;
    const y = o.y !== undefined ? o.y : SAFE.floorY;
    const beamW = o.beamW || 500, pillarH = o.pillarH || 260;
    const t0 = o.t0 || 0.15;
    const targetTilt = o.tilt !== undefined ? o.tilt : 0.2;
    const curTilt = C.lerp(0, targetTilt, C.seg(lt, t0, t0 + (o.dur || 0.65), C.ease.outBack));

    g.save();
    g.translate(x, y);
    C.roundRect(g, -90, -28, 180, 28, 8, { fill: '#475569', lw: 4, shadow: true });
    C.roundRect(g, -16, -pillarH, 32, pillarH - 24, 6, { fill: '#64748B', lw: 4 });

    g.save();
    g.translate(0, -pillarH);
    g.rotate(curTilt);
    C.roundRect(g, -beamW / 2, -10, beamW, 20, 8, { fill: '#FACC15', lw: 4 });
    C.circle(g, 0, 0, 16, { fill: '#EAB308', lw: 3.8 });
    g.restore();

    [-1, 1].forEach((side) => {
      const bx = Math.cos(curTilt) * (side * beamW * 0.45);
      const by = -pillarH + Math.sin(curTilt) * (side * beamW * 0.45);
      const panY = by + 95;
      C.line(g, bx, by, bx - 52, panY, { lw: 3, color: '#475569' });
      C.line(g, bx, by, bx + 52, panY, { lw: 3, color: '#475569' });
      C.roundRect(g, bx - 72, panY, 144, 16, 6, { fill: '#94A3B8', lw: 3.5, shadow: true });

      g.save();
      g.translate(bx, panY);
      const customProp = side === -1 ? o.leftProp : o.rightProp;
      const customFn = side === -1 ? o.drawLeft : o.drawRight;
      if (typeof customFn === 'function') {
        customFn(g);
      } else if (customProp) {
        build(g, customProp, { x: 0, y: 0, shadow: false, t: lt });
      } else {
        const lbl = side === -1 ? o.leftLabel : o.rightLabel;
        const col = side === -1 ? (o.leftColor || '#4ADE80') : (o.rightColor || '#F87171');
        const boxH = side === -1 ? (o.leftH || 80) : (o.rightH || 115);
        if (lbl) {
          C.roundRect(g, -55, -boxH, 110, boxH, 8, { fill: col, lw: 3.5 });
          g.font = '800 22px "Nunito", sans-serif';
          g.fillStyle = C.PAL.ink;
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(lbl, 0, -boxH / 2);
        }
      }
      g.restore();
    });
    g.restore();
  }

  function conveyor(g, t, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 485;
    const y = o.y !== undefined ? o.y : 1180;
    const w = o.w || 720, h = o.h || 54, speed = o.speed !== undefined ? o.speed : 150;
    const left = x - w / 2;

    g.save();
    C.roundRect(g, left + 65, y + h / 2, 26, 130, 4, { fill: '#475569', lw: 3.5 });
    C.roundRect(g, left + w - 91, y + h / 2, 26, 130, 4, { fill: '#475569', lw: 3.5 });
    C.roundRect(g, left, y - h / 2, w, h, h / 2, { fill: '#334155', lw: 4, shadow: true });

    const rollerCount = Math.floor(w / 90);
    for (let i = 0; i < rollerCount; i++) {
      const rx = left + 45 + i * ((w - 90) / Math.max(1, rollerCount - 1));
      C.circle(g, rx, y, h * 0.34, { fill: '#94A3B8', lw: 3 });
    }

    const count = o.itemCount || 3;
    const spacing = w / count;
    for (let i = 0; i < count; i++) {
      const ix = left + ((i * spacing + t * speed) % w);
      const iy = y - h / 2;
      g.save();
      g.translate(ix, iy);
      if (typeof o.drawItem === 'function') {
        o.drawItem(g, i, t);
      } else if (o.itemProp) {
        build(g, o.itemProp, { x: 0, y: 0, shadow: false, t: t });
      } else {
        container(g, t, { x: 0, y: 0, w: 80, h: 70, style: 'box', label: o.itemLabel });
      }
      g.restore();
    }
    g.restore();
  }

  function clock(g, t, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 485, y = o.y !== undefined ? o.y : 520, r = o.r || 72;
    const speed = o.speed !== undefined ? o.speed : 2.5;

    g.save();
    g.translate(x, y);
    C.circle(g, 0, 0, r, { fill: '#FFFFFF', lw: 4.5, shadow: true });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      C.line(g, Math.cos(a) * (r - 16), Math.sin(a) * (r - 16), Math.cos(a) * (r - 8), Math.sin(a) * (r - 8), { lw: 3 });
    }
    const minA = t * speed - Math.PI / 2;
    const hrA = t * (speed / 12) - Math.PI / 2;
    C.line(g, 0, 0, Math.cos(hrA) * (r * 0.48), Math.sin(hrA) * (r * 0.48), { lw: 4.5 });
    C.line(g, 0, 0, Math.cos(minA) * (r * 0.72), Math.sin(minA) * (r * 0.72), { lw: 3.5, color: '#DC2626' });
    C.circle(g, 0, 0, 5, { fill: C.PAL.ink, stroke: false });
    g.restore();
  }

  function gauge(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 485, y = o.y !== undefined ? o.y : SAFE.cy, r = o.r || 135;
    const val = C.clamp(o.value !== undefined ? o.value : C.seg(lt, o.t0 || 0, (o.t0 || 0) + 0.8), 0, 1);

    g.save();
    g.translate(x, y);
    g.beginPath();
    g.arc(0, 0, r, Math.PI, Math.PI * 2);
    g.closePath();
    g.fillStyle = '#FFFFFF';
    g.fill();
    C.inkStyle(g, 4);
    g.stroke();

    g.beginPath();
    g.arc(0, 0, r - 18, Math.PI * 1.68, Math.PI * 1.96);
    g.strokeStyle = '#EF4444';
    g.lineWidth = 16;
    g.stroke();

    const ang = Math.PI + val * Math.PI;
    C.line(g, 0, 0, Math.cos(ang) * (r - 24), Math.sin(ang) * (r - 24), { lw: 5 });
    C.circle(g, 0, 0, 12, { fill: '#475569', lw: 3.5 });
    if (o.label) {
      g.font = '800 28px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.fillText(o.label, 0, 44);
    }
    g.restore();
  }

  function magnifier(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 485, y = o.y !== undefined ? o.y : SAFE.cy, r = o.r || 110;
    const angle = (o.angle !== undefined ? o.angle : 40) * (Math.PI / 180);

    g.save();
    g.translate(x, y);
    g.save();
    g.rotate(angle);
    C.roundRect(g, r - 4, -10, 95, 20, 8, { fill: '#78350F', lw: 3.8, shadow: true });
    g.restore();

    C.circle(g, 0, 0, r, { fill: o.fill || 'rgba(186, 230, 253, 0.28)', stroke: '#475569', lw: 10, shadow: true });
    C.circle(g, 0, 0, r + 5, { fill: false, stroke: C.PAL.ink, lw: 3.5 });

    if (o.parts && window.CHAR) {
      window.CHAR.renderParts(g, o.parts, o.t || 0);
    }
    if (o.text) {
      g.font = '900 ' + (o.size || 34) + 'px "Nunito", sans-serif';
      g.fillStyle = o.color || '#DC2626';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.text, 0, 0);
    }
    g.restore();
  }

  // Universal router so `PROP.draw(g, recipeOrType, opts)` works with any Step 10 Dictionary prop
  function draw(g, recipeOrKind, opts) {
    if (typeof recipeOrKind === 'object') {
      build(g, recipeOrKind, opts);
      return;
    }
    const o = opts || {};
    if (recipeOrKind === 'desk' || recipeOrKind === 'table' || recipeOrKind === 'podium' || recipeOrKind === 'shelves') {
      furniture(g, Object.assign({ style: recipeOrKind }, o));
    } else if (recipeOrKind === 'document' || recipeOrKind === 'scroll' || recipeOrKind === 'sign') {
      sheet(g, o.lt || o.t || 0, Object.assign({ style: recipeOrKind }, o));
    } else {
      container(g, o.lt || o.t || 0, Object.assign({ style: recipeOrKind }, o));
    }
  }

  window.PROP = {
    build,
    furniture,
    container,
    sheet,
    vehicle,
    flipper,
    calendar: flipper,
    scale,
    conveyor,
    clock,
    gauge,
    magnifier,
    draw
  };
})();