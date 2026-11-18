/**
 * MODULE 04: UNIVERSAL CHARACTER, CREATURE, HAND & MASCOT CREATOR — 9:16 PAPER BILLIONS EDITION (engine/04_char.js)
 * Authentic "Paper Billions / Oversimplified" Editorial Cartoon Rig tuned for 1080x1920 vertical screens:
 * - Normal-sized hero presence (1.34x base scale multiplier so characters command the 9:16 frame)
 * - Matte skin & outfit fills with razor-clean Even-Odd Crescent Rim Shadows on heads & torsos
 * - Integrated Paper Billions glasses (clean white lenses act as sclera with crisp pupil dots)
 * - Sanitized faceParts/hatParts so rogue wireframe loops never draw over faces + built-in headset support
 * - Sculpted skull-cap hairstyles, natural outward-sweeping stick limbs, and 100% static comic mouth sprites.
 */
(function () {
  const C = window.CORE;

  const SKIN_TONES = ['#F3C9A0', '#EBB88B', '#DFAA7B', '#C98E60', '#A86E44', '#7E4E2E', '#F7D6B5'];
  const HAIR_COLORS = ['#18181B', '#27201C', '#4A3222', '#784B2A', '#D49B3E', '#A84B10', '#94A3B8', '#CBD5E1'];

  /**
   * Helper: Sanitizes custom `faceParts` / `hatParts` arrays from shot scripts so
   * large un-filled wireframe ellipses/arcs/loops never draw across a character's face.
   */
  function sanitizeFaceOrHatParts(parts) {
    if (!Array.isArray(parts)) return { clean: [], hasHeadset: false };
    let hasHeadset = false;
    const clean = [];

    parts.forEach((p) => {
      if (!p) return;
      // Detect DIY wireframe loops/arcs/ellipses that were meant to be headsets or ears
      if (p.type === 'ellipse' && (p.fill === false || p.fill === 'none' || (p.rx || 16) > 18 || (p.ry || 10) > 18)) {
        hasHeadset = true;
        return;
      }
      if (p.type === 'arc' && ((p.r || 15) > 16 || !p.fill)) {
        hasHeadset = true;
        return;
      }
      if (p.type === 'circle' && (p.fill === false || p.fill === 'none') && (p.r || 10) > 14) {
        hasHeadset = true;
        return;
      }
      // Detect tiny blue/dark mic balls that belong to a headset
      if (p.type === 'circle' && (p.r || 10) <= 9 && Math.abs(p.x || 0) >= 12 && (p.y || 0) >= 4) {
        hasHeadset = true;
        return;
      }
      clean.push(p);
    });

    return { clean, hasHeadset };
  }

  /**
   * 1. DECLARATIVE CARTOON SHAPE COMPOSER (`CHAR.renderParts(g, parts, t, opts)`)
   * Renders an array of simple cartoon primitives with bold `#18181B` ink outlines.
   */
  function renderParts(g, parts, t, opts) {
    if (!Array.isArray(parts)) return;
    const clampRadius = opts && opts.maxOffset ? opts.maxOffset : 0;

    parts.forEach((p) => {
      if (!p) return;
      g.save();
      let px = p.x || 0;
      let py = p.y || 0;
      if (clampRadius > 0) {
        px = C.clamp(px, -clampRadius, clampRadius);
        py = C.clamp(py, -clampRadius, clampRadius);
      }
      if (px || py) g.translate(px, py);
      if (p.rot) g.rotate((p.rot * Math.PI) / 180);
      if (p.scale) g.scale(p.scale, p.scale);

      const lw = p.lw !== undefined ? p.lw : 3.0;
      const stroke = p.stroke !== undefined ? p.stroke : C.PAL.ink;

      if (p.type === 'rect') {
        C.roundRect(g, -(p.w || 20) / 2 + (p.ox || 0), -(p.h || 20) / 2 + (p.oy || 0), p.w || 20, p.h || 20, p.r || 4, {
          fill: p.fill !== undefined ? p.fill : C.PAL.paper,
          stroke: stroke,
          lw: lw,
          hatch: p.hatch,
          shadow: p.shadow
        });
      } else if (p.type === 'circle') {
        C.circle(g, 0, 0, p.r || 10, {
          fill: p.fill !== undefined ? p.fill : C.PAL.paper,
          stroke: stroke,
          lw: lw,
          shade: p.shade !== false,
          shadow: p.shadow
        });
      } else if (p.type === 'ellipse') {
        g.beginPath();
        g.ellipse(0, 0, p.rx || 16, p.ry || 10, 0, 0, Math.PI * 2);
        if (p.fill !== false && p.fill !== 'none') {
          g.fillStyle = C.harmonizeColor ? C.harmonizeColor(p.fill || C.PAL.paper) : (p.fill || '#F4F0E6');
          g.fill();
        }
        if (stroke !== false) {
          C.inkStyle(g, lw, stroke);
          g.stroke();
        }
      } else if (p.type === 'poly' && Array.isArray(p.pts) && p.pts.length > 1) {
        g.beginPath();
        g.moveTo(p.pts[0][0], p.pts[0][1]);
        for (let i = 1; i < p.pts.length; i++) g.lineTo(p.pts[i][0], p.pts[i][1]);
        if (p.close !== false) g.closePath();
        if (p.fill !== false && p.fill) {
          g.fillStyle = C.harmonizeColor ? C.harmonizeColor(p.fill) : p.fill;
          g.fill();
        }
        if (stroke !== false) {
          C.inkStyle(g, lw, stroke);
          g.stroke();
        }
      } else if (p.type === 'line') {
        let x1 = p.x1 || 0, y1 = p.y1 || 0, x2 = p.x2 || 0, y2 = p.y2 || 0;
        if (clampRadius > 0) {
          x1 = C.clamp(x1, -clampRadius, clampRadius);
          y1 = C.clamp(y1, -clampRadius, clampRadius);
          x2 = C.clamp(x2, -clampRadius, clampRadius);
          y2 = C.clamp(y2, -clampRadius, clampRadius);
        }
        C.line(g, x1, y1, x2, y2, {
          lw: lw,
          color: p.color || stroke,
          dash: p.dash
        });
      } else if (p.type === 'arc') {
        g.beginPath();
        g.arc(0, 0, p.r || 15, p.a0 || 0, p.a1 !== undefined ? p.a1 : Math.PI);
        if (p.close) g.closePath();
        if (p.fill) {
          g.fillStyle = p.fill;
          g.fill();
        }
        if (stroke !== false) {
          C.inkStyle(g, lw, p.color || stroke);
          g.stroke();
        }
      } else if (p.type === 'text') {
        g.font = (p.weight || '800') + ' ' + (p.size || 18) + 'px ' + (p.font || '"Nunito", sans-serif');
        g.fillStyle = p.color || C.PAL.ink;
        g.textAlign = p.align || 'center';
        g.textBaseline = 'middle';
        g.fillText(String(p.text || ''), 0, 0);
      }
      g.restore();
    });
  }

  /**
   * 2. PROCEDURAL CHARACTER SEED GENERATOR (`CHAR.generate(seed, overrides)`)
   */
  function generate(seed, overrides) {
    const s = typeof seed === 'number' ? seed : 1;
    const r = C.rng(s);
    const hairList = ['parted', 'shortCrop', 'curly', 'bob', 'baldSide', 'swept', 'bun'];
    const colors = ['#3B6E9C', '#2A8C68', '#D68C29', '#5A629E', '#C45B7C', '#475569', '#C83E37', '#237A75'];

    return Object.assign(
      {
        skin: SKIN_TONES[Math.floor(r() * SKIN_TONES.length)],
        hairColor: HAIR_COLORS[Math.floor(r() * HAIR_COLORS.length)],
        hairStyle: hairList[Math.floor(r() * hairList.length)],
        topColor: colors[Math.floor(r() * colors.length)],
        underColor: '#F5F2EA',
        tieColor: '#C83E37',
        collar: 'vneck',
        neckwear: 'none',
        outerwear: 'none',
        glasses: r() > 0.72 ? 'round' : 'none',
        hat: 'none',
        facialHair: 'none',
        seed: s
      },
      overrides || {}
    );
  }

  /**
   * 3. PAPER BILLIONS CHARACTER DRAWER (`CHAR.draw(g, opts)`)
   * 9:16 Defaults: `(x: 500, y: 1320)`.
   * Applies an automatic presence multiplier so characters match the normal/hero scale of Paper Billions videos.
   */
  function draw(g, opts) {
    const o = opts || {};
    const t = o.t !== undefined ? o.t : 0;
    const lt = o.lt !== undefined ? o.lt : t;

    // Universal Hero Scale Multiplier: ensures characters have normal Paper Billions presence (~390-440px tall)
    const rawS = o.s !== undefined ? o.s : 1.25;
    const presenceMult = o._isCrowd ? 1.08 : (C. _isSplit && C._isSplit() ? 1.16 : 1.26);
    const s = C.clamp(rawS * presenceMult, 0.75, 1.85);

    let x = o.x !== undefined ? o.x : C.SAFE.cx;
    let isMoving = false;
    let autoFlip = o.flipX || false;

    if (Array.isArray(o.moveX)) {
      const mx = o.moveX;
      const x0 = mx[0], x1 = mx[1], curT = mx[2] !== undefined ? mx[2] : lt;
      const t0 = mx.length >= 5 ? mx[3] : 0;
      const t1 = mx.length >= 5 ? mx[4] : (mx[3] || 1.5);
      const p = C.prog(curT, t0, t1);
      x = C.lerp(x0, x1, p);
      isMoving = p > 0.001 && p < 0.999 && Math.abs(x1 - x0) > 2;
      if (o.flipX === undefined && Math.abs(x1 - x0) > 2) autoFlip = x1 < x0;
    }
    const y = o.y !== undefined ? o.y : C.FLOOR_Y;

    const pose = o.pose || (isMoving ? 'walk' : 'idle');
    const walkPhase = (isMoving || pose === 'walk' || pose === 'run') ? t * (pose === 'run' ? 14 : 9.5) : 0;
    const bobY = (isMoving || pose === 'walk' || pose === 'run')
      ? Math.abs(Math.sin(walkPhase)) * -5.0
      : Math.sin(t * 2.1 + (o.seed || 0)) * 0.9;

    // Authentic Paper Billions Proportions:
    // Compact stick legs + plump bean torso + large neckless oval head overlapping top of torso
    const legH = o.seated || pose === 'sit' ? 34 : (o.legH !== undefined ? o.legH : 52);
    const torsoW = o.torsoW || 80;
    const torsoH = o.torsoH || 94;
    const headRx = o.headRx || 58;
    const headRy = o.headRy || 53;

    const hipY = -legH + bobY;
    const torsoCenterY = hipY - torsoH * 0.48;
    const shoulderTopY = hipY - torsoH;
    // Neckless overlap: head sits directly over the top of the torso!
    const headY = shoulderTopY - headRy * 0.62;
    const dir = autoFlip ? -1 : 1;

    // Subtle pupil look calculation toward `lookAt` or `pointTo`
    let lookVec = o.look || null;
    const lookTarget = o.lookAt || (Array.isArray(o.pointTo) ? o.pointTo : null);
    if (!lookVec && Array.isArray(lookTarget)) {
      const dx = lookTarget[0] - x;
      const dy = lookTarget[1] - (y + headY * s);
      const dist = Math.hypot(dx, dy) || 1;
      lookVec = [C.clamp((dx / dist) * 1.0, -0.95, 0.95), C.clamp((dy / dist) * 0.85, -0.8, 0.8)];
    }

    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate((o.rot * Math.PI) / 180);
    g.scale(s, s);

    // Soft Paper Billions ground contact shadow
    if (o.shadow !== false && !o.floating) {
      g.fillStyle = 'rgba(15, 20, 30, 0.22)';
      g.beginPath();
      g.ellipse(0, 2, 46, 9.5, 0, 0, Math.PI * 2);
      g.fill();
    }

    // Optional colored aura/rim glow behind character
    if (o.glowColor) {
      const grd = g.createRadialGradient(0, torsoCenterY, 10, 0, torsoCenterY, 145);
      grd.addColorStop(0, C.rgba(o.glowColor, 0.35));
      grd.addColorStop(1, C.rgba(o.glowColor, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, torsoCenterY, 145, 0, Math.PI * 2);
      g.fill();
    }

    // 1. Custom Back Layer
    if (o.backParts) {
      g.save();
      g.translate(0, torsoCenterY);
      renderParts(g, o.backParts, t, { maxOffset: 110 });
      g.restore();
    }
    if (typeof o.drawBack === 'function') {
      g.save();
      g.translate(0, torsoCenterY);
      o.drawBack(g, torsoW, torsoH, t);
      g.restore();
    }

    // 2. Back Hair (sculpted rounded silhouette for bob / shoulder / long hair)
    if (o.hairStyle === 'long' || o.hairStyle === 'shoulder' || o.hairStyle === 'bob' || o.backHairLen) {
      drawBackHair(g, headY, headRx, headRy, o.hairColor || '#18181B', o.hairStyle, o.backHairLen);
    }

    // 3. Compact Paper Billions Stick Legs (ZERO balls on feet)
    if (o.legs !== false) {
      drawLegs(g, hipY - bobY, legH, walkPhase, pose, dir, o);
    }

    // 4. Back Stick Arm (attached on upper torso curve)
    const armAttachY = shoulderTopY + 26;
    drawArm(g, -1, armAttachY, torsoW, pose, walkPhase, t, dir, x, y, s, o);

    // 5. Paper Billions Plump Bean/Egg Torso & Composable Outfit
    drawTorso(g, torsoCenterY, torsoW, torsoH, dir, t, o);

    // 6. Soft Crescent Chin Shadow on Upper Chest (replaces clunky neck box!)
    g.save();
    pathEggTorso(g, torsoCenterY, torsoW, torsoH, o.torsoShape);
    g.clip();
    g.fillStyle = 'rgba(15, 20, 32, 0.22)';
    g.beginPath();
    g.ellipse(0, headY + headRy * 0.44, headRx * 0.72, headRy * 0.68, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // 7. Large Expressive Head, Crescent Shadow, Integrated Glasses/Eyes, Skull-Cap Hair & Hat
    g.save();
    const headTilt = (o.headTilt || 0) + (pose === 'bow' ? 0.28 * dir : (pose === 'shrug' ? -0.05 * dir : 0));
    g.translate(0, headY);
    if (headTilt) g.rotate(headTilt);
    drawHeadAndFace(g, headRx, headRy, dir, t, Object.assign({}, o, { _lookVec: lookVec }));
    g.restore();

    // 8. Front Stick Arm & Held Tool / Prop / Pointer
    drawArm(g, +1, armAttachY, torsoW, pose, walkPhase, t, dir, x, y, s, o);

    // 9. Floating Emotion FX
    drawEmotionFX(g, headY - headRy - 18, t, o);

    g.restore();
  }

  function drawBackHair(g, headY, rx, ry, col, style, customLen) {
    const bh = customLen || (style === 'long' ? 68 : (style === 'shoulder' ? 50 : 38));
    g.save();
    C.inkStyle(g, 3.4, C.PAL.ink, col);
    g.beginPath();
    g.moveTo(-rx - 4, headY - 10);
    g.bezierCurveTo(-rx - 10, headY + bh * 0.4, -rx - 6, headY + bh, -rx * 0.55, headY + bh + 4);
    g.lineTo(rx * 0.55, headY + bh + 4);
    g.bezierCurveTo(rx + 6, headY + bh, rx + 10, headY + bh * 0.4, rx + 4, headY - 10);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  }

  // --- Internal: Compact Paper Billions Stick Legs (NO Foot Balls) ---
  function drawLegs(g, hipY, legH, walkPhase, pose, dir, o) {
    g.save();
    g.strokeStyle = C.PAL.ink;
    g.lineWidth = 4.4;
    g.lineCap = 'round';
    g.lineJoin = 'round';

    const hipSpread = 12;

    [-1, 1].forEach((side) => {
      const hx = side * hipSpread;
      let fx = hx, fy = 0;

      if (walkPhase > 0) {
        const swing = Math.sin(walkPhase + (side === 1 ? 0 : Math.PI));
        fx = hx + swing * 18 * dir;
        fy = Math.min(0, -Math.cos(walkPhase + (side === 1 ? 0 : Math.PI)) * 8);
      } else if (pose === 'sit' || o.seated) {
        fx = hx + 16 * dir;
        fy = hipY + 30;
      } else if (pose === 'kneel' && side === 1) {
        fx = hx - 10 * dir;
        fy = -6;
      }

      g.beginPath();
      g.moveTo(hx, hipY + 5);
      if (pose === 'sit' || o.seated) {
        g.lineTo(hx + 14 * dir, hipY + 12);
        g.lineTo(fx, fy);
      } else {
        g.lineTo(fx, fy);
      }
      g.stroke();
    });
    g.restore();
  }

  // --- Internal: Paper Billions Plump Bean/Egg Torso Path ---
  function pathEggTorso(g, cy, w, h, shape) {
    const top = cy - h / 2;
    const bot = cy + h / 2;
    if (shape === 'robe') {
      C.pathRoundRect(g, -w / 2, top, w, h, 18);
      return;
    }
    const topW = w * 0.37;
    const botW = w * 0.54;
    g.beginPath();
    g.moveTo(0, top);
    g.bezierCurveTo(topW, top, botW + 4, cy - h * 0.08, botW, cy + h * 0.24);
    g.bezierCurveTo(botW - 2, bot - 2, w * 0.30, bot + 2, 0, bot + 2);
    g.bezierCurveTo(-w * 0.30, bot + 2, -botW + 2, bot - 2, -botW, cy + h * 0.24);
    g.bezierCurveTo(-botW - 4, cy - h * 0.08, -topW, top, 0, top);
    g.closePath();
  }

  // --- Internal: Composable Torso & Outfit System (Matte Fill + Even-Odd Crescent Rim Shadow) ---
  function drawTorso(g, cy, w, h, dir, t, o) {
    const shorthandMap = {
      suit:          { collar: 'lapel', neckwear: 'tie' },
      shirtTie:      { collar: 'shirt', neckwear: 'tie' },
      leatherJacket: { collar: 'lapel', outerwear: 'bikerZipper', topColor: '#1E1E24', underColor: '#18181B' },
      bikerJacket:   { collar: 'lapel', outerwear: 'bikerZipper', topColor: '#1E1E24', underColor: '#18181B' },
      labCoat:       { collar: 'lapel', outerwear: 'openCoat', topColor: '#F4F1EA' },
      overalls:      { collar: 'round', outerwear: 'overalls' },
      hiVis:         { collar: 'vneck', outerwear: 'hiVisStripes' },
      hoodie:        { collar: 'hoodStrings', outerwear: 'pocket' },
      jacket:        { collar: 'zipCollar', outerwear: 'zipJacket' },
      sweater:       { collar: 'quarterZip' },
      uniform:       { collar: 'shirt', outerwear: 'badgeButtons' },
      chef:          { collar: 'round', outerwear: 'doubleBreasted', topColor: '#F4F1EA' },
      robe:          { collar: 'vneck', outerwear: 'sash' },
      armor:         { collar: 'round', outerwear: 'armorPlate', topColor: '#64748B' }
    };
    const sh = shorthandMap[o.outfit] || {};
    const rawTopCol = o.topColor || sh.topColor || '#3B6E9C';
    const topCol = C.harmonizeColor ? C.harmonizeColor(rawTopCol) : rawTopCol;
    const rawUnderCol = o.underColor || sh.underColor || '#F4F1EA';
    const underCol = C.harmonizeColor ? C.harmonizeColor(rawUnderCol) : rawUnderCol;
    const tieCol = o.tieColor || '#C83E37';
    const skin = o.skin || '#EBB88B';
    const collar = o.collar || sh.collar || 'vneck';
    const neckwear = o.neckwear || sh.neckwear || 'none';
    const outerwear = o.outerwear || sh.outerwear || 'none';

    const left = -w * 0.56;
    const top = cy - h / 2;

    g.save();
    pathEggTorso(g, cy, w, h, o.torsoShape);

    // Authentic Paper Billions flat matte outfit fill
    g.fillStyle = topCol;
    g.fill();
    g.clip();

    // True Paper Billions Even-Odd Crescent Rim Shadow along back/side & bottom hem of torso
    g.fillStyle = 'rgba(15, 20, 32, 0.15)';
    g.beginPath();
    g.ellipse(0, cy, w * 0.65, h * 0.62, 0, 0, Math.PI * 2);
    g.ellipse(dir * w * 0.12, cy - h * 0.08, w * 0.49, h * 0.49, 0, 0, Math.PI * 2);
    g.fill('evenodd');

    C.inkStyle(g, 2.4, C.PAL.ink);

    // 1. Outerwear Layer
    if (outerwear === 'openCoat') {
      g.fillStyle = underCol;
      g.fillRect(-13, top, 26, h + 4);
      C.line(g, -13, top, -13, top + h + 4, { lw: 2.5 });
      C.line(g, 13, top, 13, top + h + 4, { lw: 2.5 });
      C.roundRect(g, 16, top + 38, 14, 15, 3, { fill: topCol, lw: 2 });
    } else if (outerwear === 'zipJacket') {
      C.line(g, 0, top + 14, 0, top + h + 2, { lw: 2.5, color: C.PAL.ink });
      C.line(g, -22, top + 52, -14, top + 72, { lw: 2.4, color: C.PAL.ink });
      C.line(g, 22, top + 52, 14, top + 72, { lw: 2.4, color: C.PAL.ink });
    } else if (outerwear === 'overalls') {
      g.fillStyle = underCol;
      g.fillRect(left, top, w * 1.12, 30);
      C.line(g, left, top + 30, left + w * 1.12, top + 30, { lw: 2.5 });
      C.roundRect(g, -18, top, 9, 32, 0, { fill: topCol, lw: 2.4 });
      C.roundRect(g, 9, top, 9, 32, 0, { fill: topCol, lw: 2.4 });
      C.roundRect(g, -12, top + 40, 24, 19, 4, { fill: topCol, lw: 2.4 });
    } else if (outerwear === 'hiVisStripes') {
      const sc = o.stripeColor || '#EAB308';
      g.fillStyle = sc;
      g.fillRect(left, top + 50, w * 1.12, 9);
      g.fillRect(left, top + 68, w * 1.12, 9);
      g.fillRect(-18, top, 8, 50);
      g.fillRect(10, top, 8, 50);
      C.line(g, -18, top, -18, top + 50, { lw: 2.0 });
      C.line(g, -10, top, -10, top + 50, { lw: 2.0 });
      C.line(g, 10, top, 10, top + 50, { lw: 2.0 });
      C.line(g, 18, top, 18, top + 50, { lw: 2.0 });
      C.line(g, 0, top + 14, 0, top + h + 2, { lw: 2.4 });
    } else if (outerwear === 'bikerZipper') {
      C.line(g, 3, top + 28, 3, top + h + 2, { lw: 2.2, color: '#94A3B8' });
      C.line(g, -18, top + 44, -10, top + 70, { lw: 2.2, color: '#64748B' });
      C.line(g, 18, top + 44, 10, top + 70, { lw: 2.2, color: '#64748B' });
    } else if (outerwear === 'pocket') {
      g.fillStyle = C.shadeColor(topCol, -9);
      g.beginPath();
      g.moveTo(-23, top + 78);
      g.lineTo(-16, top + 53);
      g.lineTo(16, top + 53);
      g.lineTo(23, top + 78);
      g.closePath();
      g.fill();
      g.stroke();
    } else if (outerwear === 'badgeButtons') {
      C.circle(g, 15 * dir, top + 34, 5.5, { fill: '#E3B330', lw: 2 });
      C.line(g, 0, top + 14, 0, top + h + 2, { lw: 2.4 });
    } else if (outerwear === 'doubleBreasted') {
      C.line(g, -10, top + 18, -10, top + h + 2, { lw: 2.4 });
      for (let by = top + 28; by < top + h - 10; by += 16) {
        C.circle(g, -15, by, 2.5, { fill: C.PAL.ink, stroke: false });
        C.circle(g, 6, by, 2.5, { fill: C.PAL.ink, stroke: false });
      }
    } else if (outerwear === 'sash') {
      C.line(g, -20, top, 18, top + h, { lw: 8, color: o.trimColor || '#E3B330' });
    } else if (outerwear === 'armorPlate') {
      C.roundRect(g, -24, top + 16, 48, 40, 8, { fill: '#94A3B8', lw: 2.5 });
      C.line(g, left, top + 60, left + w * 1.12, top + 60, { lw: 3.2 });
    }

    if (o.belt) {
      C.roundRect(g, left, top + h - 19, w * 1.12, 9, 0, { fill: o.beltColor || '#18181B', lw: 2.2 });
      C.roundRect(g, -6, top + h - 21, 12, 13, 2, { fill: '#E3B330', lw: 2 });
    }

    // 2. Collar & Neckwear Layer
    if (collar === 'lapel') {
      g.fillStyle = underCol;
      g.beginPath();
      g.moveTo(-14, top + 6); g.lineTo(0, top + 44); g.lineTo(14, top + 6);
      g.closePath(); g.fill(); g.stroke();
      C.line(g, -14, top + 8, -22, top + 25, { lw: 2.3 });
      C.line(g, -22, top + 25, 0, top + 44, { lw: 2.3 });
      C.line(g, 14, top + 8, 22, top + 25, { lw: 2.3 });
      C.line(g, 22, top + 25, 0, top + 44, { lw: 2.3 });
    }

    if (neckwear === 'tie') {
      g.fillStyle = tieCol;
      g.beginPath();
      g.moveTo(-4, top + 14); g.lineTo(4, top + 14);
      g.lineTo(6.5, top + 48); g.lineTo(0, top + 57); g.lineTo(-6.5, top + 48);
      g.closePath(); g.fill(); g.stroke();
    } else if (neckwear === 'bowtie') {
      g.fillStyle = tieCol;
      g.beginPath();
      g.moveTo(-11, top + 15); g.lineTo(11, top + 24);
      g.lineTo(11, top + 15); g.lineTo(-11, top + 24);
      g.closePath(); g.fill(); g.stroke();
    } else if (neckwear === 'scarf') {
      C.roundRect(g, -24, top + 6, 48, 15, 6, { fill: tieCol, lw: 2.5 });
      C.roundRect(g, 6, top + 15, 11, 32, 4, { fill: tieCol, lw: 2.5 });
    } else if (neckwear === 'medal') {
      C.line(g, -11, top + 8, 0, top + 34, { lw: 3, color: '#C83E37' });
      C.line(g, 11, top + 8, 0, top + 34, { lw: 3, color: '#C83E37' });
      C.circle(g, 0, top + 38, 6.5, { fill: '#E3B330', lw: 2.2 });
    } else if (neckwear === 'lanyard' || o.lanyard) {
      C.line(g, -10, top + 8, -2, top + 36, { lw: 2.8, color: '#2B6CB0' });
      C.line(g, 10, top + 8, 2, top + 36, { lw: 2.8, color: '#2B6CB0' });
      C.roundRect(g, -10, top + 36, 20, 25, 3, { fill: '#F5F2EA', lw: 2.2 });
      C.roundRect(g, -6, top + 40, 12, 6, 1, { fill: '#2B6CB0', stroke: false });
    } else if (neckwear === 'stethoscope') {
      C.line(g, -14, top + 8, -14, top + 38, { lw: 2.8, color: '#334155' });
      C.line(g, 14, top + 8, 14, top + 38, { lw: 2.8, color: '#334155' });
      C.circle(g, 14, top + 42, 5.5, { fill: '#94A3B8', lw: 2.2 });
    }

    if (collar === 'shirt' || collar === 'zipCollar') {
      g.fillStyle = C.shadeColor(topCol, -10);
      g.beginPath();
      g.moveTo(-14, top + 8); g.lineTo(-17, top + 20); g.lineTo(-3, top + 15);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(14, top + 8); g.lineTo(17, top + 20); g.lineTo(3, top + 15);
      g.closePath(); g.fill(); g.stroke();
    } else if (collar === 'quarterZip') {
      C.line(g, 0, top + 12, 0, top + 32, { lw: 2.4 });
      C.line(g, -11, top + 8, 0, top + 17, { lw: 2.4 });
      C.line(g, 11, top + 8, 0, top + 17, { lw: 2.4 });
    } else if (collar === 'hoodStrings') {
      g.beginPath();
      g.arc(0, top + 8, 15, 0.12 * Math.PI, 0.88 * Math.PI);
      g.stroke();
      C.line(g, -7, top + 16, -7, top + 35, { lw: 2.4, color: '#18181B' });
      C.line(g, 7, top + 16, 7, top + 35, { lw: 2.4, color: '#18181B' });
    }

    // 3. Declarative `outfitParts` or `drawOutfit` callback
    if (o.outfitParts) {
      g.save();
      g.translate(0, cy);
      renderParts(g, o.outfitParts, t, { maxOffset: 65 });
      g.restore();
    }
    if (typeof o.drawOutfit === 'function') {
      g.save();
      g.translate(0, cy);
      o.drawOutfit(g, w, h, t);
      g.restore();
    }

    if (collar !== 'turtleneck') {
      g.fillStyle = C.shadeColor(skin, -6);
      g.beginPath();
      g.moveTo(-8, top + 6); g.lineTo(0, top + 16); g.lineTo(8, top + 6);
      g.closePath(); g.fill(); g.stroke();
    }

    if (o.shadowSide) {
      g.fillStyle = 'rgba(0, 0, 0, 0.42)';
      g.fillRect(o.shadowSide === 'left' ? left : 0, top, w * 0.6, h + 6);
    }

    g.restore();

    pathEggTorso(g, cy, w, h, o.torsoShape);
    C.inkStyle(g, 3.6, C.PAL.ink);
    g.stroke();
  }

  // --- Internal: Head, Crescent Rim Shadow, Integrated Glasses/Eyes, Skull-Cap Hair & Headwear ---
  function drawHeadAndFace(g, rx, ry, dir, t, o) {
    const skin = o.skin || '#EBB88B';
    const hairCol = o.hairColor || '#18181B';
    const hairStyle = o.hairStyle !== undefined ? o.hairStyle : 'parted';

    // Sanitize custom faceParts & hatParts to prevent rogue wireframe loops over faces
    const sanFace = sanitizeFaceOrHatParts(o.faceParts);
    const sanHat = sanitizeFaceOrHatParts(o.hatParts);
    const useHeadset = Boolean(o.headset || sanFace.hasHeadset || sanHat.hasHeadset);

    // 1. Head Base: Authentic Paper Billions Matte Skin + Even-Odd Crescent Rim Shadow
    g.save();
    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = skin;
    g.fill();

    // True Paper Billions Crescent Shadow hugging the side temple & lower jawline
    if (C.drawCrescentShadow) {
      C.drawCrescentShadow(g, 0, 0, rx, ry, {
        dir: dir,
        alpha: 0.14,
        shiftX: dir * rx * 0.22,
        shiftY: -ry * 0.15,
        innerScaleX: 0.95,
        innerScaleY: 0.92
      });
    }

    if (o.shadowSide) {
      g.save();
      g.clip();
      g.fillStyle = 'rgba(0, 0, 0, 0.42)';
      g.fillRect(o.shadowSide === 'left' ? -rx - 5 : 0, -ry - 5, rx + 5, ry * 2 + 10);
      g.restore();
    }

    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    C.inkStyle(g, 3.6, C.PAL.ink);
    g.stroke();
    g.restore();

    const lookVec = o._lookVec || o.look;
    const faceShiftX = (lookVec && lookVec[0] ? lookVec[0] * 4.0 : dir * 3.0);
    const eyeY = -4.5;
    const eyeSpread = o.eyeSpread || 18.5;

    // Subtle cheek blush ONLY when explicitly requested (`blush: true` or `eyes: 'heart'`)
    if (o.blush || o.eyes === 'heart') {
      g.fillStyle = 'rgba(244, 114, 114, 0.30)';
      [-1, 1].forEach((s) => {
        g.beginPath();
        g.ellipse(faceShiftX + s * 28, eyeY + 11, 7.5, 4.2, 0, 0, Math.PI * 2);
        g.fill();
      });
    }

    // 2. Integrated Paper Billions Eyes + Glasses (ZERO double-outline collision!)
    const hasClearGlasses = o.glasses && o.glasses !== 'none' && o.glasses !== 'sunglasses' && o.glasses !== 'shades' && o.glasses !== 'eyepatch';
    if (hasClearGlasses) {
      drawGlassesWithEyes(g, faceShiftX, eyeY, eyeSpread, rx, dir, t, o, lookVec);
    } else {
      drawEyes(g, faceShiftX, eyeY, eyeSpread, dir, t, o, lookVec);
      if (o.glasses && o.glasses !== 'none') {
        drawDarkOrSpecialGlasses(g, faceShiftX, eyeY, eyeSpread, rx, o.glasses);
      }
    }

    // 3. Expressive Brows (positioned cleanly above glasses/eyes)
    const browOffsetY = (o.glasses && o.glasses !== 'none') ? -16.8 : -14.2;
    drawBrows(g, faceShiftX, eyeY + browOffsetY, eyeSpread, o);

    // 4. Facial Hair (clean vertical spacing above mouth)
    const hasMustache = o.facialHair && o.facialHair !== 'none';
    if (hasMustache) {
      drawFacialHair(g, faceShiftX, eyeY + 13.5, rx, ry, hairCol, o.facialHair);
    }

    // 5. 100% Static Paper Billions Comic Mouth Sprite
    const mouthY = hasMustache ? (eyeY + 25.5) : (eyeY + 23.0);
    drawMouth(g, faceShiftX, mouthY, dir, t, o);

    if (sanFace.clean.length > 0) renderParts(g, sanFace.clean, t, { maxOffset: 48 });
    if (typeof o.drawFace === 'function') o.drawFace(g, rx, ry, t);

    // 6. Sweat Drop (placed on outer upper temple so it NEVER collides with eyes or glasses!)
    if (o.sweat || o.eyes === 'panic') {
      const sx = -dir * (rx * 0.78), sy = -ry * 0.34 + Math.sin(t * 6) * 2.0;
      g.save();
      g.fillStyle = '#60A5FA';
      g.strokeStyle = C.PAL.ink;
      g.lineWidth = 2.3;
      g.beginPath();
      g.moveTo(sx, sy - 8);
      g.quadraticCurveTo(sx + 6.5, sy + 2, sx, sy + 7.5);
      g.quadraticCurveTo(sx - 6.5, sy + 2, sx, sy - 8);
      g.closePath();
      g.fill(); g.stroke();
      g.restore();
    }

    // 7. Anger Vein
    if (o.angryVein) {
      const vx = dir * (rx * 0.58), vy = -ry * 0.54;
      g.save();
      g.strokeStyle = '#D93829';
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(vx - 7, vy - 2); g.lineTo(vx - 2, vy - 2); g.lineTo(vx - 2, vy - 7);
      g.moveTo(vx + 7, vy - 2); g.lineTo(vx + 2, vy - 2); g.lineTo(vx + 2, vy - 7);
      g.moveTo(vx - 7, vy + 2); g.lineTo(vx - 2, vy + 2); g.lineTo(vx - 2, vy + 7);
      g.moveTo(vx + 7, vy + 2); g.lineTo(vx + 2, vy + 2); g.lineTo(vx + 2, vy + 7);
      g.stroke();
      g.restore();
    }

    // 8. Sculpted Skull-Cap Hair
    if (hairStyle && hairStyle !== 'none' && hairStyle !== 'bald') {
      drawFrontHair(g, rx, ry, dir, hairCol, hairStyle);
    }
    if (o.hairParts) renderParts(g, o.hairParts, t, { maxOffset: 56 });

    // 9. Clean Built-In Headset (if requested or sanitized from DIY faceParts)
    if (useHeadset) {
      drawHeadset(g, rx, ry, dir, faceShiftX, mouthY);
    }

    // 10. Hat / Headwear
    if (o.hat && o.hat !== 'none') {
      drawHat(g, rx, ry, dir, o.hat, o.hatColor);
    }
    if (sanHat.clean.length > 0) renderParts(g, sanHat.clean, t, { maxOffset: 58 });
    if (typeof o.drawHat === 'function') o.drawHat(g, rx, ry, t);
  }

  // --- Internal: Clean, Non-Intrusive Side-Temple Headset Mic ---
  function drawHeadset(g, rx, ry, dir, faceShiftX, mouthY) {
    const side = -dir; // Tucked neatly on the back/side temple away from the eyes
    const earX = side * (rx - 2);
    const earY = 2;
    g.save();
    C.inkStyle(g, 2.5, C.PAL.ink);
    // Ear cup on temple edge
    C.roundRect(g, earX - 5, earY - 9, 10, 18, 4, { fill: '#334155', lw: 2.4 });
    // Subtle boom curving along lower jaw to corner of mouth
    const micX = faceShiftX + side * 16;
    const micY = mouthY + 2;
    g.beginPath();
    g.moveTo(earX, earY + 7);
    g.quadraticCurveTo(earX, micY + 4, micX, micY);
    g.stroke();
    C.circle(g, micX, micY, 4.2, { fill: '#38BDF8', shade: false, lw: 2.2 });
    g.restore();
  }

  // --- Internal: Authentic Paper Billions Glasses where the Lens IS the Eye Box ---
  function drawGlassesWithEyes(g, cx, cy, spread, headRx, dir, t, o, lookVec) {
    const kind = o.glasses || 'round';
    const mode = o.eyes || o.eyeMode || 'normal';
    const lookX = lookVec ? C.clamp(lookVec[0] * 2.8, -3.0, 3.0) : dir * 1.4;
    const lookY = lookVec ? C.clamp(lookVec[1] * 2.2, -2.4, 2.4) : 0;
    const blinkCycle = (t + (o.seed || 1) * 1.37) % 4.1;
    const isBlinking = mode === 'normal' && blinkCycle > 3.96;

    const lW = 27.5, lH = 18.5, lR = 12.8;

    g.save();
    C.inkStyle(g, 2.4, C.PAL.ink);

    // Clean horizontal temple arms reaching head outline (no droopy lines)
    const leftOuter = cx - spread - (kind === 'rect' ? lW / 2 : lR);
    const rightOuter = cx + spread + (kind === 'rect' ? lW / 2 : lR);
    C.line(g, leftOuter, cy - 1, -headRx * 0.96, cy - 2, { lw: 2.4 });
    C.line(g, rightOuter, cy - 1, headRx * 0.96, cy - 2, { lw: 2.4 });

    [-1, 1].forEach((side) => {
      if (kind === 'monocle' && side === 1) {
        drawSingleEye(g, cx + side * spread, cy, side, mode, isBlinking, lookX, lookY, o);
        return;
      }

      const ex = cx + side * spread, ey = cy;
      g.save();
      if (kind === 'rect') {
        C.pathRoundRect(g, ex - lW / 2, ey - lH / 2, lW, lH, 4.0);
      } else {
        g.beginPath();
        g.arc(ex, ey, lR, 0, Math.PI * 2);
      }
      g.fillStyle = '#FAF8F3';
      g.fill();
      g.clip();

      // Eye expression inside the lens (clean white sclera lens, no cluttering slash!)
      if (mode === 'closed' || isBlinking || (mode === 'wink' && side === 1)) {
        g.beginPath();
        g.arc(ex, ey + 1.5, 5.2, 0.18 * Math.PI, 0.82 * Math.PI);
        g.stroke();
      } else if (mode === 'happy' || mode === 'closedArch') {
        g.beginPath();
        g.arc(ex, ey + 3.0, 5.5, 1.18 * Math.PI, 1.82 * Math.PI);
        g.stroke();
      } else if (mode === 'x' || mode === 'dead') {
        C.line(g, ex - 4.2, ey - 4.2, ex + 4.2, ey + 4.2, { lw: 2.5 });
        C.line(g, ex + 4.2, ey - 4.2, ex - 4.2, ey + 4.2, { lw: 2.5 });
      } else {
        const pr = mode === 'panic' ? 2.1 : (mode === 'wide' ? 2.3 : 2.5);
        g.fillStyle = C.PAL.ink;
        g.beginPath();
        g.arc(ex + lookX, ey + lookY, pr, 0, Math.PI * 2);
        g.fill();

        if (mode === 'half' || mode === 'skeptical' || mode === 'deadpan') {
          g.fillStyle = o.skin || '#EBB88B';
          g.fillRect(ex - 16, ey - 13, 32, 9.5);
          C.line(g, ex - 15, ey - 3.0, ex + 15, ey - 3.0, { lw: 2.4 });
        }
      }
      g.restore();

      // Crisp outer glasses frame
      if (kind === 'rect') {
        C.pathRoundRect(g, ex - lW / 2, ey - lH / 2, lW, lH, 4.0);
      } else {
        g.beginPath();
        g.arc(ex, ey, lR, 0, Math.PI * 2);
      }
      C.inkStyle(g, 2.4, C.PAL.ink);
      g.stroke();
    });

    // Bridge between lenses
    if (kind === 'monocle') {
      C.line(g, cx - spread - lR + 2, cy + 7, cx - spread - lR - 2, cy + 24, { lw: 1.8 });
    } else if (kind === 'rect') {
      C.line(g, cx - spread + lW / 2, cy - 1.5, cx + spread - lW / 2, cy - 1.5, { lw: 2.4 });
    } else {
      C.line(g, cx - spread + lR, cy - 1, cx + spread - lR, cy - 1, { lw: 2.4 });
    }
    g.restore();
  }

  function drawSingleEye(g, ex, ey, side, mode, isBlinking, lookX, lookY, o) {
    if (mode === 'closed' || isBlinking || (mode === 'wink' && side === 1)) {
      g.beginPath();
      g.arc(ex, ey + 1, 5.6, 0.16 * Math.PI, 0.84 * Math.PI);
      g.stroke();
    } else if (mode === 'happy' || mode === 'closedArch') {
      g.beginPath();
      g.arc(ex, ey + 3, 5.8, 1.16 * Math.PI, 1.84 * Math.PI);
      g.stroke();
    } else if (mode === 'x' || mode === 'dead') {
      C.line(g, ex - 4.8, ey - 4.8, ex + 4.8, ey + 4.8, { lw: 2.6 });
      C.line(g, ex + 4.8, ey - 4.8, ex - 4.8, ey + 4.8, { lw: 2.6 });
    } else if (mode === 'heart') {
      g.save();
      g.translate(ex, ey);
      g.fillStyle = '#D93829';
      g.beginPath();
      g.moveTo(0, 4);
      g.bezierCurveTo(-9, -4, -5, -11, 0, -4);
      g.bezierCurveTo(5, -11, 9, -4, 0, 4);
      g.fill(); g.stroke();
      g.restore();
    } else if (mode === 'dot') {
      g.fillStyle = C.PAL.ink;
      g.beginPath();
      g.ellipse(ex + lookX * 0.5, ey + lookY * 0.5, 3.1, 4.1, 0, 0, Math.PI * 2);
      g.fill();
    } else {
      // Authentic Paper Billions vertical oval eye with crisp small pupil dot
      const rx = (mode === 'wide' || mode === 'panic') ? 7.4 : 5.8;
      const ry = (mode === 'wide' || mode === 'panic') ? 9.0 : 7.4;

      g.save();
      g.beginPath();
      g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
      g.fillStyle = '#FAF8F3';
      g.fill();
      g.clip();

      const pr = mode === 'panic' ? 2.1 : 2.5;
      g.fillStyle = C.PAL.ink;
      g.beginPath();
      g.arc(ex + C.clamp(lookX, -2.3, 2.3), ey + C.clamp(lookY, -2.0, 2.0), pr, 0, Math.PI * 2);
      g.fill();

      if (mode === 'half' || mode === 'skeptical' || mode === 'deadpan') {
        g.fillStyle = o.skin || '#EBB88B';
        g.fillRect(ex - rx - 2, ey - ry - 2, rx * 2 + 4, ry * 0.90);
        C.line(g, ex - rx - 1, ey - 0.8, ex + rx + 1, ey - 0.8, { lw: 2.4 });
      }
      g.restore();

      g.beginPath();
      g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }

  function drawEyes(g, cx, cy, spread, dir, t, o, lookVec) {
    const mode = o.eyes || o.eyeMode || 'normal';
    const lookX = lookVec ? C.clamp(lookVec[0] * 2.4, -2.4, 2.4) : dir * 1.4;
    const lookY = lookVec ? C.clamp(lookVec[1] * 2.0, -2.0, 2.0) : 0;
    const blinkCycle = (t + (o.seed || 1) * 1.37) % 4.1;
    const isBlinking = mode === 'normal' && blinkCycle > 3.96;

    C.inkStyle(g, 2.4, C.PAL.ink);
    [-1, 1].forEach((side) => {
      drawSingleEye(g, cx + side * spread, cy, side, mode, isBlinking, lookX, lookY, o);
    });
  }

  function drawDarkOrSpecialGlasses(g, cx, cy, spread, headRx, kind) {
    g.save();
    C.inkStyle(g, 2.5, C.PAL.ink);
    if (kind === 'sunglasses' || kind === 'shades') {
      C.line(g, cx - spread - 13, cy - 2, -headRx * 0.96, cy - 3, { lw: 2.4 });
      C.line(g, cx + spread + 13, cy - 2, headRx * 0.96, cy - 3, { lw: 2.4 });
      [-1, 1].forEach((s) => {
        const lx = cx + s * spread - 13.5, ly = cy - 8.5;
        C.roundRect(g, lx, ly, 27, 17, 4.0, { fill: '#141821', lw: 2.5, grad: false });
        C.line(g, lx + 5, ly + 12, lx + 11, ly + 4, { lw: 1.8, color: 'rgba(255,255,255,0.42)' });
      });
      C.line(g, cx - spread + 13.5, cy - 2, cx + spread - 13.5, cy - 2, { lw: 2.5 });
    } else if (kind === 'eyepatch') {
      C.circle(g, cx + spread, cy, 10, { fill: '#18181B', shade: false, lw: 2.4 });
      C.line(g, -headRx * 0.85, cy - 12, headRx * 0.85, cy + 3, { lw: 2.4 });
    }
    g.restore();
  }

  function drawBrows(g, cx, cy, spread, o) {
    const mode = o.brows || (o.eyes === 'panic' ? 'raised' : 'neutral');
    C.inkStyle(g, 2.6, C.PAL.ink);
    [-1, 1].forEach((s) => {
      const bx = cx + s * spread;
      let by = cy, tilt = 0;
      if (mode === 'raised') by -= 4.0;
      else if (mode === 'angry' || mode === 'furrowed') tilt = -s * 4.0;
      else if (mode === 'sad' || mode === 'worried') tilt = s * 3.6;
      else if (mode === 'skeptical') tilt = s === 1 ? -3.6 : 1.6;

      g.beginPath();
      g.moveTo(bx - 7.5, by - tilt);
      g.quadraticCurveTo(bx, by - 2.0, bx + 7.5, by + tilt);
      g.stroke();
    });
  }

  // --- Internal: 100% STATIC Paper Billions Comic Mouth Sprites (ZERO Flapping!) ---
  function drawMouth(g, cx, cy, dir, t, o) {
    let m = o.mouth || 'smile';
    if (m === 'talk') m = 'openSmile';

    C.inkStyle(g, 2.5, C.PAL.ink);
    g.save();
    g.translate(cx, cy);

    if (m === 'smile') {
      g.beginPath();
      g.arc(0, -3.5, 9.2, 0.20 * Math.PI, 0.80 * Math.PI);
      g.stroke();
    } else if (m === 'frown' || m === 'sad') {
      g.beginPath();
      g.arc(0, 6.5, 9.0, 1.20 * Math.PI, 1.80 * Math.PI);
      g.stroke();
    } else if (m === 'neutral' || m === 'flat') {
      C.line(g, -7.5, 0, 7.5, 0, { lw: 2.5 });
    } else if (m === 'smirk') {
      g.beginPath();
      g.moveTo(-6.5, 1);
      g.quadraticCurveTo(2, 2, 8.5, -3.5);
      g.stroke();
      C.line(g, 7.5, -5.5, 10, -2.0, { lw: 2.1 });
    } else if (m === 'o' || m === 'gasp' || m === 'shock') {
      // Authentic Paper Billions vertical oval 'O' mouth
      g.beginPath();
      g.ellipse(0, 1.0, 4.8, 6.2, 0, 0, Math.PI * 2);
      g.fillStyle = '#2B1115';
      g.fill();
      g.stroke();
    } else if (m === 'openSmile' || m === 'open' || m === 'laugh') {
      // Authentic Paper Billions D-shaped open comic mouth with upper teeth & curved tongue
      const mw = 11.0, mh = 11.5;
      g.beginPath();
      g.moveTo(-mw, -3.5);
      g.quadraticCurveTo(0, -2.5, mw, -3.5);
      g.bezierCurveTo(mw, mh * 0.65, mw * 0.55, mh, 0, mh);
      g.bezierCurveTo(-mw * 0.55, mh, -mw, mh * 0.65, -mw, -3.5);
      g.closePath();

      g.fillStyle = '#2B1115';
      g.fill();

      g.save();
      g.clip();
      // Crisp white upper teeth band
      g.fillStyle = '#FAF8F3';
      g.fillRect(-mw - 2, -4.5, (mw + 2) * 2, 4.8);
      C.line(g, -mw - 2, 0.3, mw + 2, 0.3, { lw: 1.6, color: C.PAL.ink });
      // Subtle curved coral tongue
      g.fillStyle = '#E05A5A';
      g.beginPath();
      g.ellipse(0, mh + 0.5, 7.2, 5.2, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();

      g.stroke();
    } else if (m === 'grit' || m === 'panicTeeth') {
      C.roundRect(g, -13, -5, 26, 11.5, 5, { fill: '#FAF8F3', lw: 2.5, grad: false });
      C.line(g, -12, 0.8, 12, 0.8, { lw: 1.8 });
      C.line(g, -4.5, -4, -4.5, 5.5, { lw: 1.8 });
      C.line(g, 4.5, -4, 4.5, 5.5, { lw: 1.8 });
    } else if (m === 'squiggle' || m === 'confused') {
      g.beginPath();
      g.moveTo(-9, 1);
      g.quadraticCurveTo(-4, -3.5, 0, 1);
      g.quadraticCurveTo(4, 5.5, 9, 1);
      g.stroke();
    } else if (m === 'spitTake') {
      g.beginPath();
      g.ellipse(0, 1.0, 5.0, 6.4, 0, 0, Math.PI * 2);
      g.fillStyle = '#2B1115';
      g.fill();
      g.stroke();
      [-0.25, 0, 0.25].forEach((ang, i) => {
        const dist = 20 + i * 9;
        C.circle(g, Math.cos(ang) * dist * dir, Math.sin(ang) * dist + 2, 3.2, {
          fill: o.spitColor || '#60A5FA',
          shade: false,
          lw: 1.5
        });
      });
    }
    g.restore();
  }

  // --- Internal: Sculpted Paper Billions Hairstyles (With Temple Wraps & Strand Lines) ---
  function drawFrontHair(g, rx, ry, dir, col, style) {
    g.save();
    C.inkStyle(g, 3.4, C.PAL.ink, col);

    if (style === 'baldSide' || style === 'receding') {
      [-1, 1].forEach((s) => {
        g.beginPath();
        g.moveTo(s * (rx * 0.72), -ry * 0.54);
        g.bezierCurveTo(s * (rx + 3.5), -ry * 0.34, s * (rx + 3.5), ry * 0.06, s * (rx * 0.90), ry * 0.14);
        g.bezierCurveTo(s * (rx * 0.78), ry * 0.02, s * (rx * 0.78), -ry * 0.28, s * (rx * 0.72), -ry * 0.54);
        g.closePath();
        g.fill();
        g.stroke();
      });
      g.restore();
      return;
    }

    if (style === 'curly' || style === 'afro') {
      const puffs = [
        [-rx * 0.80, -ry * 0.32, 16],
        [-rx * 0.54, -ry * 0.76, 19],
        [-rx * 0.14, -ry * 0.95, 21],
        [rx * 0.28, -ry * 0.90, 20],
        [rx * 0.66, -ry * 0.64, 18],
        [rx * 0.84, -ry * 0.28, 15]
      ];
      // Outer stroke pass first, then unified interior fill so no overlapping black rings appear inside hair
      puffs.forEach((p) => {
        C.circle(g, p[0], p[1], p[2], { fill: col, shade: false, lw: 3.2 });
      });
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(0, -ry * 0.56, rx * 0.80, ry * 0.44, 0, 0, Math.PI * 2);
      g.fill();
      puffs.forEach((p) => {
        g.beginPath();
        g.arc(p[0], p[1], p[2] - 1.8, 0, Math.PI * 2);
        g.fill();
      });
      g.restore();
      return;
    }

    if (style === 'bun' || style === 'topBun') {
      C.circle(g, -dir * 6, -ry - 11, 16, { fill: col, shade: false, lw: 3.4 });
    }

    // Full Paper Billions skull-cap with sideburns wrapping down to temple level
    g.beginPath();
    g.moveTo(-rx - 1.5, -ry * 0.08);
    g.bezierCurveTo(-rx - 4, -ry * 0.82, -rx * 0.50, -ry - 8, 0, -ry - 7.5);
    g.bezierCurveTo(rx * 0.50, -ry - 8, rx + 4, -ry * 0.82, rx + 1.5, -ry * 0.08);

    if (style === 'parted' || style === 'sidePart') {
      const partX = -rx * 0.34 * dir;
      g.lineTo(rx * 0.90, -ry * 0.16);
      g.quadraticCurveTo(rx * 0.24 * dir, -ry * 0.38, partX, -ry * 0.62);
      g.quadraticCurveTo(partX - 10 * dir, -ry * 0.36, -rx * 0.90, -ry * 0.16);
    } else if (style === 'swept' || style === 'spiky') {
      g.lineTo(rx * 0.92, -ry * 0.18);
      g.quadraticCurveTo(rx * 0.18 * dir, -ry * 0.52, -rx * 0.92, -ry * 0.18);
    } else if (style === 'bob' || style === 'shoulder' || style === 'long') {
      g.lineTo(rx + 1.5, ry * 0.32);
      g.quadraticCurveTo(rx * 0.82, ry * 0.22, rx * 0.82, -ry * 0.38);
      g.quadraticCurveTo(0, -ry * 0.46, -rx * 0.82, -ry * 0.38);
      g.quadraticCurveTo(-rx * 0.82, ry * 0.22, -rx - 1.5, ry * 0.32);
    } else {
      // 'shortCrop' / 'crew' / 'bun' — neat fitted hairline
      g.lineTo(rx * 0.90, -ry * 0.18);
      g.lineTo(rx * 0.84, -ry * 0.38);
      g.quadraticCurveTo(0, -ry * 0.50, -rx * 0.84, -ry * 0.38);
      g.lineTo(-rx * 0.90, -ry * 0.18);
    }

    g.closePath();
    g.fill();
    g.stroke();

    // Subtle interior hair contour lines for sculpted depth
    g.strokeStyle = C.shadeColor(col, -28);
    g.lineWidth = 2.0;
    if (style === 'parted' || style === 'swept' || style === 'spiky') {
      g.beginPath();
      g.moveTo(-rx * 0.30 * dir, -ry * 0.62);
      g.quadraticCurveTo(rx * 0.10 * dir, -ry * 0.78, rx * 0.52 * dir, -ry * 0.50);
      g.moveTo(-rx * 0.10 * dir, -ry * 0.82);
      g.quadraticCurveTo(rx * 0.28 * dir, -ry * 0.90, rx * 0.66 * dir, -ry * 0.62);
      g.stroke();
    }

    g.restore();
  }

  function drawFacialHair(g, cx, cy, rx, ry, col, kind) {
    g.save();
    C.inkStyle(g, 2.4, C.PAL.ink, col);
    if (kind === 'mustache') {
      g.beginPath();
      g.moveTo(cx - 11, cy + 1);
      g.quadraticCurveTo(cx, cy - 5, cx + 11, cy + 1);
      g.quadraticCurveTo(cx, cy - 0.5, cx - 11, cy + 1);
      g.closePath(); g.fill(); g.stroke();
    } else if (kind === 'goatee') {
      C.roundRect(g, cx - 7.5, cy + 10, 15, 12, 6, { fill: col, lw: 2.3 });
    } else if (kind === 'beard') {
      g.beginPath();
      g.arc(0, 2, rx - 0.5, 0.08 * Math.PI, 0.92 * Math.PI);
      g.quadraticCurveTo(cx, cy - 2, -rx + 2, 8);
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }

  function drawHat(g, rx, ry, dir, kind, col) {
    g.save();
    const rawC = col || '#E3B330';
    const c = C.harmonizeColor ? C.harmonizeColor(rawC) : rawC;
    C.inkStyle(g, 3.4, C.PAL.ink, c);

    if (typeof kind === 'object') {
      const hc = kind.color || c;
      if (kind.dome) {
        g.fillStyle = hc;
        g.beginPath();
        g.ellipse(0, -ry * 0.45, rx * (kind.domeW || 0.98), ry * 0.65, 0, Math.PI, Math.PI * 2);
        g.fill(); g.stroke();
      }
      if (kind.cylinder) {
        C.roundRect(g, -30, -ry - (kind.h || 36), 60, (kind.h || 36) + 4, 6, { fill: hc, lw: 3.2 });
      }
      if (kind.brim) {
        const bw = rx * (kind.brimW || 2.1);
        C.roundRect(g, -bw / 2, -ry * 0.48, bw, 9, 4, { fill: kind.brimColor || hc, lw: 3.2 });
      }
      g.restore();
      return;
    }

    if (kind === 'hardhat' || kind === 'helmet') {
      g.beginPath();
      g.ellipse(0, -ry * 0.44, rx * 0.98, ry * 0.66, 0, Math.PI, Math.PI * 2);
      g.fill(); g.stroke();
      C.roundRect(g, -rx * 0.22, -ry - 12, rx * 0.44, 14, 4, { fill: C.shadeColor(c, 10), lw: 2.6 });
      C.roundRect(g, -rx * 1.08, -ry * 0.48, rx * 2.16, 10, 5, { fill: c, lw: 3.2 });
    } else if (kind === 'cap' || kind === 'capBack') {
      const visorDir = kind === 'capBack' ? -dir : dir;
      g.beginPath();
      g.ellipse(0, -ry * 0.44, rx * 0.98, ry * 0.64, 0, Math.PI, Math.PI * 2);
      g.fill(); g.stroke();
      C.roundRect(g, visorDir > 0 ? -8 : -rx * 1.28, -ry * 0.48, rx * 1.28 + 8, 9, 4, { fill: c, lw: 3.2 });
    } else if (kind === 'chefHat') {
      C.roundRect(g, -30, -ry - 14, 60, 22, 4, { fill: '#F5F2EA', lw: 3.2 });
      C.circle(g, -18, -ry - 26, 16, { fill: '#F5F2EA', lw: 3.2 });
      C.circle(g, 18, -ry - 26, 16, { fill: '#F5F2EA', lw: 3.2 });
      C.circle(g, 0, -ry - 32, 19, { fill: '#F5F2EA', lw: 3.2 });
    } else if (kind === 'topHat') {
      C.roundRect(g, -28, -ry - 38, 56, 44, 4, { fill: '#18181B', lw: 3.2 });
      C.roundRect(g, -42, -ry + 2, 84, 9, 4, { fill: '#18181B', lw: 3.2 });
    } else if (kind === 'crown') {
      g.fillStyle = '#E3B330';
      g.beginPath();
      g.moveTo(-26, -ry + 4); g.lineTo(-28, -ry - 22); g.lineTo(-12, -ry - 10);
      g.lineTo(0, -ry - 28); g.lineTo(12, -ry - 10); g.lineTo(28, -ry - 22); g.lineTo(26, -ry + 4);
      g.closePath(); g.fill(); g.stroke();
    } else if (kind === 'securityCap' || kind === 'captainHat') {
      const topC = kind === 'captainHat' ? '#F5F2EA' : (col || '#1E3A5F');
      C.roundRect(g, -36, -ry - 14, 72, 20, 6, { fill: topC, lw: 3.2 });
      C.roundRect(g, -38, -ry + 2, 76, 8, 3, { fill: '#111827', lw: 3.2 });
      C.circle(g, 0, -ry - 4, 5, { fill: '#E3B330', lw: 2 });
    } else if (kind === 'turban') {
      C.roundRect(g, -rx * 1.05, -ry - 14, rx * 2.1, 34, 17, { fill: c, lw: 3.5 });
      C.circle(g, 0, -ry - 6, 7, { fill: '#E3B330', lw: 2.5 });
    } else if (kind === 'spaceHelmet') {
      C.circle(g, 0, -2, rx * 1.24, { fill: 'rgba(186, 230, 253, 0.22)', shade: false, lw: 4 });
    }
    g.restore();
  }

  // --- Internal: Natural Paper Billions Stick Arms & Outward Elbow Kinematics ---
  function drawArm(g, side, shoulderY, torsoW, pose, walkPhase, t, dir, charX, charY, scale, o) {
    const sx = side * (torsoW * 0.42);
    const sy = shoulderY;
    let hx = sx + side * 16;
    let hy = sy + 44;
    let showFingers = false;

    const isFrontArm = (dir >= 0 && side === 1) || (dir < 0 && side === -1);
    const targetCoord = side === -1 ? o.leftHandTo : (o.rightHandTo || (isFrontArm ? o.pointTo : null));

    if (Array.isArray(targetCoord)) {
      hx = (targetCoord[0] - charX) / scale;
      hy = (targetCoord[1] - charY) / scale;
      const dx = hx - sx, dy = hy - sy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxArm = o.pointerStick ? 56 : 78;
      if (dist > maxArm) {
        hx = sx + (dx / dist) * maxArm;
        hy = sy + (dy / dist) * maxArm;
      }
      if (Math.abs(hx) < 38 && hy < sy - 10) {
        hx = side * 46;
      }
      showFingers = !o.pointerStick;
    } else if (pose === 'pockets') {
      hx = side * (torsoW * 0.25);
      hy = sy + 42;
    } else if (pose === 'handsUp' || pose === 'celebrate') {
      hx = sx + side * 38;
      hy = sy - 24 + Math.sin(t * 7 + side) * 3.5;
      showFingers = true;
    } else if (pose === 'shrug') {
      hx = sx + side * 42;
      hy = sy - 6;
      showFingers = true;
    } else if (pose === 'wave' && isFrontArm) {
      hx = sx + side * 44 + Math.sin(t * 9) * 7;
      hy = sy - 18;
      showFingers = true;
    } else if (pose === 'think' && isFrontArm) {
      hx = dir * 14;
      hy = sy - 14;
    } else if ((pose === 'point' || pose === 'explain' || pose === 'present') && isFrontArm) {
      hx = sx + dir * 52;
      hy = sy - 6;
      showFingers = true;
    } else if (walkPhase > 0) {
      hx = sx + Math.sin(walkPhase + (side === 1 ? Math.PI : 0)) * 16;
      hy = sy + 40;
    }

    const ctrlX = (sx + hx) / 2 + side * (pose === 'pockets' ? 15 : 12);
    const ctrlY = (sy + hy) / 2 + 12;

    g.save();
    g.strokeStyle = C.PAL.ink;
    g.lineWidth = 4.4;
    g.lineCap = 'round';
    g.lineJoin = 'round';

    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(ctrlX, ctrlY, hx, hy);
    g.stroke();

    if (showFingers && !o.handParts && typeof o.drawProp !== 'function') {
      const ang = Math.atan2(hy - ctrlY, hx - ctrlX);
      g.lineWidth = 3.2;
      [-0.36, 0.28].forEach((da) => {
        g.beginPath();
        g.moveTo(hx, hy);
        g.lineTo(hx + Math.cos(ang + da) * 8.5, hy + Math.sin(ang + da) * 8.5);
        g.stroke();
      });
    }
    g.restore();

    if (isFrontArm && o.pointerStick && Array.isArray(targetCoord)) {
      const tx = (targetCoord[0] - charX) / scale;
      const ty = (targetCoord[1] - charY) / scale;
      C.line(g, hx, hy, tx, ty, { lw: 3.5, color: C.PAL.ink });
      C.circle(g, tx, ty, 4, { fill: '#D93829', shade: false, lw: 2 });
    }

    if (isFrontArm) {
      if (o.handParts) {
        g.save();
        g.translate(hx, hy);
        renderParts(g, o.handParts, t, { maxOffset: 75 });
        g.restore();
      }
      if (typeof o.drawProp === 'function') {
        g.save();
        g.translate(hx, hy);
        o.drawProp(g, t);
        g.restore();
      }
    }
  }

  function drawEmotionFX(g, topY, t, o) {
    if (o.eyes === 'heart' || o.hearts) {
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.7 + i * 0.33) % 1;
        g.save();
        g.globalAlpha = 1 - p;
        g.translate((i - 1) * 28 + Math.sin(t * 3 + i) * 6, topY - p * 45);
        g.fillStyle = '#D93829';
        g.beginPath();
        g.moveTo(0, 4);
        g.bezierCurveTo(-8, -4, -4, -10, 0, -4);
        g.bezierCurveTo(4, -10, 8, -4, 0, 4);
        g.fill();
        g.restore();
      }
    } else if (o.sleeping || o.zzz) {
      g.font = '800 22px "Nunito", sans-serif';
      g.fillStyle = '#64748B';
      for (let i = 0; i < 2; i++) {
        const p = (t * 0.5 + i * 0.5) % 1;
        g.globalAlpha = 1 - p;
        g.fillText('Z', 24 + p * 18, topY - p * 36);
      }
      g.globalAlpha = 1;
    }
  }

  /**
   * 4. CLOSE-UP SLEEVED CARTOON HAND (`CHAR.hand`)
   * 9:16 Defaults: `x = 500, y = 820, s = 1.25`.
   */
  function hand(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : C.SAFE.cx;
    const y = o.y !== undefined ? o.y : C.SAFE.cy;
    const s = o.s !== undefined ? o.s : 1.25;
    const angle = (o.angle || 0) * (Math.PI / 180);
    const skin = o.skin || '#EBB88B';
    const sleeve = o.sleeveColor || '#CBD5E1';

    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(s, s);

    C.roundRect(g, 36, -24, 340, 48, 8, { fill: sleeve, lw: 3.8, shadow: true });
    C.roundRect(g, 18, -22, 24, 44, 4, { fill: '#F5F2EA', lw: 3.5 });
    C.circle(g, 30, 10, 3, { fill: C.PAL.ink, stroke: false });

    C.roundRect(g, -34, -22, 56, 44, 18, { fill: skin, lw: 3.5 });
    for (let i = 0; i < 4; i++) {
      C.roundRect(g, -48, -19 + i * 10, 24, 9, 4.5, { fill: skin, lw: 3.0 });
    }
    C.roundRect(g, -22, -32, 24, 12, 6, { fill: skin, lw: 3.0 });
    g.restore();
  }

  /**
   * 5. LIVING OBJECT MASCOT CREATOR (`CHAR.mascot`)
   * 9:16 Defaults: `x = 500, y = 1320, s = 1.30`.
   */
  function mascot(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : C.SAFE.cx;
    const y = o.y !== undefined ? o.y : C.FLOOR_Y;
    const w = o.w || 120, h = o.h || 120, s = (o.s !== undefined ? o.s : 1.25) * 1.15, t = o.t || 0;
    const legH = o.legs === false ? 0 : (o.legH || 50);
    const bodyCenterY = -legH - h / 2;

    g.save();
    g.translate(x, y);
    g.scale(s, s);

    if (o.legs !== false) {
      drawLegs(g, -legH, legH, o.walk ? t * 8 : 0, o.pose || 'idle', 1, o);
    }

    if (o.arms !== false) {
      drawArm(g, -1, bodyCenterY, w, o.pose || 'idle', 0, t, 1, x, y, s, { skin: o.handColor || '#EBB88B' });
      drawArm(g, +1, bodyCenterY, w, o.pose || 'idle', 0, t, 1, x, y, s, {
        skin: o.handColor || '#EBB88B',
        pointTo: o.pointTo,
        handParts: o.handParts
      });
    }

    g.save();
    g.translate(0, bodyCenterY);
    if (typeof o.drawBody === 'function') {
      o.drawBody(g, w, h, t);
    } else if (o.parts) {
      renderParts(g, o.parts, t);
    } else {
      C.roundRect(g, -w / 2, -h / 2, w, h, o.rad || 16, {
        fill: o.fill || '#1F9D55',
        stroke: C.PAL.ink,
        lw: 4,
        shadow: true
      });
    }

    if (o.face !== false) {
      const fy = o.faceY || 0;
      drawEyes(g, 0, fy - 8, o.eyeSpread || 18, 1, t, o);
      drawBrows(g, 0, fy - 22, o.eyeSpread || 18, o);
      drawMouth(g, 0, fy + 14, 1, t, o);
    }
    g.restore();

    g.restore();
  }

  /**
   * 6. UNIVERSAL PARAMETRIC ANIMAL / CREATURE / ORGANISM CREATOR (`CHAR.animal`)
   * 9:16 Defaults: `x = 500, y = 1320, s = 1.30`.
   */
  function animal(g, opts) {
    const o = opts || {};
    const t = o.t !== undefined ? o.t : 0;
    let x = o.x !== undefined ? o.x : C.SAFE.cx;
    let isMoving = false;
    let dir = o.flipX ? -1 : 1;

    if (Array.isArray(o.moveX)) {
      const mx = o.moveX;
      const p = C.prog(mx[2] !== undefined ? mx[2] : t, 0, mx[3] || 1.5);
      x = C.lerp(mx[0], mx[1], p);
      isMoving = p > 0.001 && p < 0.999;
      if (o.flipX === undefined && Math.abs(mx[1] - mx[0]) > 2) dir = mx[1] < mx[0] ? -1 : 1;
    }
    const y = o.y !== undefined ? o.y : C.FLOOR_Y;
    const s = (o.s !== undefined ? o.s : 1.25) * 1.15;
    const plan = o.bodyPlan || o.kind || 'quadruped';
    const rawCol = o.color || '#C87A28';
    const col = C.harmonizeColor ? C.harmonizeColor(rawCol) : rawCol;

    g.save();
    g.translate(x, y);
    g.scale(s * dir, s);
    C.inkStyle(g, 3.2, C.PAL.ink);

    if (typeof o.drawBody === 'function') {
      o.drawBody(g, t);
    } else if (o.parts && plan === 'custom') {
      renderParts(g, o.parts, t);
    } else if (plan === 'bird' || plan === 'pigeon') {
      const bw = o.bodyW || 34, bh = o.bodyH || 22;
      C.line(g, -5, -12, -5, 0, { lw: 3 });
      C.line(g, 5, -12, 5, 0, { lw: 3 });
      C.roundRect(g, -bw / 2, -12 - bh, bw, bh, bh / 2, { fill: col, lw: 3 });
      C.circle(g, bw * 0.38, -12 - bh, o.headR || 10, { fill: o.headColor || col, lw: 3 });
      C.circle(g, bw * 0.44, -14 - bh, 2.5, { fill: C.PAL.ink, stroke: false });
      renderParts(g, [{ type: 'poly', pts: [[bw * 0.65, -15 - bh], [bw * 0.95, -12 - bh], [bw * 0.65, -9 - bh]], fill: '#E3B330' }], t);
    } else if (plan === 'fish') {
      const bw = o.bodyW || 62, bh = o.bodyH || 34;
      const cy = -bh / 2;
      renderParts(g, [
        { type: 'poly', pts: [[-bw * 0.42, cy], [-bw * 0.86, cy - bh * 0.55], [-bw * 0.74, cy], [-bw * 0.86, cy + bh * 0.55]], fill: C.shadeColor(col, -12) },
        { type: 'poly', pts: [[-bw * 0.12, cy - bh * 0.42], [0, cy - bh * 0.78], [bw * 0.16, cy - bh * 0.42]], fill: C.shadeColor(col, -10) },
        { type: 'ellipse', x: 0, y: cy, rx: bw / 2, ry: bh / 2, fill: col },
        { type: 'arc', x: bw * 0.08, y: cy + 1, r: bh * 0.28, a0: 0.65 * Math.PI, a1: 1.35 * Math.PI, color: C.PAL.ink, lw: 2.4 },
        { type: 'circle', x: bw * 0.26, y: cy - bh * 0.12, r: 5.5, fill: '#FAF8F3', shade: false, lw: 2.5 },
        { type: 'circle', x: bw * 0.28, y: cy - bh * 0.12, r: 2.5, fill: C.PAL.ink, stroke: false },
        { type: 'line', x1: bw * 0.34, y1: cy + bh * 0.16, x2: bw * 0.46, y2: cy + bh * 0.12, lw: 2.5 }
      ], t);
      return g.restore();
    } else if (plan === 'insect' || plan === 'ant' || plan === 'spider') {
      const swing = Math.sin(t * 15) * 4;
      [-10, 0, 10].forEach((lx, idx) => {
        C.line(g, lx, -10, lx + (idx % 2 ? swing : -swing), 0, { lw: 2.5 });
      });
      C.circle(g, -14, -12, 8, { fill: col, lw: 2.5 });
      C.circle(g, 0, -11, 6, { fill: col, lw: 2.5 });
      C.circle(g, 13, -14, 8, { fill: col, lw: 2.5 });
    } else if (plan === 'microbe' || plan === 'cell') {
      const r = o.r || 36;
      C.circle(g, 0, -r, r, { fill: col, lw: 3.5 });
      C.circle(g, -6, -r - 4, r * 0.35, { fill: C.shadeColor(col, -20), lw: 2.5 });
    } else {
      const bw = o.bodyW || 64;
      const bh = o.bodyH || 28;
      const legH = o.sleeping ? 0 : (o.legH !== undefined ? o.legH : 22);
      const headR = o.headR || 15;
      const neckH = o.neckH || 8;
      const swing = isMoving ? Math.sin(t * 10) * 8 : 0;

      if (legH > 0) {
        [-bw * 0.34, -bw * 0.22, bw * 0.22, bw * 0.34].forEach((lx, idx) => {
          C.line(g, lx, -legH, lx + (idx % 2 ? swing : -swing), 0, { lw: 3.5 });
        });
      }

      if (o.tail !== false) {
        C.line(g, -bw / 2, -legH - bh * 0.7, -bw / 2 - 18, -legH - bh - 10 + Math.sin(t * 5) * 4, { lw: 3.5 });
      }

      C.roundRect(g, -bw / 2, -legH - bh, bw, bh, bh / 2, { fill: col, lw: 3.2 });

      const hx = bw * 0.42, hy = -legH - bh - neckH;
      C.circle(g, hx, hy, headR, { fill: col, lw: 3.2 });

      if (o.ears === 'floppy') {
        C.roundRect(g, hx - 8, hy - 4, 9, 16, 4, { fill: C.shadeColor(col, -18), lw: 2.5 });
      } else if (o.ears === 'horns') {
        C.line(g, hx - 4, hy - headR, hx - 12, hy - headR - 14, { lw: 3.5 });
        C.line(g, hx + 4, hy - headR, hx + 12, hy - headR - 14, { lw: 3.5 });
      } else {
        renderParts(g, [
          { type: 'poly', pts: [[hx - 9, hy - headR + 3], [hx - 5, hy - headR - 9], [hx, hy - headR + 2]], fill: col },
          { type: 'poly', pts: [[hx + 1, hy - headR + 2], [hx + 6, hy - headR - 9], [hx + 10, hy - headR + 3]], fill: col }
        ], t);
      }

      if (o.sleeping) {
        C.line(g, hx + 2, hy - 2, hx + 8, hy - 2, { lw: 2.2 });
      } else {
        C.circle(g, hx + 5, hy - 2, 2.5, { fill: C.PAL.ink, stroke: false });
      }
    }

    if (o.parts && plan !== 'custom') {
      renderParts(g, o.parts, t, { maxOffset: 80 });
    }
    g.restore();
  }

  /**
   * 7. CROWD / QUEUE / ARMY GENERATOR (`CHAR.crowd`)
   * 9:16 Safe-Zone Defaults: `count = 5, rows = 2, x0 = 140, x1 = 820, y = 1320, s = 0.98`.
   */
  function crowd(g, opts) {
    const o = opts || {};
    const count = o.count || 5;
    const x0 = o.x0 !== undefined ? o.x0 : 140;
    const x1 = o.x1 !== undefined ? Math.min(840, o.x1) : 820;
    const y = o.y !== undefined ? o.y : C.FLOOR_Y;
    const rows = o.rows || 2;
    const s = o.s || 0.98;
    const seed = o.seed || 42;
    const t = o.t || 0;

    for (let r = 0; r < rows; r++) {
      const rowY = y - (rows - 1 - r) * (o.rowStepY || 86);
      const rowScale = s * (1 - (rows - 1 - r) * 0.06);
      for (let i = 0; i < count; i++) {
        const u = count > 1 ? i / (count - 1) : 0.5;
        const cx = C.lerp(x0, x1, u) + ((r % 2) * 24 - 12);
        const memberCfg = generate(seed + r * 97 + i * 13, o.template || {});
        draw(g, Object.assign(memberCfg, {
          x: cx,
          y: rowY,
          s: rowScale,
          _isCrowd: true,
          flipX: o.flipX,
          pose: o.pose || 'idle',
          t: t
        }));
      }
    }
  }

  window.CHAR = {
    SKIN_TONES,
    HAIR_COLORS,
    renderParts,
    generate,
    draw,
    hand,
    mascot,
    animal,
    crowd
  };
})();