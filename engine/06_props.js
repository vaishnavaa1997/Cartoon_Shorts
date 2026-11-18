/**
 * MODULE 06: UNIVERSAL PROP, VEHICLE, ROCKET & METAPHOR CREATOR — 9:16 PAPER BILLIONS EDITION (engine/06_props.js)
 * 100% Topic-Agnostic Universal Engine:
 * - Rigid local-coordinate transforms so nosecones, windows, wings & engines NEVER detach.
 * - Fixed nosecone path preservation (zero wireframe box artifacts around curved hulls).
 * - Auto-fitted stage/prop labels so text like "STARSHIP" never overflows its badge.
 * - Altitude-aware ground shadows (never draws a floor puddle in mid-air under flying rockets).
 * - Calibrated for the 1080x1920 vertical Safe Box (x: 90..860, floorY: 1320).
 */
(function () {
  const C = window.CORE;
  const SAFE = C.SAFE || { left: 90, right: 860, top: 240, bottom: 1340, cx: 500, cy: 820, floorY: 1320 };

  function tonePropColor(col, role) {
    if (!col || typeof col !== 'string' || !col.startsWith('#')) return col;
    if (C.harmonizeColor) return C.harmonizeColor(col, role);
    return col;
  }

  // Soft Paper Billions cylindrical highlight + crescent rim shadow overlay
  function applyCylinderShade(g, x, y, w, h, r) {
    g.save();
    g.beginPath();
    if (r && r > 0) {
      C.pathRoundRect(g, x, y, w, h, r);
    } else {
      g.rect(x, y, w, h);
    }
    g.clip();

    const grad = g.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, 'rgba(15, 20, 32, 0.13)');
    grad.addColorStop(0.24, 'rgba(255, 255, 255, 0.20)');
    grad.addColorStop(0.58, 'rgba(255, 255, 255, 0.0)');
    grad.addColorStop(1, 'rgba(15, 20, 32, 0.20)');
    g.fillStyle = grad;
    g.fillRect(x, y, w, h);
    g.restore();
  }

  // Closed polygon helper with Paper Billions ink outline
  function drawPoly(g, pts, opts) {
    if (!pts || pts.length < 2) return;
    const o = opts || {};
    g.save();
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      g.lineTo(pts[i][0], pts[i][1]);
    }
    if (o.close !== false) g.closePath();
    if (o.fill) {
      g.fillStyle = tonePropColor(o.fill);
      g.fill();
    }
    if (o.stroke !== false) {
      g.strokeStyle = o.stroke || (C.PAL ? C.PAL.ink : '#18181B');
      g.lineWidth = o.lw || 3.6;
      g.lineJoin = 'round';
      g.lineCap = 'round';
      g.stroke();
    }
    g.restore();
  }

  /**
   * Altitude-aware ground shadow helper:
   * - Draws contact shadow at (0, 3) ONLY when resting near the floor
   * - Projects a subtle, faded shadow onto `SAFE.floorY` when elevated in the air
   */
  function drawAltitudeShadow(g, worldY, scale, sw) {
    const floorY = SAFE.floorY || 1320;
    const dist = floorY - worldY;
    if (Math.abs(dist) <= 36) {
      g.fillStyle = 'rgba(15, 20, 30, 0.22)';
      g.beginPath();
      g.ellipse(0, 3, sw, 9.5, 0, 0, Math.PI * 2);
      g.fill();
    } else if (dist > 36 && dist < 650 && scale > 0.1) {
      const factor = C.clamp(1 - dist / 650, 0.18, 0.75);
      const localFloorY = dist / scale;
      g.fillStyle = 'rgba(15, 20, 30, ' + (0.16 * factor).toFixed(3) + ')';
      g.beginPath();
      g.ellipse(0, localFloorY, sw * factor, 8 * factor, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  /**
   * UNIVERSAL COORDINATE NORMALIZER FOR DECLARATIVE `parts: [...]` ARRAYS
   */
  function normalizePartCoordinates(parts) {
    if (!Array.isArray(parts) || parts.length === 0) return parts;

    let hasZeroCenteredSibling = false;
    let minSiblingY = 0;
    let maxSiblingY = 0;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!p) continue;
      if (p.type === 'poly' && Array.isArray(p.pts) && p.pts.length > 0) {
        let minX = Infinity, maxX = -Infinity;
        for (let j = 0; j < p.pts.length; j++) {
          const pt = p.pts[j];
          if (pt[0] < minX) minX = pt[0];
          if (pt[0] > maxX) maxX = pt[0];
          if (pt[1] < minSiblingY) minSiblingY = pt[1];
          if (pt[1] > maxSiblingY) maxSiblingY = pt[1];
        }
        if (Math.abs((minX + maxX) / 2) <= 20) hasZeroCenteredSibling = true;
      } else if (p.type === 'circle' || p.type === 'text') {
        if (Math.abs(p.x || 0) <= 20) hasZeroCenteredSibling = true;
        if ((p.y || 0) < minSiblingY) minSiblingY = p.y || 0;
      } else if (p.type === 'line') {
        if (Math.abs(((p.x1 || 0) + (p.x2 || 0)) / 2) <= 20) hasZeroCenteredSibling = true;
        minSiblingY = Math.min(minSiblingY, p.y1 || 0, p.y2 || 0);
        maxSiblingY = Math.max(maxSiblingY, p.y1 || 0, p.y2 || 0);
      }
    }

    return parts.map((p) => {
      if (!p || p.type !== 'rect') return p;
      const w = p.w || 20;
      const h = p.h || 20;
      let nx = p.x || 0;
      let ny = p.y || 0;

      if (p.anchor === 'topLeft' || p.topLeft === true) {
        nx += w / 2;
        ny += h / 2;
      } else {
        if (w >= 24 && Math.abs(nx + w / 2) <= 2.5 && hasZeroCenteredSibling) {
          nx = 0;
        }
        if (h >= 40 && Math.abs(ny + h) <= 3 && (minSiblingY >= -h - 40 && maxSiblingY <= 25)) {
          ny = -h / 2;
        }
      }

      if (nx === (p.x || 0) && ny === (p.y || 0)) return p;
      return Object.assign({}, p, { x: nx, y: ny });
    });
  }

  /**
   * UNIVERSAL ARCHETYPE ROUTER
   */
  function resolveUniversalArchetype(o) {
    if (o.useRawParts) return null;
    const explicitKind = String(o.kind || o.preset || o.style || o.type || '').toLowerCase();

    if (explicitKind === 'upperstage' || explicitKind === 'orbiter' || explicitKind === 'spacecraft') {
      return { builder: 'rocket', variant: 'upperStage' };
    }
    if (explicitKind === 'booster' || explicitKind === 'boosterstage' || explicitKind === 'firststage') {
      return { builder: 'rocket', variant: 'booster' };
    }
    if (explicitKind === 'twostage' || explicitKind === 'twostagerocket' || explicitKind === 'multistage' || explicitKind === 'fullstack' || explicitKind === 'full_stack' || explicitKind === 'stack') {
      return { builder: 'rocket', variant: 'twoStage' };
    }
    if (explicitKind === 'rocket') {
      return { builder: 'rocket', variant: o.variant || (o.stages === 2 ? 'twoStage' : 'upperStage') };
    }
    if (explicitKind === 'launchtower' || explicitKind === 'trusstower' || explicitKind === 'catchtower' || explicitKind === 'tower') {
      return { builder: 'tower' };
    }
    if (explicitKind === 'satellite') {
      return { builder: 'vehicle', kind: 'satellite' };
    }
    if (explicitKind === 'trash' || explicitKind === 'bin' || explicitKind === 'garbage') {
      return { builder: 'bin', label: o.label };
    }

    if (!Array.isArray(o.parts) || o.parts.length === 0) return null;

    const texts = [];
    let circleCount = 0;
    let polyCount = 0;
    let lineCount = 0;
    let rectCount = 0;
    let hasFlame = false;

    for (let i = 0; i < o.parts.length; i++) {
      const p = o.parts[i];
      if (!p) continue;
      if (p.type === 'text' && p.text) texts.push(String(p.text).trim());
      if (p.type === 'circle') circleCount++;
      if (p.type === 'poly') polyCount++;
      if (p.type === 'line') lineCount++;
      if (p.type === 'rect') rectCount++;
      if (p.type === 'flame') hasFlame = true;
    }

    if (lineCount >= 4 && rectCount >= 1 && polyCount === 0 && circleCount <= 3) {
      const tallRect = o.parts.find((p) => p && p.type === 'rect' && (p.h || 0) >= 240 && (p.w || 100) <= 120);
      if (tallRect) {
        return { builder: 'tower', h: tallRect.h || 420 };
      }
    }

    if (circleCount >= 3 && polyCount >= 2 && rectCount >= 1) {
      const wideRect = o.parts.find((p) => p && p.type === 'rect' && (p.w || 0) > (p.h || 0) * 1.8 && (p.w || 0) >= 140);
      if (wideRect) {
        return { builder: 'vehicle', kind: 'plane' };
      }
    }

    const verticalHullRects = o.parts.filter((p) => p && p.type === 'rect' && (p.h || 0) >= (p.w || 40) * 1.6 && (p.h || 0) >= 110);
    if (verticalHullRects.length >= 1 && (polyCount >= 2 || circleCount >= 3 || hasFlame)) {
      if (verticalHullRects.length >= 2 && texts.length >= 2) {
        return { builder: 'rocket', variant: 'twoStage', labelTop: texts[0], labelBot: texts[1], flame: hasFlame };
      }
      if (polyCount >= 3) {
        return { builder: 'rocket', variant: 'upperStage', label: texts[0] || o.label || '', flame: hasFlame };
      }
      return { builder: 'rocket', variant: 'booster', label: texts[0] || o.label || '', flame: hasFlame };
    }

    if (rectCount >= 3 && polyCount === 0 && circleCount <= 2) {
      const solarWings = o.parts.filter((p) => p && p.type === 'rect' && (p.w || 0) > (p.h || 0) * 1.4 && Math.abs(p.x || 0) >= 40);
      if (solarWings.length >= 2) {
        return { builder: 'vehicle', kind: 'satellite' };
      }
    }

    return null;
  }

  /**
   * 1. UNIVERSAL MULTI-STAGE ROCKET BUILDER (`PROP.rocket(g, opts)`)
   * Supports `variant`: 'upperStage' | 'booster' | 'boosterStage' | 'twoStage' | 'classic'
   * Origin (0, 0) is the bottom-center of the rocket base.
   */
  function rocket(g, opts) {
    const o = opts || {};
    const t = o.t !== undefined ? o.t : 0;
    const rawVariant = String(o.variant || o.kind || 'upperStage').toLowerCase();
    const w = o.w || 92;
    const r = w / 2;

    g.save();

    if (rawVariant === 'twostage' || rawVariant === 'twostagerocket' || rawVariant === 'multistage' || rawVariant === 'fullstack') {
      const boosterH = o.boosterH || 230;
      const shipH = o.shipH || 165;
      const noseH = o.noseH || 78;
      const sep = C.clamp(o.stageSep !== undefined ? o.stageSep : (o.separation || 0), 0, 1);
      const sepGap = sep * (o.sepDist || 110);

      // --- STAGE 1: LOWER BOOSTER STAGE (Bottom at y = 0, Top at y = -boosterH) ---
      drawBoosterStage(g, {
        w: w,
        h: boosterH,
        yBase: 0,
        color: o.boosterColor || o.color,
        label: o.labelBot !== undefined ? o.labelBot : '',
        flame: o.flame !== false && sep < 0.25,
        t: t
      });

      if (sep > 0.02 && sep < 0.75) {
        drawFlamePart(g, { x: 0, y: -boosterH - sepGap * 0.35, r: w * 0.38, color: '#DD6B20', coreColor: '#F4DC7A' }, t);
      }

      // --- STAGE 2: UPPER ORBITAL STAGE (Exact same width `w` & centerline `x = 0`) ---
      g.save();
      g.translate(0, -boosterH - sepGap);
      drawUpperStage(g, {
        w: w,
        h: shipH,
        noseH: noseH,
        color: o.color,
        heatShield: o.heatShield !== false,
        flaps: o.flaps !== false,
        label: o.labelTop !== undefined ? o.labelTop : (o.label || ''),
        flame: sep > 0.08 || Boolean(o.upperFlame),
        showEngines: sep > 0.04,
        reentry: o.reentry,
        t: t
      });
      g.restore();

    } else if (rawVariant === 'booster' || rawVariant === 'boosterstage' || rawVariant === 'firststage') {
      drawBoosterStage(g, {
        w: w,
        h: o.h || 280,
        yBase: 0,
        color: o.color,
        label: o.label !== undefined ? o.label : '',
        flame: Boolean(o.flame),
        t: t
      });
    } else if (rawVariant === 'classic') {
      const h = o.h || 210;
      if (o.flame !== false) drawRocketPlume(g, 0, 10, w * 0.45, t);
      drawPoly(g, [[-r, -28], [-r - 32, 16], [-r, 4]], { fill: o.finColor || '#C83E37' });
      drawPoly(g, [[r, -28], [r + 32, 16], [r, 4]], { fill: o.finColor || '#C83E37' });
      C.roundRect(g, -r, -h, w, h, r, { fill: o.color || '#F4F0E6', lw: 4 });
      applyCylinderShade(g, -r, -h, w, h, r);
      C.circle(g, 0, -h * 0.58, w * 0.24, { fill: '#38BDF8', lw: 3.5 });
      if (o.label) {
        drawStageLabel(g, o.label, w, -h * 0.34);
      }
    } else {
      drawUpperStage(g, {
        w: w,
        h: o.h || 200,
        noseH: o.noseH || 88,
        color: o.color,
        heatShield: o.heatShield !== false,
        flaps: o.flaps !== false,
        label: o.label !== undefined ? o.label : '',
        flame: Boolean(o.flame),
        showEngines: true,
        reentry: o.reentry,
        t: t
      });
    }

    g.restore();
  }

  /**
   * Auto-fitted Stage Label Badge:
   * Dynamically scales font size and badge width so labels like "STARSHIP" NEVER overflow the white pill!
   */
  function drawStageLabel(g, text, w, yCenter) {
    if (!text) return;
    const str = String(text).trim();
    if (!str) return;

    g.save();
    const maxBoxW = w - 10;
    const minBoxW = w - 20;
    let fontSize = Math.min(17, Math.floor(w * 0.20));
    g.font = '900 ' + fontSize + 'px "Nunito", sans-serif';

    let textW = g.measureText(str).width;
    const maxAllowedTextW = maxBoxW - 12;
    if (textW > maxAllowedTextW && textW > 0) {
      fontSize = Math.max(9.5, Math.floor(fontSize * (maxAllowedTextW / textW) * 10) / 10);
      g.font = '900 ' + fontSize + 'px "Nunito", sans-serif';
      textW = g.measureText(str).width;
    }

    const boxW = C.clamp(textW + 14, minBoxW, maxBoxW);
    const boxH = 32;
    C.roundRect(g, -boxW / 2, yCenter - boxH / 2, boxW, boxH, 6, {
      fill: '#F4F0E6',
      lw: 2.5,
      grad: false
    });

    g.fillStyle = '#18181B';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(str, 0, yCenter + 0.5);
    g.restore();
  }

  function drawRocketPlume(g, x, y, radius, t) {
    const wob = Math.sin(t * 22) * 5;
    const len = radius * 3.0 + wob;
    g.save();
    g.translate(x, y);
    drawPoly(g, [
      [-radius * 0.75, 0],
      [radius * 0.75, 0],
      [radius * 0.95, len * 0.45],
      [wob * 0.4, len],
      [-radius * 0.95, len * 0.45]
    ], { fill: '#D93829', stroke: '#B91C1C', lw: 2.5 });
    drawPoly(g, [
      [-radius * 0.42, 0],
      [radius * 0.42, 0],
      [wob * 0.2, len * 0.65]
    ], { fill: '#F4DC7A', stroke: false });
    g.restore();
  }

  function drawEngineBells(g, count, totalW, yBase) {
    const bellW = Math.min(22, (totalW * 0.78) / count);
    const bellH = 18;
    const span = bellW * count + (count - 1) * 4;
    const startX = -span / 2 + bellW / 2;
    for (let i = 0; i < count; i++) {
      const bx = startX + i * (bellW + 4);
      drawPoly(g, [
        [bx - bellW * 0.32, yBase - 2],
        [bx + bellW * 0.32, yBase - 2],
        [bx + bellW * 0.52, yBase + bellH],
        [bx - bellW * 0.52, yBase + bellH]
      ], { fill: '#334155', lw: 3 });
    }
  }

  function drawBoosterStage(g, cfg) {
    const w = cfg.w || 92;
    const r = w / 2;
    const h = cfg.h || 260;
    const t = cfg.t || 0;

    if (cfg.flame) {
      drawRocketPlume(g, 0, 18, w * 0.52, t);
    }

    drawEngineBells(g, 4, w, 0);

    C.roundRect(g, -r, -h, w, h, 8, {
      fill: cfg.color || '#DCE2E8',
      hatch: true,
      hatchColor: 'rgba(15, 23, 42, 0.07)',
      lw: 4
    });
    applyCylinderShade(g, -r, -h, w, h, 8);

    C.roundRect(g, -r, -24, w, 24, 4, { fill: '#334155', lw: 3.5 });
    C.roundRect(g, -r, -h, w, 20, 4, { fill: '#475569', lw: 3.5 });

    const finY = -h + 28;
    drawPoly(g, [[-r, finY], [-r - 28, finY - 6], [-r - 28, finY + 18], [-r, finY + 16]], { fill: '#334155', lw: 3.2 });
    drawPoly(g, [[r, finY], [r + 28, finY - 6], [r + 28, finY + 18], [r, finY + 16]], { fill: '#334155', lw: 3.2 });
    C.roundRect(g, -r - 8, finY + 22, 8, 8, 2, { fill: '#E3B330', lw: 2.5 });
    C.roundRect(g, r, finY + 22, 8, 8, 2, { fill: '#E3B330', lw: 2.5 });

    C.line(g, -r + 4, -h * 0.35, r - 4, -h * 0.35, { lw: 2, color: '#94A3B8' });
    C.line(g, -r + 4, -h * 0.68, r - 4, -h * 0.68, { lw: 2, color: '#94A3B8' });

    if (cfg.label) {
      drawStageLabel(g, cfg.label, w, -h * 0.56);
    }
  }

  function pathUpperStageHull(g, r, h, noseH, totalH) {
    g.beginPath();
    g.moveTo(-r, 0);
    g.lineTo(-r, -h);
    g.quadraticCurveTo(-r, -h - noseH * 0.68, 0, -totalH);
    g.quadraticCurveTo(r, -h - noseH * 0.68, r, -h);
    g.lineTo(r, 0);
    g.closePath();
  }

  function drawUpperStage(g, cfg) {
    const w = cfg.w || 92;
    const r = w / 2;
    const h = cfg.h || 195;
    const noseH = cfg.noseH || 84;
    const totalH = h + noseH;
    const t = cfg.t || 0;

    if (cfg.reentry) {
      g.save();
      const pGrad = g.createRadialGradient(-r * 0.4, -totalH * 0.5, 10, 0, -totalH * 0.5, totalH * 0.72);
      pGrad.addColorStop(0, 'rgba(235, 130, 50, 0.50)');
      pGrad.addColorStop(0.6, 'rgba(217, 56, 41, 0.32)');
      pGrad.addColorStop(1, 'rgba(217, 56, 41, 0)');
      g.fillStyle = pGrad;
      g.beginPath();
      g.ellipse(-10, -totalH * 0.5, r * 2.1, totalH * 0.65, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    if (cfg.flame) {
      drawRocketPlume(g, 0, 16, w * 0.44, t);
    }
    if (cfg.showEngines !== false) {
      drawEngineBells(g, 3, w * 0.85, 0);
    }

    if (cfg.flaps !== false) {
      drawPoly(g, [
        [-r, -h * 0.38],
        [-r - 28, -h * 0.16],
        [-r - 24, -4],
        [-r, -4]
      ], { fill: '#1E293B', lw: 3.5 });
      drawPoly(g, [
        [r, -h * 0.38],
        [r + 28, -h * 0.16],
        [r + 24, -4],
        [r, -4]
      ], { fill: '#8D9AA8', lw: 3.5 });

      drawPoly(g, [
        [-r * 0.78, -h - noseH * 0.25],
        [-r - 18, -h - noseH * 0.02],
        [-r, -h + 10]
      ], { fill: '#1E293B', lw: 3.5 });
      drawPoly(g, [
        [r * 0.78, -h - noseH * 0.25],
        [r + 18, -h - noseH * 0.02],
        [r, -h + 10]
      ], { fill: '#8D9AA8', lw: 3.5 });
    }

    // Unified cylinder + ogive nosecone silhouette (with preserved outer path!)
    g.save();
    pathUpperStageHull(g, r, h, noseH, totalH);
    g.fillStyle = tonePropColor(cfg.color || '#DCE2E8');
    g.fill();

    g.save();
    g.clip();
    C.hatchRect(g, -r, -totalH, w, totalH, { color: 'rgba(15, 23, 42, 0.07)', spacing: 14, lw: 2 });

    if (cfg.heatShield !== false) {
      g.fillStyle = '#1E293B';
      g.fillRect(-r, -totalH, w * 0.38, totalH);
      C.line(g, -r + w * 0.38, -totalH, -r + w * 0.38, 0, { lw: 3, color: '#0F172A' });
    }

    C.line(g, -r, -h, r, -h, { lw: 3, color: '#475569' });
    C.line(g, -r, -h * 0.5, r, -h * 0.5, { lw: 2.2, color: '#94A3B8' });
    applyCylinderShade(g, -r, -totalH, w, totalH, 0);
    g.restore();

    // Re-trace the exact curved ogive hull path before stroking so no rectangular box ever appears!
    pathUpperStageHull(g, r, h, noseH, totalH);
    g.strokeStyle = C.PAL ? C.PAL.ink : '#18181B';
    g.lineWidth = 4;
    g.lineJoin = 'round';
    g.stroke();
    g.restore();

    C.roundRect(g, -r - 7, -h + 18, 7, 8, 2, { fill: '#E3B330', lw: 2.5 });
    C.roundRect(g, r, -h + 18, 7, 8, 2, { fill: '#E3B330', lw: 2.5 });

    if (cfg.label) {
      drawStageLabel(g, cfg.label, w, -h * 0.64);
    }
  }

  /**
   * 2. INDUSTRIAL TRUSS / CATCH TOWER BUILDER (`PROP.launchTower(g, opts)`)
   */
  function launchTower(g, opts) {
    const o = opts || {};
    const h = o.h || 450;
    const w = o.w || 68;
    const r = w / 2;

    g.save();

    C.roundRect(g, -r * 1.45, -36, w * 1.45, 36, 6, { fill: '#475569', lw: 4, shadow: true });

    g.save();
    g.beginPath();
    g.rect(-r, -h, w, h - 36);
    g.clip();

    C.roundRect(g, -r, -h, w, h - 36, 4, { fill: '#1E293B', lw: 4 });

    const bays = 8;
    const bayH = (h - 36) / bays;
    for (let i = 0; i < bays; i++) {
      const y0 = -36 - i * bayH;
      const y1 = y0 - bayH;
      C.line(g, -r + 4, y0, r - 4, y1, { lw: 2.8, color: '#475569' });
      C.line(g, r - 4, y0, -r + 4, y1, { lw: 2.8, color: '#475569' });
      C.line(g, -r, y1, r, y1, { lw: 3, color: '#334155' });
    }
    g.restore();

    C.roundRect(g, -r, -h, w, h - 36, 4, { fill: false, lw: 4 });

    C.roundRect(g, -r - 6, -h - 16, w + 28, 16, 4, { fill: '#334155', lw: 3.5 });
    C.line(g, 0, -h - 16, 0, -h - 54, { lw: 4, color: '#64748B' });

    if (o.chopsticks !== false && o.arms !== false && o.catchArms !== false) {
      const armY = o.catchY !== undefined ? o.catchY : -h * 0.72;
      const armLen = o.armLen || 135;
      C.roundRect(g, -r - 8, armY - 14, w + 16, 28, 5, { fill: '#E3B330', lw: 3.5 });
      C.roundRect(g, r, armY - 9, armLen, 18, 5, { fill: '#64748B', lw: 3.5 });
      C.roundRect(g, r + armLen - 26, armY - 12, 26, 24, 4, { fill: '#E3B330', lw: 3 });
    }

    g.restore();
  }

  /**
   * 3. UNIVERSAL DECLARATIVE PROP CREATOR (`PROP.build(g, recipe, overrides)`)
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

    const resolved = resolveUniversalArchetype(o);
    if (resolved) {
      g.save();
      g.translate(x, y);
      if (o.rot) g.rotate((o.rot * Math.PI) / 180);
      g.scale(s * dir, s);

      if (o.shadow !== false && !o.float && !o.rot) {
        drawAltitudeShadow(g, y, s, o.shadowW || 56);
      }

      if (resolved.builder === 'rocket') {
        rocket(g, Object.assign({}, o, resolved, { t: t, lt: lt }));
      } else if (resolved.builder === 'tower') {
        launchTower(g, Object.assign({}, o, resolved, { t: t, lt: lt }));
      } else if (resolved.builder === 'bin') {
        g.restore();
        container(g, lt, Object.assign({}, o, { x: x, y: y, s: s, style: 'bin', label: resolved.label }));
        return;
      } else if (resolved.builder === 'vehicle') {
        g.restore();
        vehicle(g, Object.assign({}, o, { x: x, y: y, s: s, kind: resolved.kind, parts: null }));
        return;
      }
      g.restore();
      return;
    }

    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate((o.rot * Math.PI) / 180);
    g.scale(s * dir, s);

    if (o.shadow !== false && !o.float && !o.rot) {
      drawAltitudeShadow(g, y, s, o.shadowW || 54);
    }

    if (o.glow) {
      const gr = o.glowR || 120;
      const grd = g.createRadialGradient(0, -(o.h || 80) / 2, 10, 0, -(o.h || 80) / 2, gr);
      grd.addColorStop(0, C.rgba(o.glow, 0.38));
      grd.addColorStop(1, C.rgba(o.glow, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, -(o.h || 80) / 2, gr, 0, Math.PI * 2);
      g.fill();
    }

    if (Array.isArray(o.parts)) {
      const normParts = normalizePartCoordinates(o.parts);
      normParts.forEach((p) => {
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
    C.circle(g, 0, 0, r * 0.48, { fill: p.hubColor || '#CBD5E1', shade: false, lw: 2.5 });
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
    C.circle(g, 0, 0, r * 0.38, { fill: p.holeColor || '#334155', shade: false, lw: 3 });
    g.restore();
  }

  function drawFlamePart(g, p, t) {
    const x = p.x || 0, y = p.y || 0, r = p.r || 28;
    const wob = Math.sin(t * 16 + x) * (r * 0.14);
    C.circle(g, x, y + wob * 0.5, r, { fill: p.color || '#D93829', shade: false, lw: 3 });
    C.circle(g, x + wob * 0.4, y + r * 0.18, r * 0.58, { fill: p.coreColor || '#E3B330', shade: false, stroke: false });
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
      fill: p.color || '#2BA35E',
      stroke: false
    });
    if (p.bubbles) {
      for (let i = 0; i < 3; i++) {
        const bp = ((t * 0.9 + i * 0.33) % 1);
        C.circle(g, x + (i - 1) * (w * 0.25), y - bp * lh, 4, {
          fill: 'rgba(255,255,255,0.55)',
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
   * 4. PARAMETRIC FURNITURE / WORKBENCH / PODIUM / SHELF CREATOR (`PROP.furniture`)
   */
  function furniture(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : SAFE.cx;
    const y = o.y !== undefined ? o.y : SAFE.floorY;
    const w = o.w || 340;
    const h = o.h || 140;
    const s = o.s || 1.0;
    const col = tonePropColor(o.color || '#925B18');
    const topCol = o.topColor || C.shadeColor(col, 12);
    const style = o.style || 'table';

    g.save();
    g.translate(x, y);
    g.scale(s, s);

    if (style === 'podium') {
      const pw = o.w || 160, ph = o.h || 200;
      C.roundRect(g, -pw / 2, -ph, pw, ph, 6, { fill: col, lw: 3.8, shadow: true });
      applyCylinderShade(g, -pw / 2, -ph, pw, ph, 6);
      C.roundRect(g, -pw * 0.62, -ph - 18, pw * 1.24, 24, 6, { fill: topCol, lw: 3.8 });
      if (o.label) {
        const lwBox = Math.max(pw * 0.82, o.label.length * 14 + 24);
        C.roundRect(g, -lwBox / 2, -ph + 34, lwBox, 44, 6, { fill: '#F4F0E6', lw: 2.8 });
        g.font = '900 21px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(o.label, 0, -ph + 56);
      }
    } else if (style === 'shelves') {
      const sw = o.w || 240, sh = o.h || 380, tiers = o.tiers || 4;
      C.roundRect(g, -sw / 2, -sh, sw, sh, 6, { fill: col, lw: 3.8, shadow: true });
      for (let i = 1; i < tiers; i++) {
        const sy = -sh + (i / tiers) * sh;
        C.line(g, -sw / 2, sy, sw / 2, sy, { lw: 5 });
      }
    } else {
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
   * 5. PARAMETRIC CONTAINER / BIN / VESSEL / BATTERY / BOX CREATOR (`PROP.container`)
   */
  function container(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : SAFE.cx;
    const y = o.y !== undefined ? o.y : SAFE.floorY;
    const w = o.w || 140;
    const h = o.h || 180;
    const s = o.s || 1.0;
    const style = String(o.style || 'tank').toLowerCase();
    const level = o.level !== undefined
      ? o.level
      : (o.fromLevel !== undefined ? C.lerp(o.fromLevel, o.toLevel !== undefined ? o.toLevel : 1, C.seg(lt, o.t0 || 0, (o.t0 || 0) + (o.dur || 0.8))) : 0);

    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate((o.rot * Math.PI) / 180);
    g.scale(s, s);

    if (style === 'trash' || style === 'bin' || style === 'garbage') {
      const col = tonePropColor(o.color || '#1F9D55');
      drawPoly(g, [
        [-w * 0.54, -h],
        [w * 0.54, -h],
        [w * 0.44, 0],
        [-w * 0.44, 0]
      ], { fill: col, lw: 4 });
      [-w * 0.24, 0, w * 0.24].forEach((rx) => {
        C.line(g, rx, -h + 22, rx * 0.85, -16, { lw: 3, color: C.shadeColor(col, -22) });
      });
      C.roundRect(g, -w * 0.58, -h - 14, w * 1.16, 18, 6, { fill: C.shadeColor(col, 10), lw: 3.8 });
      g.save();
      g.translate(-w * 0.56, -h - 14);
      g.rotate(o.lidAngle !== undefined ? o.lidAngle : -0.65);
      C.roundRect(g, 0, -14, w * 1.12, 16, 6, { fill: C.shadeColor(col, 15), lw: 3.5 });
      C.roundRect(g, w * 0.42, -26, w * 0.28, 12, 4, { fill: C.shadeColor(col, -15), lw: 3 });
      g.restore();

      if (o.label) {
        const lwBox = Math.max(w * 0.85, o.label.length * 11 + 20);
        C.roundRect(g, -lwBox / 2, -h * 0.55 - 20, lwBox, 40, 6, { fill: '#F4DC7A', lw: 3 });
        g.font = '900 18px "Nunito", sans-serif';
        g.fillStyle = '#18181B';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(o.label, 0, -h * 0.55);
      }
      g.restore();
      return;
    }

    if (style === 'box' || style === 'crate') {
      C.roundRect(g, -w / 2, -h, w, h, 8, { fill: o.color || '#C87A28', hatch: o.hatch, lw: 3.8, shadow: true });
      C.line(g, -w / 2, -h * 0.72, w / 2, -h * 0.72, { lw: 3 });
    } else {
      if (style === 'battery') {
        C.roundRect(g, -w * 0.22, -h - 14, w * 0.44, 16, 4, { fill: '#94A3B8', lw: 3.5 });
      }
      C.roundRect(g, -w / 2, -h, w, h, 12, {
        fill: o.bodyColor || 'rgba(244, 240, 230, 0.78)',
        lw: 3.8,
        shadow: true
      });

      if (level > 0.01) {
        drawLiquidPart(g, {
          x: 0,
          y: -6,
          w: w - 12,
          h: h - 12,
          level: level,
          color: o.fillColor || '#2BA35E',
          bubbles: o.bubbles
        }, lt);
      }
      C.roundRect(g, -w / 2, -h, w, h, 12, { fill: false, lw: 3.8 });
    }

    if (o.label) {
      C.roundRect(g, -w * 0.44, -h / 2 - 20, w * 0.88, 40, 6, { fill: 'rgba(244,240,230,0.92)', lw: 2.5 });
      g.font = '800 ' + (o.labelSize || 20) + 'px "Nunito", sans-serif';
      g.fillStyle = o.labelColor || C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.label, 0, -h / 2);
    }
    g.restore();
  }

  /**
   * 6. PARAMETRIC SHEET / DOCUMENT / SCROLL / SCREEN / SIGN CREATOR (`PROP.sheet`)
   */
  function sheet(g, lt, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : 485;
    const y = o.y !== undefined ? o.y : SAFE.cy;
    const w = o.w || 260;
    const h = o.h || 340;
    const s = o.s || 1.0;
    const style = o.style || 'document';

    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate((o.rot * Math.PI) / 180);
    g.scale(s, s);

    if (style === 'sign') {
      C.roundRect(g, -6, 0, 12, o.poleH || 150, 2, { fill: '#64748B', lw: 3.5 });
    }

    const bg = o.color || (style === 'scroll' ? '#F3DB96' : '#F4F0E6');
    C.roundRect(g, -w / 2, -h / 2, w, h, 8, { fill: bg, lw: 3.8, shadow: true });

    if (style === 'scroll') {
      C.roundRect(g, -w / 2 - 12, -h / 2 - 10, w + 24, 20, 10, { fill: '#C87A28', lw: 3.5 });
      C.roundRect(g, -w / 2 - 12, h / 2 - 10, w + 24, 20, 10, { fill: '#C87A28', lw: 3.5 });
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
      window.CHAR.renderParts(g, normalizePartCoordinates(o.parts), lt);
    }
    g.restore();
  }

  function pathPlaneFuselage(g) {
    g.beginPath();
    g.moveTo(-165, -86);
    g.lineTo(105, -86);
    g.quadraticCurveTo(155, -86, 178, -50);
    g.quadraticCurveTo(165, -22, 110, -22);
    g.lineTo(-140, -22);
    g.quadraticCurveTo(-175, -30, -175, -66);
    g.closePath();
  }

  /**
   * 7. UNIVERSAL PARAMETRIC VEHICLE CREATOR (`PROP.vehicle`)
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
    if (Array.isArray(o.moveY)) {
      const my = o.moveY;
      const curT = my[2] !== undefined ? my[2] : lt;
      const t0 = my.length >= 5 ? my[3] : 0;
      const t1 = my.length >= 5 ? my[4] : (my[3] || 1.8);
      const p = C.prog(curT, t0, t1);
      y = C.lerp(my[0], my[1], p);
    }

    if (Array.isArray(o.parts) && o.parts.length > 0) {
      build(g, o);
      return;
    }

    const kind = String(o.kind || o.type || 'truck').toLowerCase();
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate((o.rot * Math.PI) / 180);
    g.scale(s * dir, s);

    if (o.shadow !== false && !o.rot && kind !== 'satellite') {
      drawAltitudeShadow(g, y, s, 68);
    }

    if (kind === 'rocket' || kind === 'upperstage' || kind === 'booster' || kind === 'boosterstage' || kind === 'twostage' || kind === 'twostagerocket' || kind === 'multistage' || kind === 'starship' || kind === 'fullstack') {
      rocket(g, Object.assign({}, o, {
        variant: kind === 'rocket' ? (o.variant || 'upperStage') : kind,
        t: t,
        lt: lt
      }));
    } else if (kind === 'plane' || kind === 'airliner' || kind === 'jet') {
      const bodyCol = tonePropColor(o.color || '#F4F0E6');
      const accentCol = tonePropColor(o.tailColor || '#2B6CB0');

      drawPoly(g, [[-30, -78], [20, -128], [52, -128], [18, -78]], { fill: '#CBD5E1', lw: 3.5 });
      drawPoly(g, [[-155, -72], [-198, -158], [-152, -158], [-98, -72]], { fill: accentCol, lw: 4 });
      drawPoly(g, [[-172, -66], [-196, -54], [-145, -54]], { fill: '#94A3B8', lw: 3.2 });

      g.save();
      pathPlaneFuselage(g);
      g.fillStyle = bodyCol;
      g.fill();

      g.save();
      g.clip();
      C.hatchRect(g, -180, -90, 360, 75, { color: 'rgba(15, 23, 42, 0.06)', spacing: 14, lw: 2 });
      g.fillStyle = accentCol;
      g.fillRect(-180, -40, 360, 22);
      drawPoly(g, [[118, -76], [158, -62], [154, -50], [118, -52]], { fill: '#38BDF8', lw: 3 });
      for (let i = 0; i < 7; i++) {
        const wx = -92 + i * 28;
        C.roundRect(g, wx - 7, -70, 14, 18, 5, { fill: '#38BDF8', lw: 2.6 });
      }
      applyCylinderShade(g, -180, -90, 360, 70, 0);
      g.restore();

      pathPlaneFuselage(g);
      g.strokeStyle = C.PAL.ink;
      g.lineWidth = 4;
      g.lineJoin = 'round';
      g.stroke();
      g.restore();

      drawPoly(g, [[-25, -48], [45, -48], [-15, 6], [-58, 6]], { fill: '#DCE2E8', lw: 3.8 });
      C.roundRect(g, -2, -26, 48, 24, 10, { fill: accentCol, lw: 3.5 });
      C.circle(g, 44, -14, 9, { fill: '#334155', lw: 2.5 });

    } else if (kind === 'satellite') {
      [-1, 1].forEach((side) => {
        const sx = side === -1 ? -175 : 55;
        C.line(g, side * 38, -60, side * 55, -60, { lw: 5, color: '#475569' });
        C.roundRect(g, sx, -92, 120, 64, 6, { fill: '#2B6CB0', lw: 3.5 });
        C.line(g, sx + 40, -92, sx + 40, -28, { lw: 2, color: '#93C5FD' });
        C.line(g, sx + 80, -92, sx + 80, -28, { lw: 2, color: '#93C5FD' });
        C.line(g, sx, -60, sx + 120, -60, { lw: 2, color: '#93C5FD' });
      });
      C.roundRect(g, -40, -100, 80, 80, 10, { fill: '#E3B330', hatch: true, lw: 4 });
      g.beginPath();
      g.arc(0, -118, 28, 0.15 * Math.PI, 0.85 * Math.PI);
      g.fillStyle = '#DCE2E8';
      g.fill();
      C.inkStyle(g, 3.5);
      g.stroke();
      C.line(g, 0, -112, 0, -138, { lw: 3.5 });
      C.circle(g, 0, -140, 6, { fill: '#D93829', lw: 2.5 });

    } else if (kind === 'truck' || kind === 'van') {
      C.roundRect(g, -160, -145, 220, 115, 10, { fill: o.color || '#F4F0E6', lw: 4, shadow: true });
      C.roundRect(g, 60, -105, 85, 75, 10, { fill: o.cabColor || '#2B6CB0', lw: 4 });
      C.roundRect(g, 82, -95, 52, 34, 4, { fill: '#A9C7DC', lw: 3 });
      [-100, 95].forEach((wx) => drawWheelPart(g, { x: wx, y: -26, r: 26 }, t));
      if (o.label) {
        g.save(); g.scale(dir, 1);
        g.font = '900 28px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink; g.textAlign = 'center';
        g.fillText(o.label, -50 * dir, -82);
        g.restore();
      }
    } else if (kind === 'car') {
      C.roundRect(g, -110, -68, 220, 46, 14, { fill: o.color || '#C83E37', lw: 4, shadow: true });
      C.roundRect(g, -65, -108, 125, 46, 14, { fill: o.color || '#C83E37', lw: 4 });
      C.roundRect(g, -52, -100, 100, 32, 8, { fill: '#A9C7DC', lw: 3 });
      [-65, 65].forEach((wx) => drawWheelPart(g, { x: wx, y: -22, r: 22 }, t));
    } else if (kind === 'ship' || kind === 'cargoship' || kind === 'sailingship') {
      if (kind === 'sailingship' || o.sails) {
        C.line(g, 0, -70, 0, -240, { lw: 7, color: '#6B3410' });
        C.roundRect(g, -75, -220, 150, 120, 24, { fill: o.sailColor || '#F4F0E6', lw: 3.8 });
      } else {
        C.roundRect(g, -160, -120, 90, 50, 4, { fill: '#C83E37', lw: 3.5 });
        C.roundRect(g, -65, -120, 90, 50, 4, { fill: '#2B6CB0', lw: 3.5 });
        C.roundRect(g, 55, -145, 70, 75, 4, { fill: '#F4F0E6', lw: 3.5 });
      }
      drawPoly(g, [[-200, -70], [200, -70], [160, 0], [-175, 0]], {
        fill: o.hullColor || (kind === 'sailingship' ? '#6B3410' : '#1E293B'),
        lw: 4
      });
    } else if (kind === 'tank') {
      C.roundRect(g, -120, -46, 240, 44, 22, { fill: '#334155', lw: 4, shadow: true });
      C.roundRect(g, -95, -86, 190, 44, 10, { fill: o.color || '#4D7C0F', lw: 4 });
      C.roundRect(g, -50, -124, 100, 40, 14, { fill: o.color || '#3F6212', lw: 4 });
      C.roundRect(g, 50, -110, 110, 14, 4, { fill: o.color || '#3F6212', lw: 4 });
    } else if (kind === 'cart' || kind === 'chariot') {
      C.roundRect(g, -90, -85, 160, 55, 6, { fill: o.color || '#824012', lw: 3.8, shadow: true });
      drawWheelPart(g, { x: -10, y: -28, r: 28, color: '#6B3410', hubColor: '#C87A28' }, t);
    }

    g.restore();
  }

  /**
   * 8. UNIVERSAL METAPHOR MECHANICS (9:16 Safe-Zone Calibrated)
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

    C.roundRect(g, -w / 2, -h / 2, w, h, 14, { fill: '#F4F0E6', lw: 4, shadow: true });
    C.roundRect(g, -w / 2, -h / 2, w, 72, 14, { fill: o.headerColor || '#C83E37', lw: 4 });
    g.fillStyle = tonePropColor(o.headerColor || '#C83E37');
    g.fillRect(-w / 2 + 2, -h / 2 + 46, w - 4, 26);
    C.line(g, -w / 2, -h / 2 + 72, w / 2, -h / 2 + 72, { lw: 4 });

    [-w * 0.28, w * 0.28].forEach((rx) => {
      C.roundRect(g, rx - 8, -h / 2 - 16, 16, 32, 6, { fill: '#94A3B8', lw: 3 });
    });

    g.font = '900 36px "Fredoka", sans-serif';
    g.fillStyle = '#F4F0E6';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(headerText, 0, -h / 2 + 38);

    const strBody = String(bodyText);
    const autoDaySize = strBody.length >= 4 ? 64 : (o.daySize || 90);
    g.font = '900 ' + autoDaySize + 'px "Nunito", sans-serif';
    g.fillStyle = C.PAL.ink;
    g.fillText(strBody, 0, 36);

    if (o.circleDate) {
      g.strokeStyle = '#C83E37';
      g.lineWidth = 4.5;
      g.beginPath();
      g.ellipse(0, 36, 78, 56, -0.1, 0, Math.PI * 2);
      g.stroke();
    }

    if (o.flipAt !== undefined && lt > flipAt && lt < flipAt + 0.55) {
      const fp = C.prog(lt, flipAt, flipAt + 0.55);
      g.save();
      g.translate(fp * 140, fp * 90 - Math.sin(fp * Math.PI) * 50);
      g.rotate(fp * 0.55);
      g.globalAlpha = 1 - fp;
      C.roundRect(g, -w / 2, -h / 2 + 72, w, h - 72, 8, { fill: '#F4F0E6', lw: 3 });
      g.font = '900 ' + autoDaySize + 'px "Nunito", sans-serif';
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
    C.roundRect(g, -beamW / 2, -10, beamW, 20, 8, { fill: '#E3B330', lw: 4 });
    C.circle(g, 0, 0, 16, { fill: '#C89B22', lw: 3.8 });
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
        const col = side === -1 ? (o.leftColor || '#2BA35E') : (o.rightColor || '#D93829');
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
    C.circle(g, 0, 0, r, { fill: '#F4F0E6', shade: false, lw: 4.5, shadow: true });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      C.line(g, Math.cos(a) * (r - 16), Math.sin(a) * (r - 16), Math.cos(a) * (r - 8), Math.sin(a) * (r - 8), { lw: 3 });
    }
    const minA = t * speed - Math.PI / 2;
    const hrA = t * (speed / 12) - Math.PI / 2;
    C.line(g, 0, 0, Math.cos(hrA) * (r * 0.48), Math.sin(hrA) * (r * 0.48), { lw: 4.5 });
    C.line(g, 0, 0, Math.cos(minA) * (r * 0.72), Math.sin(minA) * (r * 0.72), { lw: 3.5, color: '#C83E37' });
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
    g.fillStyle = '#F4F0E6';
    g.fill();
    C.inkStyle(g, 4);
    g.stroke();

    g.beginPath();
    g.arc(0, 0, r - 18, Math.PI * 1.68, Math.PI * 1.96);
    g.strokeStyle = '#D93829';
    g.lineWidth = 16;
    g.stroke();

    const ang = Math.PI + val * Math.PI;
    C.line(g, 0, 0, Math.cos(ang) * (r - 24), Math.sin(ang) * (r - 24), { lw: 5 });
    C.circle(g, 0, 0, 12, { fill: '#475569', lw: 3.5 });
    if (o.label) {
      C.roundRect(g, -r * 0.75, 18, r * 1.5, 42, 8, { fill: '#F4F0E6', lw: 3 });
      g.font = '900 24px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.label, 0, 39);
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
    C.roundRect(g, r - 4, -10, 95, 20, 8, { fill: '#6B3410', lw: 3.8, shadow: true });
    g.restore();

    C.circle(g, 0, 0, r, { fill: o.fill || 'rgba(186, 230, 253, 0.24)', shade: false, stroke: '#475569', lw: 10, shadow: true });
    C.circle(g, 0, 0, r + 5, { fill: false, stroke: C.PAL.ink, lw: 3.5 });

    if (o.parts && window.CHAR) {
      window.CHAR.renderParts(g, normalizePartCoordinates(o.parts), o.t || 0);
    }
    if (o.text) {
      g.font = '900 ' + (o.size || 34) + 'px "Nunito", sans-serif';
      g.fillStyle = o.color || '#C83E37';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.text, 0, 0);
    }
    g.restore();
  }

  function draw(g, recipeOrKind, opts) {
    if (typeof recipeOrKind === 'object') {
      build(g, recipeOrKind, opts);
      return;
    }
    const o = opts || {};
    const k = String(recipeOrKind || '').toLowerCase();
    if (k === 'rocket' || k === 'upperstage' || k === 'booster' || k === 'boosterstage' || k === 'twostage' || k === 'twostagerocket' || k === 'multistage') {
      vehicle(g, Object.assign({ kind: k }, o));
    } else if (k === 'tower' || k === 'launchtower' || k === 'trusstower') {
      build(g, { preset: 'launchTower' }, o);
    } else if (k === 'desk' || k === 'table' || k === 'podium' || k === 'shelves') {
      furniture(g, Object.assign({ style: recipeOrKind }, o));
    } else if (k === 'document' || k === 'scroll' || k === 'sign') {
      sheet(g, o.lt || o.t || 0, Object.assign({ style: recipeOrKind }, o));
    } else {
      container(g, o.lt || o.t || 0, Object.assign({ style: recipeOrKind }, o));
    }
  }

  window.PROP = {
    build,
    rocket,
    launchTower,
    tower: launchTower,
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