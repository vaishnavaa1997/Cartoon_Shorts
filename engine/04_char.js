/**
 * MODULE 04: UNIVERSAL CHARACTER, CREATURE, HAND & MASCOT CREATOR — 9:16 EDITION (engine/04_char.js)
 * 100% Topic-Agnostic & Composable Editorial Cartoon Rig tuned for 1080x1920 vertical screens.
 * Defaults to raised floor (y=1320), optical safe center (x=500), and phone-readable scale (s=1.25).
 */
(function () {
  const C = window.CORE;

  const SKIN_TONES = ['#F5CBA7', '#F0B88B', '#E5A373', '#D48B5C', '#B97246', '#8D5534', '#F9DCC4'];
  const HAIR_COLORS = ['#18181B', '#27201C', '#4A3222', '#784B2A', '#D9A043', '#B45309', '#9CA3AF', '#CBD5E1'];

  /**
   * 1. DECLARATIVE CARTOON SHAPE COMPOSER (`CHAR.renderParts(g, parts, t)`)
   * Renders an array of simple cartoon primitives with bold `#18181B` ink outlines.
   *
   * Supported part types:
   *   { type: 'rect', x, y, w, h, r, fill, hatch, rot, lw }
   *   { type: 'circle', x, y, r, fill, shade, lw }
   *   { type: 'ellipse', x, y, rx, ry, rot, fill, lw }
   *   { type: 'poly', pts: [[x1,y1],[x2,y2],...], fill, close, lw }
   *   { type: 'line', x1, y1, x2, y2, color, lw, dash }
   *   { type: 'arc', x, y, r, a0, a1, fill, color, lw }
   *   { type: 'text', x, y, text, size, color, font, align }
   */
  function renderParts(g, parts, t) {
    if (!Array.isArray(parts)) return;
    parts.forEach((p) => {
      if (!p) return;
      g.save();
      if (p.x || p.y) g.translate(p.x || 0, p.y || 0);
      if (p.rot) g.rotate((p.rot * Math.PI) / 180);
      if (p.scale) g.scale(p.scale, p.scale);

      const lw = p.lw !== undefined ? p.lw : 3.2;
      const stroke = p.stroke !== undefined ? p.stroke : C.PAL.ink;

      if (p.type === 'rect') {
        C.roundRect(g, -(p.w || 20) / 2 + (p.ox || 0), -(p.h || 20) / 2 + (p.oy || 0), p.w || 20, p.h || 20, p.r || 4, {
          fill: p.fill !== undefined ? p.fill : '#FFFFFF',
          stroke: stroke,
          lw: lw,
          hatch: p.hatch,
          shadow: p.shadow
        });
      } else if (p.type === 'circle') {
        C.circle(g, 0, 0, p.r || 10, {
          fill: p.fill !== undefined ? p.fill : '#FFFFFF',
          stroke: stroke,
          lw: lw,
          shade: p.shade !== false,
          shadow: p.shadow
        });
      } else if (p.type === 'ellipse') {
        g.beginPath();
        g.ellipse(0, 0, p.rx || 16, p.ry || 10, 0, 0, Math.PI * 2);
        if (p.fill !== false) {
          g.fillStyle = p.fill || '#FFFFFF';
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
          g.fillStyle = p.fill;
          g.fill();
        }
        if (stroke !== false) {
          C.inkStyle(g, lw, stroke);
          g.stroke();
        }
      } else if (p.type === 'line') {
        C.line(g, p.x1 || 0, p.y1 || 0, p.x2 || 0, p.y2 || 0, {
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
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#475569', '#DC2626', '#0D9488'];

    return Object.assign(
      {
        skin: SKIN_TONES[Math.floor(r() * SKIN_TONES.length)],
        hairColor: HAIR_COLORS[Math.floor(r() * HAIR_COLORS.length)],
        hairStyle: hairList[Math.floor(r() * hairList.length)],
        topColor: colors[Math.floor(r() * colors.length)],
        underColor: '#FFFFFF',
        tieColor: '#DC2626',
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
   * 3. UNIVERSAL CAPSULE & STICK CHARACTER DRAWER (`CHAR.draw(g, opts)`)
   * 9:16 Defaults: `(x: 500, y: 1320, s: 1.25)`.
   * Supports `moveX: [startX, endX, lt, dur]` for automatic locomotion.
   */
  function draw(g, opts) {
    const o = opts || {};
    const t = o.t !== undefined ? o.t : 0;
    const lt = o.lt !== undefined ? o.lt : t;
    const s = o.s !== undefined ? o.s : 1.25;

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
      ? Math.abs(Math.sin(walkPhase)) * -7
      : Math.sin(t * 2.6 + (o.seed || 0)) * 1.5;

    const legH = o.seated || pose === 'sit' ? 36 : (o.legH !== undefined ? o.legH : 66);
    const torsoW = o.torsoW || 68;
    const torsoH = o.torsoH || 94;
    const headRx = o.headRx || 50;
    const headRy = o.headRy || 46;

    const hipY = -legH + bobY;
    const torsoCenterY = hipY - torsoH * 0.46;
    const neckY = hipY - torsoH + 6;
    const headY = neckY - headRy * 0.85;
    const dir = autoFlip ? -1 : 1;

    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate((o.rot * Math.PI) / 180);
    g.scale(s, s);

    // Ground shadow
    if (o.shadow !== false && !o.floating) {
      g.fillStyle = 'rgba(0, 0, 0, 0.22)';
      g.beginPath();
      g.ellipse(0, 2, 38, 9, 0, 0, Math.PI * 2);
      g.fill();
    }

    // Optional colored aura/rim glow behind character
    if (o.glowColor) {
      const grd = g.createRadialGradient(0, torsoCenterY, 10, 0, torsoCenterY, 145);
      grd.addColorStop(0, C.rgba(o.glowColor, 0.42));
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
      renderParts(g, o.backParts, t);
      g.restore();
    }
    if (typeof o.drawBack === 'function') {
      g.save();
      g.translate(0, torsoCenterY);
      o.drawBack(g, torsoW, torsoH, t);
      g.restore();
    }

    // 2. Back Hair
    if (o.hairStyle === 'long' || o.hairStyle === 'shoulder' || o.backHairLen) {
      const bh = o.backHairLen || (o.hairStyle === 'long' ? 68 : 44);
      C.roundRect(g, -headRx - 3, headY - 10, (headRx + 3) * 2, bh, 18, {
        fill: o.hairColor || '#18181B',
        stroke: C.PAL.ink,
        lw: 3.5
      });
    }

    // 3. Stick Legs & Feet
    if (o.legs !== false) {
      drawLegs(g, hipY - bobY, legH, walkPhase, pose, dir, o);
    }

    // 4. Back Arm
    drawArm(g, -1, neckY + 18, torsoW, pose, walkPhase, t, dir, x, y, s, o);

    // 5. Capsule Torso & Composable Outfit
    drawTorso(g, torsoCenterY, torsoW, torsoH, dir, t, o);

    // 6. Round Head, Face, Hair & Hat
    g.save();
    const headTilt = (o.headTilt || 0) + (pose === 'bow' ? 0.35 * dir : 0);
    g.translate(0, headY);
    if (headTilt) g.rotate(headTilt);
    drawHeadAndFace(g, headRx, headRy, dir, t, o);
    g.restore();

    // 7. Front Arm & Held Tool / Prop / Pointer
    drawArm(g, +1, neckY + 18, torsoW, pose, walkPhase, t, dir, x, y, s, o);

    // 8. Floating Emotion FX
    drawEmotionFX(g, headY - headRy - 18, t, o);

    g.restore();
  }

  // --- Internal: Stick Legs ---
  function drawLegs(g, hipY, legH, walkPhase, pose, dir, o) {
    C.inkStyle(g, 4.2, C.PAL.ink, o.shoeColor || C.PAL.ink);
    const hipSpread = 13;

    [-1, 1].forEach((side) => {
      const hx = side * hipSpread;
      let fx = hx, fy = 0;

      if (walkPhase > 0) {
        const swing = Math.sin(walkPhase + (side === 1 ? 0 : Math.PI));
        fx = hx + swing * 22 * dir;
        fy = Math.min(0, -Math.cos(walkPhase + (side === 1 ? 0 : Math.PI)) * 10);
      } else if (pose === 'sit' || o.seated) {
        fx = hx + 18 * dir;
        fy = hipY + 34;
      } else if (pose === 'kneel' && side === 1) {
        fx = hx - 12 * dir;
        fy = -8;
      }

      g.beginPath();
      g.moveTo(hx, hipY + 6);
      if (pose === 'sit' || o.seated) {
        g.lineTo(hx + 16 * dir, hipY + 14);
        g.lineTo(fx, fy);
      } else {
        g.lineTo(fx, fy);
      }
      g.stroke();

      g.beginPath();
      g.ellipse(fx + 5 * dir, fy, 10, 4.8, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    });
  }

  // --- Internal: Composable Torso & Outfit System ---
  function drawTorso(g, cy, w, h, dir, t, o) {
    const shorthandMap = {
      suit:          { collar: 'lapel', neckwear: 'tie' },
      shirtTie:      { collar: 'shirt', neckwear: 'tie' },
      leatherJacket: { collar: 'lapel', outerwear: 'bikerZipper', topColor: '#18181B' },
      bikerJacket:   { collar: 'lapel', outerwear: 'bikerZipper', topColor: '#18181B' },
      labCoat:       { collar: 'lapel', outerwear: 'openCoat', topColor: '#FFFFFF' },
      overalls:      { collar: 'round', outerwear: 'overalls' },
      hiVis:         { collar: 'vneck', outerwear: 'hiVisStripes' },
      hoodie:        { collar: 'hoodStrings', outerwear: 'pocket' },
      sweater:       { collar: 'quarterZip' },
      uniform:       { collar: 'shirt', outerwear: 'badgeButtons' },
      chef:          { collar: 'round', outerwear: 'doubleBreasted', topColor: '#FFFFFF' },
      robe:          { collar: 'vneck', outerwear: 'sash' },
      armor:         { collar: 'round', outerwear: 'armorPlate', topColor: '#64748B' }
    };
    const sh = shorthandMap[o.outfit] || {};
    const topCol = o.topColor || sh.topColor || '#3B82F6';
    const underCol = o.underColor || '#FFFFFF';
    const tieCol = o.tieColor || '#DC2626';
    const skin = o.skin || '#F0B88B';
    const collar = o.collar || sh.collar || 'vneck';
    const neckwear = o.neckwear || sh.neckwear || 'none';
    const outerwear = o.outerwear || sh.outerwear || 'none';

    const left = -w / 2;
    const top = cy - h / 2;
    const rad = o.torsoShape === 'robe' ? 16 : w * 0.46;

    g.save();
    C.pathRoundRect(g, left, top, w, h, rad);
    g.fillStyle = topCol;
    g.fill();
    g.clip();

    g.fillStyle = 'rgba(0, 0, 0, 0.14)';
    g.fillRect(dir >= 0 ? left : left + w * 0.76, top, w * 0.24, h);

    C.inkStyle(g, 2.8, C.PAL.ink);

    // 1. Outerwear Layer
    if (outerwear === 'openCoat') {
      g.fillStyle = underCol;
      g.fillRect(-13, top, 26, h);
      C.line(g, -13, top, -13, top + h, { lw: 2.8 });
      C.line(g, 13, top, 13, top + h, { lw: 2.8 });
      C.roundRect(g, 16, top + 34, 14, 16, 3, { fill: topCol, lw: 2 });
    } else if (outerwear === 'overalls') {
      g.fillStyle = underCol;
      g.fillRect(left, top, w, 30);
      C.line(g, left, top + 30, left + w, top + 30, { lw: 2.8 });
      C.roundRect(g, -18, top, 9, 32, 0, { fill: topCol, lw: 2.5 });
      C.roundRect(g, 9, top, 9, 32, 0, { fill: topCol, lw: 2.5 });
      C.roundRect(g, -12, top + 40, 24, 20, 4, { fill: topCol, lw: 2.5 });
    } else if (outerwear === 'hiVisStripes') {
      g.fillStyle = o.stripeColor || '#FDE047';
      g.fillRect(left, top + 52, w, 9);
      g.fillRect(left, top + 70, w, 9);
      g.fillRect(-18, top, 8, 52);
      g.fillRect(10, top, 8, 52);
      C.line(g, 0, top + 12, 0, top + h, { lw: 2.8 });
    } else if (outerwear === 'bikerZipper') {
      C.line(g, 0, top + 26, 0, top + h, { lw: 2.8, color: '#CBD5E1' });
      C.line(g, -18, top + 34, -6, top + 68, { lw: 2.8, color: '#CBD5E1' });
      C.line(g, 18, top + 34, 8, top + 68, { lw: 2.8, color: '#CBD5E1' });
    } else if (outerwear === 'pocket') {
      C.roundRect(g, -20, top + 54, 40, 24, 6, { fill: C.shadeColor(topCol, -8), lw: 2.5 });
    } else if (outerwear === 'badgeButtons') {
      C.circle(g, 16 * dir, top + 30, 6, { fill: '#FACC15', lw: 2 });
      C.line(g, 0, top + 12, 0, top + h, { lw: 2.5 });
    } else if (outerwear === 'doubleBreasted') {
      C.line(g, -10, top + 16, -10, top + h, { lw: 2.5 });
      for (let by = top + 26; by < top + h - 10; by += 18) {
        C.circle(g, -16, by, 2.5, { fill: C.PAL.ink, stroke: false });
        C.circle(g, 6, by, 2.5, { fill: C.PAL.ink, stroke: false });
      }
    } else if (outerwear === 'sash') {
      C.line(g, -20, top, 18, top + h, { lw: 8, color: o.trimColor || '#FACC15' });
    } else if (outerwear === 'armorPlate') {
      C.roundRect(g, -24, top + 14, 48, 42, 8, { fill: '#94A3B8', lw: 2.8 });
      C.line(g, left, top + 62, left + w, top + 62, { lw: 4 });
    }

    if (o.belt) {
      C.roundRect(g, left, top + h - 22, w, 10, 0, { fill: o.beltColor || '#18181B', lw: 2.5 });
      C.roundRect(g, -7, top + h - 24, 14, 14, 2, { fill: '#FACC15', lw: 2 });
    }

    // 2. Collar & Neckwear Layer
    if (collar === 'lapel' && neckwear === 'tie') {
      g.fillStyle = underCol;
      g.beginPath();
      g.moveTo(-16, top); g.lineTo(0, top + 46); g.lineTo(16, top);
      g.closePath(); g.fill(); g.stroke();
    }

    if (neckwear === 'tie') {
      g.fillStyle = tieCol;
      g.beginPath();
      g.moveTo(-4, top + 10); g.lineTo(4, top + 10);
      g.lineTo(7, top + 50); g.lineTo(0, top + 60); g.lineTo(-7, top + 50);
      g.closePath(); g.fill(); g.stroke();
    } else if (neckwear === 'bowtie') {
      g.fillStyle = tieCol;
      g.beginPath();
      g.moveTo(-12, top + 10); g.lineTo(12, top + 20);
      g.lineTo(12, top + 10); g.lineTo(-12, top + 20);
      g.closePath(); g.fill(); g.stroke();
    } else if (neckwear === 'scarf') {
      C.roundRect(g, -24, top, 48, 16, 6, { fill: tieCol, lw: 2.8 });
      C.roundRect(g, 6, top + 10, 12, 34, 4, { fill: tieCol, lw: 2.8 });
    } else if (neckwear === 'medal') {
      C.line(g, -12, top, 0, top + 32, { lw: 3, color: '#DC2626' });
      C.line(g, 12, top, 0, top + 32, { lw: 3, color: '#DC2626' });
      C.circle(g, 0, top + 36, 7, { fill: '#FACC15', lw: 2.5 });
    } else if (neckwear === 'stethoscope') {
      C.line(g, -14, top, -14, top + 36, { lw: 3, color: '#334155' });
      C.line(g, 14, top, 14, top + 36, { lw: 3, color: '#334155' });
      C.circle(g, 14, top + 40, 6, { fill: '#94A3B8', lw: 2.5 });
    }

    if (collar === 'shirt') {
      g.beginPath();
      g.moveTo(-16, top); g.lineTo(-6, top + 16); g.lineTo(0, top + 10);
      g.lineTo(6, top + 16); g.lineTo(16, top);
      g.stroke();
    } else if (collar === 'quarterZip') {
      C.line(g, 0, top + 8, 0, top + 30, { lw: 2.8 });
      C.line(g, -12, top + 4, 0, top + 14, { lw: 2.8 });
      C.line(g, 12, top + 4, 0, top + 14, { lw: 2.8 });
    } else if (collar === 'hoodStrings') {
      C.line(g, -7, top + 12, -7, top + 34, { lw: 2.5, color: '#F8FAFC' });
      C.line(g, 7, top + 12, 7, top + 34, { lw: 2.5, color: '#F8FAFC' });
    }

    // 3. Declarative `outfitParts` or `drawOutfit` callback
    if (o.outfitParts) {
      g.save();
      g.translate(0, cy);
      renderParts(g, o.outfitParts, t);
      g.restore();
    }
    if (typeof o.drawOutfit === 'function') {
      g.save();
      g.translate(0, cy);
      o.drawOutfit(g, w, h, t);
      g.restore();
    }

    if (collar !== 'turtleneck') {
      g.fillStyle = skin;
      g.beginPath();
      g.moveTo(-8, top); g.lineTo(0, top + 11); g.lineTo(8, top);
      g.closePath(); g.fill(); g.stroke();
    }

    if (o.shadowSide) {
      g.fillStyle = 'rgba(0, 0, 0, 0.48)';
      g.fillRect(o.shadowSide === 'left' ? left : 0, top, w / 2, h);
    }

    g.restore();

    C.pathRoundRect(g, left, top, w, h, rad);
    C.inkStyle(g, 3.8, C.PAL.ink);
    g.stroke();
  }

  // --- Internal: Head, Face, Hair & Headwear ---
  function drawHeadAndFace(g, rx, ry, dir, t, o) {
    const skin = o.skin || '#F0B88B';
    const hairCol = o.hairColor || '#18181B';
    const hairStyle = o.hairStyle !== undefined ? o.hairStyle : 'parted';

    g.save();
    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    const grd = g.createRadialGradient(-rx * 0.25 * dir, -ry * 0.25, rx * 0.1, 0, 0, rx * 1.05);
    grd.addColorStop(0, C.shadeColor(skin, 8));
    grd.addColorStop(0.78, skin);
    grd.addColorStop(1, C.shadeColor(skin, -12));
    g.fillStyle = grd;
    g.fill();

    if (o.shadowSide) {
      g.save();
      g.clip();
      g.fillStyle = 'rgba(0, 0, 0, 0.48)';
      g.fillRect(o.shadowSide === 'left' ? -rx - 5 : 0, -ry - 5, rx + 5, ry * 2 + 10);
      g.restore();
    }

    C.inkStyle(g, 3.8, C.PAL.ink);
    g.stroke();
    g.restore();

    const faceShiftX = (o.look && o.look[0] ? o.look[0] * 6 : dir * 4);
    const eyeY = -3;
    const eyeSpread = o.eyeSpread || 16;

    if (o.blush || o.eyes === 'heart' || o.eyes === 'happy') {
      g.strokeStyle = '#F87171';
      g.lineWidth = 2.5;
      [-1, 1].forEach((s) => {
        const bx = faceShiftX + s * 26, by = eyeY + 12;
        g.beginPath();
        g.moveTo(bx - 4, by + 3); g.lineTo(bx, by - 3);
        g.moveTo(bx + 2, by + 3); g.lineTo(bx + 6, by - 3);
        g.stroke();
      });
    }

    drawEyes(g, faceShiftX, eyeY, eyeSpread, dir, t, o);

    if (o.glasses && o.glasses !== 'none') {
      drawGlasses(g, faceShiftX, eyeY, eyeSpread, o.glasses);
    }

    drawBrows(g, faceShiftX, eyeY - 14, eyeSpread, o);

    if (o.facialHair && o.facialHair !== 'none') {
      drawFacialHair(g, faceShiftX, eyeY + 18, rx, ry, hairCol, o.facialHair);
    }

    drawMouth(g, faceShiftX, eyeY + 21, dir, t, o);

    if (o.faceParts) renderParts(g, o.faceParts, t);
    if (typeof o.drawFace === 'function') o.drawFace(g, rx, ry, t);

    // Sweat drop
    if (o.sweat || o.eyes === 'panic') {
      const sx = -dir * (rx * 0.68), sy = -10 + Math.sin(t * 6) * 3;
      g.save();
      g.fillStyle = '#60A5FA';
      g.strokeStyle = C.PAL.ink;
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(sx, sy - 9);
      g.quadraticCurveTo(sx + 7, sy + 2, sx, sy + 8);
      g.quadraticCurveTo(sx - 7, sy + 2, sx, sy - 9);
      g.closePath();
      g.fill(); g.stroke();
      g.restore();
    }

    // Anger vein
    if (o.angryVein) {
      const vx = dir * (rx * 0.55), vy = -ry * 0.52;
      g.save();
      g.strokeStyle = '#EF4444';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(vx - 7, vy - 2); g.lineTo(vx - 2, vy - 2); g.lineTo(vx - 2, vy - 7);
      g.moveTo(vx + 7, vy - 2); g.lineTo(vx + 2, vy - 2); g.lineTo(vx + 2, vy - 7);
      g.moveTo(vx - 7, vy + 2); g.lineTo(vx - 2, vy + 2); g.lineTo(vx - 2, vy + 7);
      g.moveTo(vx + 7, vy + 2); g.lineTo(vx + 2, vy + 2); g.lineTo(vx + 2, vy + 7);
      g.stroke();
      g.restore();
    }

    // Front Hair
    if (hairStyle && hairStyle !== 'none' && hairStyle !== 'bald') {
      drawFrontHair(g, rx, ry, dir, hairCol, hairStyle);
    }
    if (o.hairParts) renderParts(g, o.hairParts, t);

    // Hat / Headwear
    if (o.hat && o.hat !== 'none') {
      drawHat(g, rx, ry, dir, o.hat, o.hatColor);
    }
    if (o.hatParts) renderParts(g, o.hatParts, t);
    if (typeof o.drawHat === 'function') o.drawHat(g, rx, ry, t);
  }

  function drawEyes(g, cx, cy, spread, dir, t, o) {
    const mode = o.eyes || o.eyeMode || 'normal';
    const lookX = o.look ? o.look[0] * 3.2 : dir * 1.5;
    const lookY = o.look ? o.look[1] * 2.5 : 0;
    const blinkCycle = (t + (o.seed || 1) * 1.37) % 3.8;
    const isBlinking = mode === 'normal' && blinkCycle > 3.66;

    C.inkStyle(g, 3.0, C.PAL.ink);

    [-1, 1].forEach((side) => {
      const ex = cx + side * spread, ey = cy;

      if (mode === 'closed' || isBlinking || (mode === 'wink' && side === 1)) {
        g.beginPath();
        g.arc(ex, ey + 1, 6, 0.15 * Math.PI, 0.85 * Math.PI);
        g.stroke();
      } else if (mode === 'happy' || mode === 'closedArch') {
        g.beginPath();
        g.arc(ex, ey + 3, 6.5, 1.15 * Math.PI, 1.85 * Math.PI);
        g.stroke();
      } else if (mode === 'x' || mode === 'dead') {
        C.line(g, ex - 5, ey - 5, ex + 5, ey + 5, { lw: 3 });
        C.line(g, ex + 5, ey - 5, ex - 5, ey + 5, { lw: 3 });
      } else if (mode === 'heart') {
        g.save();
        g.translate(ex, ey);
        const hs = 1 + Math.sin(t * 8) * 0.08;
        g.scale(hs, hs);
        g.fillStyle = '#EF4444';
        g.beginPath();
        g.moveTo(0, 4);
        g.bezierCurveTo(-9, -4, -5, -11, 0, -4);
        g.bezierCurveTo(5, -11, 9, -4, 0, 4);
        g.fill(); g.stroke();
        g.restore();
      } else if (mode === 'dot') {
        C.circle(g, ex + lookX * 0.5, ey + lookY * 0.5, 3.8, { fill: C.PAL.ink, stroke: false });
      } else {
        const rx = (mode === 'wide' || mode === 'panic') ? 7.5 : 6.0;
        const ry = (mode === 'wide' || mode === 'panic') ? 9.2 : 7.6;

        g.save();
        g.beginPath();
        g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
        g.fillStyle = '#FFFFFF';
        g.fill();
        g.clip();

        const pr = mode === 'panic' ? 2.3 : 2.8;
        g.fillStyle = C.PAL.ink;
        g.beginPath();
        g.arc(ex + lookX, ey + lookY, pr, 0, Math.PI * 2);
        g.fill();

        if (mode === 'half' || mode === 'skeptical' || mode === 'deadpan') {
          g.fillStyle = o.skin || '#F0B88B';
          g.fillRect(ex - rx - 2, ey - ry - 2, rx * 2 + 4, ry * 0.95);
          C.line(g, ex - rx - 1, ey - 0.5, ex + rx + 1, ey - 0.5, { lw: 3.0 });
        }
        g.restore();

        g.beginPath();
        g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
        g.stroke();
      }
    });
  }

  function drawGlasses(g, cx, cy, spread, kind) {
    g.save();
    C.inkStyle(g, 2.8, C.PAL.ink);
    if (kind === 'sunglasses' || kind === 'shades') {
      [-1, 1].forEach((s) => {
        C.roundRect(g, cx + s * spread - 12, cy - 8, 24, 16, 4, { fill: '#111827', lw: 2.8 });
      });
      C.line(g, cx - spread + 12, cy - 2, cx + spread - 12, cy - 2, { lw: 2.8 });
    } else if (kind === 'rect') {
      [-1, 1].forEach((s) => {
        C.roundRect(g, cx + s * spread - 12, cy - 7, 24, 14, 3, { fill: 'rgba(255,255,255,0.18)', lw: 2.6 });
      });
      C.line(g, cx - spread + 12, cy - 1, cx + spread - 12, cy - 1, { lw: 2.6 });
    } else if (kind === 'monocle') {
      C.circle(g, cx - spread, cy, 11, { fill: 'rgba(255,255,255,0.22)', lw: 2.6 });
      C.line(g, cx - spread - 9, cy + 7, cx - spread - 14, cy + 28, { lw: 1.8 });
    } else if (kind === 'eyepatch') {
      C.circle(g, cx + spread, cy, 10, { fill: '#18181B', lw: 2.5 });
      C.line(g, cx - 32, cy - 14, cx + 32, cy + 4, { lw: 2.5 });
    } else {
      [-1, 1].forEach((s) => {
        C.circle(g, cx + s * spread, cy, 10.5, { fill: 'rgba(255,255,255,0.16)', lw: 2.6 });
      });
      C.line(g, cx - spread + 10.5, cy, cx + spread - 10.5, cy, { lw: 2.6 });
    }
    g.restore();
  }

  function drawBrows(g, cx, cy, spread, o) {
    const mode = o.brows || (o.eyes === 'panic' ? 'raised' : 'neutral');
    C.inkStyle(g, 3.0, C.PAL.ink);
    [-1, 1].forEach((s) => {
      const bx = cx + s * spread;
      let by = cy, tilt = 0;
      if (mode === 'raised') by -= 5;
      else if (mode === 'angry' || mode === 'furrowed') tilt = -s * 4.5;
      else if (mode === 'sad' || mode === 'worried') tilt = s * 4.0;
      else if (mode === 'skeptical') tilt = s === 1 ? -4 : 2;

      g.beginPath();
      g.moveTo(bx - 7, by - tilt);
      g.quadraticCurveTo(bx, by - 2, bx + 7, by + tilt);
      g.stroke();
    });
  }

  function drawMouth(g, cx, cy, dir, t, o) {
    let m = o.mouth || 'smile';
    if (o.talking) m = Math.sin(t * 20 + (o.seed || 0)) > 0 ? 'talk' : 'smile';

    C.inkStyle(g, 3.0, C.PAL.ink);
    g.save();
    g.translate(cx, cy);

    if (m === 'smile') {
      g.beginPath(); g.arc(0, -3, 8, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke();
    } else if (m === 'frown' || m === 'sad') {
      g.beginPath(); g.arc(0, 7, 8, 1.18 * Math.PI, 1.82 * Math.PI); g.stroke();
    } else if (m === 'neutral' || m === 'flat') {
      C.line(g, -7, 0, 7, 0, { lw: 3.0 });
    } else if (m === 'smirk') {
      g.beginPath(); g.moveTo(-6, 1); g.quadraticCurveTo(2, 2, 8, -4); g.stroke();
    } else if (m === 'o' || m === 'gasp') {
      C.circle(g, 0, 1, 5.5, { fill: '#7F1D1D', lw: 2.8 });
    } else if (m === 'talk' || m === 'open' || m === 'laugh') {
      g.beginPath(); g.arc(0, -2, 11, 0, Math.PI); g.closePath();
      g.fillStyle = '#7F1D1D'; g.fill();
      g.save(); g.clip();
      g.fillStyle = '#FFFFFF'; g.fillRect(-12, -3, 24, 5);
      g.fillStyle = '#F87171'; g.beginPath(); g.arc(0, 10, 7, 0, Math.PI * 2); g.fill();
      g.restore();
      g.stroke();
    } else if (m === 'grit' || m === 'panicTeeth') {
      C.roundRect(g, -14, -5, 28, 13, 5, { fill: '#FFFFFF', lw: 2.8 });
      C.line(g, -13, 1.5, 13, 1.5, { lw: 2 });
      C.line(g, -5, -4, -5, 7, { lw: 2 });
      C.line(g, 5, -4, 5, 7, { lw: 2 });
    } else if (m === 'squiggle') {
      g.beginPath();
      g.moveTo(-9, 1); g.quadraticCurveTo(-4, -3, 0, 1); g.quadraticCurveTo(4, 5, 9, 1);
      g.stroke();
    } else if (m === 'spitTake') {
      C.circle(g, 0, 1, 5.5, { fill: '#7F1D1D', lw: 2.8 });
      for (let i = 0; i < 7; i++) {
        const ang = (i - 3) * 0.18;
        const dist = 16 + ((t * 95 + i * 13) % 45);
        C.circle(g, Math.cos(ang) * dist * dir, Math.sin(ang) * dist + 4, 3.5, {
          fill: o.spitColor || '#D97706',
          lw: 1.5
        });
      }
    }
    g.restore();
  }

  function drawFrontHair(g, rx, ry, dir, col, style) {
    g.save();
    C.inkStyle(g, 3.5, C.PAL.ink, col);
    if (style === 'parted' || style === 'sidePart') {
      g.beginPath();
      g.arc(0, -2, rx + 2, Math.PI * 1.02, Math.PI * 1.98);
      g.lineTo(rx * 0.92, -ry * 0.2);
      g.quadraticCurveTo(rx * 0.3 * dir, -ry * 0.62, -rx * 0.35 * dir, -ry * 0.32);
      g.lineTo(-rx * 0.95, -ry * 0.15);
      g.closePath(); g.fill(); g.stroke();
    } else if (style === 'shortCrop' || style === 'crew') {
      g.beginPath();
      g.arc(0, -3, rx + 1.5, Math.PI * 1.08, Math.PI * 1.92);
      g.quadraticCurveTo(0, -ry * 0.42, -rx * 0.92, -ry * 0.35);
      g.closePath(); g.fill(); g.stroke();
    } else if (style === 'curly' || style === 'afro') {
      [[-34, -18, 16], [-22, -34, 18], [-4, -40, 20], [16, -36, 18], [32, -22, 16], [0, -28, 18]].forEach((p) => {
        C.circle(g, p[0], p[1], p[2], { fill: col, shade: false, lw: 3.2 });
      });
      g.fillStyle = col;
      g.beginPath(); g.ellipse(0, -28, 34, 16, 0, 0, Math.PI * 2); g.fill();
    } else if (style === 'bob' || style === 'shoulder' || style === 'long') {
      g.beginPath();
      g.arc(0, 0, rx + 2.5, Math.PI * 0.88, Math.PI * 2.12);
      g.lineTo(rx * 0.88, ry * 0.45);
      g.quadraticCurveTo(rx * 0.65, -ry * 0.35, 0, -ry * 0.48);
      g.quadraticCurveTo(-rx * 0.65, -ry * 0.35, -rx * 0.88, ry * 0.45);
      g.closePath(); g.fill(); g.stroke();
    } else if (style === 'baldSide' || style === 'receding') {
      [-1, 1].forEach((s) => {
        g.beginPath(); g.ellipse(s * (rx - 2), -4, 8, 16, s * -0.15, 0, Math.PI * 2);
        g.fill(); g.stroke();
      });
    } else if (style === 'bun' || style === 'topBun') {
      C.circle(g, 0, -ry - 10, 15, { fill: col, lw: 3.5 });
      g.beginPath();
      g.arc(0, -3, rx + 1.5, Math.PI * 1.08, Math.PI * 1.92);
      g.quadraticCurveTo(0, -ry * 0.42, -rx * 0.92, -ry * 0.35);
      g.closePath(); g.fill(); g.stroke();
    } else if (style === 'swept') {
      g.beginPath();
      g.moveTo(-rx * 0.95, -12);
      g.quadraticCurveTo(-rx * 0.4, -ry - 16, rx * 1.02, -16);
      g.quadraticCurveTo(rx * 0.3, -ry * 0.35, -rx * 0.95, -12);
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }

  function drawFacialHair(g, cx, cy, rx, ry, col, kind) {
    g.save();
    C.inkStyle(g, 2.8, C.PAL.ink, col);
    if (kind === 'mustache') {
      g.beginPath();
      g.moveTo(cx - 14, cy); g.quadraticCurveTo(cx, cy - 7, cx + 14, cy);
      g.quadraticCurveTo(cx, cy - 1, cx - 14, cy);
      g.closePath(); g.fill(); g.stroke();
    } else if (kind === 'goatee') {
      C.roundRect(g, cx - 8, cy + 8, 16, 14, 6, { fill: col, lw: 2.5 });
    } else if (kind === 'beard') {
      g.beginPath();
      g.arc(0, 2, rx - 1, 0.08 * Math.PI, 0.92 * Math.PI);
      g.quadraticCurveTo(cx, cy - 4, -rx + 2, 8);
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }

  function drawHat(g, rx, ry, dir, kind, col) {
    g.save();
    const c = col || '#FACC15';
    C.inkStyle(g, 3.5, C.PAL.ink, c);

    if (typeof kind === 'object') {
      const hc = kind.color || c;
      if (kind.dome) {
        g.fillStyle = hc;
        g.beginPath();
        g.arc(0, -ry * 0.35, rx * (kind.domeW || 0.92), Math.PI, Math.PI * 2);
        g.fill(); g.stroke();
      }
      if (kind.cylinder) {
        C.roundRect(g, -30, -ry - (kind.h || 36), 60, (kind.h || 36) + 4, 6, { fill: hc, lw: 3.2 });
      }
      if (kind.brim) {
        const bw = rx * (kind.brimW || 2.1);
        C.roundRect(g, -bw / 2, -ry * 0.42, bw, 9, 4, { fill: kind.brimColor || hc, lw: 3.2 });
      }
      g.restore();
      return;
    }

    if (kind === 'hardhat' || kind === 'helmet') {
      g.beginPath(); g.arc(0, -ry * 0.35, rx * 0.92, Math.PI, Math.PI * 2); g.fill(); g.stroke();
      C.roundRect(g, -rx * 1.06, -ry * 0.42, rx * 2.12, 10, 5, { fill: c, lw: 3.2 });
    } else if (kind === 'cap' || kind === 'capBack') {
      const visorDir = kind === 'capBack' ? -dir : dir;
      g.beginPath(); g.arc(0, -ry * 0.35, rx * 0.9, Math.PI, Math.PI * 2); g.fill(); g.stroke();
      C.roundRect(g, visorDir > 0 ? -10 : -rx * 1.25, -ry * 0.42, rx * 1.25 + 10, 9, 4, { fill: c, lw: 3.2 });
    } else if (kind === 'chefHat') {
      C.roundRect(g, -30, -ry - 14, 60, 22, 4, { fill: '#FFFFFF', lw: 3.2 });
      C.circle(g, -18, -ry - 26, 16, { fill: '#FFFFFF', lw: 3.2 });
      C.circle(g, 18, -ry - 26, 16, { fill: '#FFFFFF', lw: 3.2 });
      C.circle(g, 0, -ry - 32, 19, { fill: '#FFFFFF', lw: 3.2 });
    } else if (kind === 'topHat') {
      C.roundRect(g, -28, -ry - 38, 56, 44, 4, { fill: '#18181B', lw: 3.2 });
      C.roundRect(g, -42, -ry + 2, 84, 9, 4, { fill: '#18181B', lw: 3.2 });
    } else if (kind === 'crown') {
      g.fillStyle = '#FACC15';
      g.beginPath();
      g.moveTo(-26, -ry + 6); g.lineTo(-28, -ry - 20); g.lineTo(-12, -ry - 8);
      g.lineTo(0, -ry - 26); g.lineTo(12, -ry - 8); g.lineTo(28, -ry - 20); g.lineTo(26, -ry + 6);
      g.closePath(); g.fill(); g.stroke();
    } else if (kind === 'securityCap' || kind === 'captainHat') {
      const topC = kind === 'captainHat' ? '#FFFFFF' : (col || '#1E3A5F');
      C.roundRect(g, -36, -ry - 12, 72, 20, 6, { fill: topC, lw: 3.2 });
      C.roundRect(g, -38, -ry + 4, 76, 8, 3, { fill: '#111827', lw: 3.2 });
      C.circle(g, 0, -ry - 2, 5, { fill: '#FACC15', lw: 2 });
    } else if (kind === 'turban') {
      C.roundRect(g, -rx * 1.05, -ry - 12, rx * 2.1, 34, 17, { fill: c, lw: 3.5 });
      C.circle(g, 0, -ry - 4, 7, { fill: '#FACC15', lw: 2.5 });
    } else if (kind === 'spaceHelmet') {
      C.circle(g, 0, -2, rx * 1.22, { fill: 'rgba(186, 230, 253, 0.25)', lw: 4 });
    }
    g.restore();
  }

  // --- Internal: Stick Arms, Both-Hands Target Reach & Custom Hand Props ---
  function drawArm(g, side, shoulderY, torsoW, pose, walkPhase, t, dir, charX, charY, scale, o) {
    const sx = side * (torsoW * 0.44);
    const sy = shoulderY;
    let hx = sx + side * 22;
    let hy = sy + 42;

    const isFrontArm = (dir >= 0 && side === 1) || (dir < 0 && side === -1);
    const targetCoord = side === -1 ? o.leftHandTo : (o.rightHandTo || (isFrontArm ? o.pointTo : null));

    if (Array.isArray(targetCoord)) {
      hx = (targetCoord[0] - charX) / scale;
      hy = (targetCoord[1] - charY) / scale;
      const dx = hx - sx, dy = hy - sy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxArm = o.pointerStick ? 56 : 82;
      if (dist > maxArm) {
        hx = sx + (dx / dist) * maxArm;
        hy = sy + (dy / dist) * maxArm;
      }
    } else if (pose === 'handsUp' || pose === 'celebrate') {
      hx = sx + side * 32;
      hy = sy - 38 + Math.sin(t * 7 + side) * 5;
    } else if (pose === 'shrug') {
      hx = sx + side * 38;
      hy = sy - 8;
    } else if (pose === 'wave' && isFrontArm) {
      hx = sx + side * 36 + Math.sin(t * 10) * 10;
      hy = sy - 34;
    } else if (pose === 'think' && isFrontArm) {
      hx = dir * 12;
      hy = sy - 26;
    } else if (pose === 'point' && isFrontArm) {
      hx = sx + dir * 56;
      hy = sy - 10;
    } else if (walkPhase > 0) {
      hx = sx + Math.sin(walkPhase + (side === 1 ? Math.PI : 0)) * 18;
      hy = sy + 40;
    }

    C.inkStyle(g, 4.2, C.PAL.ink, o.skin || '#F0B88B');
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo((sx + hx) / 2 + side * 6, (sy + hy) / 2 + 8, hx, hy);
    g.stroke();

    C.circle(g, hx, hy, 5.5, { fill: o.skin || '#F0B88B', lw: 3.0 });

    if (isFrontArm && o.pointerStick && Array.isArray(targetCoord)) {
      const tx = (targetCoord[0] - charX) / scale;
      const ty = (targetCoord[1] - charY) / scale;
      C.line(g, hx, hy, tx, ty, { lw: 3.5, color: C.PAL.ink });
      C.circle(g, tx, ty, 4, { fill: '#EF4444', lw: 2 });
    }

    if (isFrontArm) {
      if (o.handParts) {
        g.save();
        g.translate(hx, hy);
        renderParts(g, o.handParts, t);
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
        g.fillStyle = '#EF4444';
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
   * 9:16 Defaults: `x = 500, y = 820, s = 1.20`.
   */
  function hand(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : C.SAFE.cx;
    const y = o.y !== undefined ? o.y : C.SAFE.cy;
    const s = o.s !== undefined ? o.s : 1.20;
    const angle = (o.angle || 0) * (Math.PI / 180);
    const skin = o.skin || '#F0B88B';
    const sleeve = o.sleeveColor || '#CBD5E1';

    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(s, s);

    C.roundRect(g, 36, -24, 340, 48, 8, { fill: sleeve, lw: 3.8, shadow: true });
    C.roundRect(g, 18, -22, 24, 44, 4, { fill: '#FFFFFF', lw: 3.5 });
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
   * 9:16 Defaults: `x = 500, y = 1320, s = 1.22`.
   */
  function mascot(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : C.SAFE.cx;
    const y = o.y !== undefined ? o.y : C.FLOOR_Y;
    const w = o.w || 120, h = o.h || 120, s = o.s !== undefined ? o.s : 1.22, t = o.t || 0;
    const legH = o.legs === false ? 0 : (o.legH || 58);
    const bodyCenterY = -legH - h / 2;

    g.save();
    g.translate(x, y);
    g.scale(s, s);

    if (o.legs !== false) {
      drawLegs(g, -legH, legH, o.walk ? t * 8 : 0, o.pose || 'idle', 1, o);
    }

    if (o.arms !== false) {
      drawArm(g, -1, bodyCenterY, w, o.pose || 'idle', 0, t, 1, x, y, s, { skin: o.handColor || '#F0B88B' });
      drawArm(g, +1, bodyCenterY, w, o.pose || 'idle', 0, t, 1, x, y, s, {
        skin: o.handColor || '#F0B88B',
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
        fill: o.fill || '#22C55E',
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
   * 9:16 Defaults: `x = 500, y = 1320, s = 1.22`.
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
    const s = o.s !== undefined ? o.s : 1.22;
    const plan = o.bodyPlan || o.kind || 'quadruped';
    const col = o.color || '#D97706';

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
      renderParts(g, [{ type: 'poly', pts: [[bw * 0.65, -15 - bh], [bw * 0.95, -12 - bh], [bw * 0.65, -9 - bh]], fill: '#FACC15' }], t);
    } else if (plan === 'fish') {
      const bw = o.bodyW || 56, bh = o.bodyH || 30;
      renderParts(g, [
        { type: 'poly', pts: [[-bw / 2, -bh / 2], [-bw * 0.85, -bh], [-bw * 0.85, 0]], fill: col },
        { type: 'ellipse', x: 0, y: -bh / 2, rx: bw / 2, ry: bh / 2, fill: col },
        { type: 'circle', x: bw * 0.28, y: -bh * 0.58, r: 3, fill: C.PAL.ink, stroke: false }
      ], t);
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
      renderParts(g, o.parts, t);
    }
    g.restore();
  }

  /**
   * 7. CROWD / QUEUE / ARMY GENERATOR (`CHAR.crowd`)
   * 9:16 Safe-Zone Defaults: `count = 5, rows = 2, x0 = 140, x1 = 820, y = 1320, s = 0.95`.
   */
  function crowd(g, opts) {
    const o = opts || {};
    const count = o.count || 5;
    const x0 = o.x0 !== undefined ? o.x0 : 140;
    const x1 = o.x1 !== undefined ? Math.min(840, o.x1) : 820;
    const y = o.y !== undefined ? o.y : C.FLOOR_Y;
    const rows = o.rows || 2;
    const s = o.s || 0.95;
    const seed = o.seed || 42;
    const t = o.t || 0;

    for (let r = 0; r < rows; r++) {
      const rowY = y - (rows - 1 - r) * (o.rowStepY || 82);
      const rowScale = s * (1 - (rows - 1 - r) * 0.06);
      for (let i = 0; i < count; i++) {
        const u = count > 1 ? i / (count - 1) : 0.5;
        const cx = C.lerp(x0, x1, u) + ((r % 2) * 24 - 12);
        const memberCfg = generate(seed + r * 97 + i * 13, o.template || {});
        draw(g, Object.assign(memberCfg, {
          x: cx,
          y: rowY,
          s: rowScale,
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