/**
 * MODULE 08: 9:16 VERTICAL SCIENCE, SPACE, HISTORY & TECH BREAKDOWN CREATOR (engine/08_diagrams.js)
 * Paper Billions / Kurzgesagt / Oversimplified Edition.
 * Built for 1080x1920 vertical flowcharts, X-ray cutaways, cycles,
 * silhouette scale comparisons (floorY = 1320), and vector Earth/space orbital systems inside C.SAFE.
 */
(function () {
  const C = window.CORE;

  // Helper: Draw a high-contrast pill label that is 100% readable on both light and dark/space backgrounds
  function drawPillLabel(g, x, y, text, sub, opts) {
    if (!text && !sub) return;
    const o = opts || {};
    const fontMain = o.fontMain || ('900 ' + (o.size || 22) + 'px "Nunito", sans-serif');
    const fontSub = o.fontSub || ('700 ' + (o.subSize || 16) + 'px "Space Mono", monospace');

    g.save();
    g.font = fontMain;
    let wMain = text ? g.measureText(text).width : 0;
    let wSub = 0;
    if (sub) {
      g.font = fontSub;
      wSub = g.measureText(sub).width;
    }

    const padX = o.padX || 18;
    const boxW = Math.min(o.maxW || 380, Math.max(wMain, wSub) + padX * 2);
    const boxH = sub ? (o.h || 58) : (o.h || 38);

    // Clamp inside 9:16 Safe Zone (x: 84..860)
    const cx = C.clamp(x, 84 + boxW / 2, 860 - boxW / 2);
    const cy = C.clamp(y, 235 + boxH / 2, 1365 - boxH / 2);

    C.roundRect(g, cx - boxW / 2, cy - boxH / 2, boxW, boxH, o.rad || 10, {
      fill: o.fill || 'rgba(255, 255, 255, 0.96)',
      stroke: o.stroke || C.PAL.ink,
      lw: o.lw || 3.2,
      shadow: o.shadow !== false
    });

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (text && sub) {
      g.font = fontMain;
      g.fillStyle = o.color || C.PAL.ink;
      g.fillText(text, cx, cy - 10, boxW - 14);
      g.font = fontSub;
      g.fillStyle = o.subColor || '#475569';
      g.fillText(sub, cx, cy + 13, boxW - 14);
    } else if (text) {
      g.font = fontMain;
      g.fillStyle = o.color || C.PAL.ink;
      g.fillText(text, cx, cy + 1, boxW - 14);
    }
    g.restore();
  }

  // Helper: Draw a soft inner Paper-Billions highlight/shadow inside a card
  function drawSoftCardShade(g, x, y, w, h, r, baseColor) {
    C.roundRect(g, x, y, w, h, r, {
      fill: baseColor || '#FFFFFF',
      lw: 3.8,
      shadow: true
    });
    g.save();
    C.pathRoundRect(g, x, y, w, h, r);
    g.clip();
    // Bottom rim shadow
    g.fillStyle = 'rgba(15, 23, 42, 0.08)';
    g.fillRect(x, y + h - 10, w, 10);
    // Top warm highlight
    g.fillStyle = 'rgba(255, 255, 255, 0.35)';
    g.fillRect(x, y, w, 6);
    g.restore();
    C.roundRect(g, x, y, w, h, r, { fill: false, lw: 3.8, stroke: C.PAL.ink });
  }

  /**
   * 1. NODE & ANIMATED PIPE/PACKET FLOW NETWORK (`DIAGRAM.flow(g, lt, opts)`)
   * Auto-clamps nodes inside C.SAFE (x: 110..840, y: 270..1300) so horizontal or
   * vertical flowcharts never get clipped by the right-side Like/Comment buttons.
   */
  function flow(g, lt, opts) {
    const o = opts || {};
    const rawNodes = o.nodes || [];
    const links = o.links || [];
    const nodeMap = {};

    const isLegacyWide = rawNodes.some((n) => n.x > 880);
    const nodes = rawNodes.map((n, idx) => {
      const copy = Object.assign({}, n);
      if (isLegacyWide) {
        copy.x = C.SAFE.cx;
        copy.y = C.lerp(400, 1180, rawNodes.length > 1 ? idx / (rawNodes.length - 1) : 0.5);
      } else {
        copy.x = C.safeX(n.x !== undefined ? n.x : C.SAFE.cx, (n.w || 240) / 2);
        copy.y = C.safeY(n.y !== undefined ? n.y : C.SAFE.cy, (n.h || 115) / 2);
      }
      if (copy.id) nodeMap[copy.id] = copy;
      return copy;
    });

    g.save();

    links.forEach((lk, idx) => {
      const n0 = typeof lk.from === 'object' ? lk.from : nodeMap[lk.from];
      const n1 = typeof lk.to === 'object' ? lk.to : nodeMap[lk.to];
      if (!n0 || !n1) return;

      const x0 = n0.x, y0 = n0.y, x1 = n1.x, y1 = n1.y;
      const style = lk.style || 'pipe';

      if (style === 'pipe') {
        C.line(g, x0, y0, x1, y1, { lw: lk.lw || 18, color: C.PAL.ink });
        C.line(g, x0, y0, x1, y1, { lw: (lk.lw || 18) - 6, color: lk.pipeColor || '#CBD5E1' });
      } else {
        C.arrow(g, x0, y0, x1, y1, {
          lw: lk.lw || 5,
          color: lk.color || C.PAL.ink,
          dash: style === 'dashed' ? [12, 10] : undefined,
          curve: lk.curve,
          curveY: lk.curveY
        });
      }

      if (lk.packets !== false) {
        const count = lk.packetCount || 3;
        const speed = lk.speed || 0.65;
        for (let i = 0; i < count; i++) {
          const u = ((lt * speed + i / count + idx * 0.17) % 1);
          const px = C.lerp(x0, x1, u);
          const py = C.lerp(y0, y1, u);
          C.circle(g, px, py, lk.packetR || 9, {
            fill: lk.packetColor || '#3B82F6',
            lw: 2.8
          });
        }
      }

      if (lk.label) {
        const isVert = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        const mx = isVert ? (x0 + x1) / 2 + 135 : (x0 + x1) / 2;
        const my = isVert ? (y0 + y1) / 2 : (y0 + y1) / 2 - 28;
        drawPillLabel(g, mx, my, lk.label, null, { size: 19, h: 34, padX: 14 });
      }
    });

    nodes.forEach((n, idx) => {
      const sc = C.pop(lt, n.t0 !== undefined ? n.t0 : idx * 0.08, 0.25);
      if (sc <= 0.01) return;
      const w = n.w || 270, h = n.h || 115;

      g.save();
      g.translate(n.x, n.y);
      g.scale(sc, sc);

      if (n.shape === 'circle') {
        C.circle(g, 0, 0, w / 2, { fill: n.color || '#FFFFFF', lw: 4, shade: true, shadow: true });
      } else {
        drawSoftCardShade(g, -w / 2, -h / 2, w, h, n.rad || 16, n.color || '#FFFFFF');
        if (n.hatch) {
          C.hatchRect(g, -w / 2, -h / 2, w, h, { rad: n.rad || 16, color: 'rgba(24,24,27,0.10)', spacing: 11 });
        }
      }

      if (n.parts && window.CHAR) {
        window.CHAR.renderParts(g, n.parts, lt);
      }

      if (n.label) {
        g.font = '900 ' + (n.size || 25) + 'px "Nunito", sans-serif';
        g.fillStyle = n.textColor || C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(n.label, 0, n.sub ? -14 : 0, w - 24);
      }
      if (n.sub) {
        g.font = '700 18px "Space Mono", monospace';
        g.fillStyle = n.subColor || '#475569';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(n.sub, 0, 18, w - 24);
      }
      g.restore();
    });

    g.restore();
  }

  /**
   * 2. UNIVERSAL X-RAY / EXPLODED LAYER CUTAWAY CREATOR (`DIAGRAM.cutaway(g, lt, opts)`)
   * Supports shaped layers ('nosecone', 'cylinder', 'booster', 'rect') and
   * high-contrast right-side callout pills strictly clamped inside x <= 855.
   */
  function cutaway(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? C.clamp(o.x, 260, 440) : 340;
    const cy = o.y !== undefined ? C.clamp(o.y, 480, 980) : 780;
    const explode = o.explode !== undefined ? o.explode : C.seg(lt, o.t0 || 0.15, (o.t0 || 0.15) + 0.65, C.ease.outCubic);
    const layers = o.layers || [];
    const gap = (o.gap || 62) * explode;

    g.save();
    const totalH = layers.reduce((acc, l) => acc + (l.h || 76), 0) + Math.max(0, layers.length - 1) * gap;
    let curY = cy - totalH / 2;

    layers.forEach((l, idx) => {
      const lw = Math.min(l.w || 300, 340);
      const lh = l.h || 76;
      const ly = curY + lh / 2;
      const isDimmed = o.isolateIdx !== undefined && o.isolateIdx !== null && o.isolateIdx !== idx;

      g.save();
      g.globalAlpha = isDimmed ? 0.25 : 1.0;

      const shape = l.shape || 'rect';
      if (shape === 'nosecone') {
        g.beginPath();
        g.moveTo(cx, curY);
        g.quadraticCurveTo(cx + lw * 0.52, curY + lh * 0.35, cx + lw / 2, curY + lh);
        g.lineTo(cx - lw / 2, curY + lh);
        g.quadraticCurveTo(cx - lw * 0.52, curY + lh * 0.35, cx, curY);
        g.closePath();
        g.fillStyle = l.color || '#E2E8F0';
        g.fill();
        C.inkStyle(g, l.highlight ? 5 : 3.8, l.highlight ? '#FACC15' : C.PAL.ink);
        g.stroke();
      } else {
        drawSoftCardShade(g, cx - lw / 2, curY, lw, lh, l.rad || 10, l.color || '#CBD5E1');
        if (l.hatch) {
          C.hatchRect(g, cx - lw / 2, curY, lw, lh, { rad: l.rad || 10, color: 'rgba(24,24,27,0.12)', spacing: 11 });
        }
        if (l.highlight) {
          C.roundRect(g, cx - lw / 2, curY, lw, lh, l.rad || 10, { fill: false, lw: 5, stroke: '#FACC15' });
        }
      }

      if (l.parts && window.CHAR) {
        g.save();
        g.translate(cx, ly);
        window.CHAR.renderParts(g, l.parts, lt);
        g.restore();
      }

      // Leader-line technical callout on right side (strictly inside x <= 855 Safe Zone)
      if (l.label && explode > 0.25) {
        const startX = cx + lw / 2 + 8;
        const endX = startX + 38;
        C.line(g, startX, ly, endX, ly, { lw: 3.5, color: '#FACC15' });
        C.circle(g, startX, ly, 5.5, { fill: '#FACC15', stroke: C.PAL.ink, lw: 2.5 });

        g.font = '900 20px "Nunito", sans-serif';
        const w1 = g.measureText(l.label).width;
        g.font = '700 15px "Space Mono", monospace';
        const w2 = l.sub ? g.measureText(l.sub).width : 0;
        const boxW = Math.min(340, Math.max(w1, w2) + 28);
        const boxH = l.sub ? 54 : 38;
        const pillX = Math.min(endX + 8 + boxW / 2, 855 - boxW / 2);

        drawPillLabel(g, pillX, ly, l.label, l.sub, {
          size: 20,
          subSize: 15,
          maxW: 340,
          h: boxH
        });
      }

      g.restore();
      curY += lh + gap;
    });
    g.restore();
  }

  /**
   * 3. CIRCULAR FEEDBACK LOOP / CYCLE CREATOR (`DIAGRAM.cycle(g, lt, opts)`)
   */
  function cycle(g, lt, opts) {
    const o = opts || {};
    const r = Math.min(o.r || 225, 240);
    const cx = C.safeX(o.x !== undefined ? o.x : 475, r + 90);
    const cy = C.safeY(o.y !== undefined ? o.y : 800, r + 60);
    const steps = o.steps || [];
    const n = steps.length;
    if (!n) return;

    g.save();
    g.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    g.lineWidth = 4;
    g.setLineDash([12, 10]);
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);

    if (o.centerLabel) {
      drawPillLabel(g, cx, cy, o.centerLabel, null, {
        fontMain: '900 30px "Caveat", cursive',
        h: 46,
        padX: 22,
        fill: '#FEF08A'
      });
    }

    steps.forEach((st, i) => {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const sx = cx + Math.cos(a0) * r;
      const sy = cy + Math.sin(a0) * r;
      const nx = cx + Math.cos(a1) * r;
      const ny = cy + Math.sin(a1) * r;

      const midX = (sx + nx) / 2 + Math.cos((a0 + a1) / 2) * 32;
      const midY = (sy + ny) / 2 + Math.sin((a0 + a1) / 2) * 32;
      C.arrow(g, sx, sy, nx, ny, {
        lw: 4.5,
        color: st.arrowColor || '#FACC15',
        curve: true,
        curveX: (midX - (sx + nx) / 2),
        curveY: (midY - (sy + ny) / 2)
      });

      const w = st.w || 190, h = st.h || 88;
      drawSoftCardShade(g, sx - w / 2, sy - h / 2, w, h, 14, st.color || '#FFFFFF');
      g.font = '900 20px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(st.label || '', sx, sy - (st.sub ? 10 : 0), w - 18);
      if (st.sub) {
        g.font = '700 16px "Space Mono", monospace';
        g.fillStyle = '#475569';
        g.fillText(st.sub, sx, sy + 16, w - 18);
      }
    });
    g.restore();
  }

  // Helper: Draw recognizable landmark/rocket silhouettes for DIAGRAM.scaleCompare
  function drawScaleSilhouette(g, kind, label, x, fy, w, h, color, lt) {
    const key = String(kind || label || '').toLowerCase();

    g.save();
    // 1. STARSHIP / FULL STACK ROCKET SILHOUETTE
    if (key.includes('ship') || key.includes('starship') || key.includes('rocket') || key.includes('s42') || key.includes('saturn') || key.includes('falcon')) {
      const rw = Math.min(w * 0.62, 86);
      const noseH = h * 0.16;
      const shipH = h * 0.26;
      const boostH = h - noseH - shipH;
      const topY = fy - h;

      // Aft & Forward Flaps
      g.fillStyle = '#334155';
      C.inkStyle(g, 3.2, C.PAL.ink);
      // Forward flaps
      g.beginPath();
      g.moveTo(x - rw * 0.4, topY + noseH * 0.45);
      g.lineTo(x - rw * 0.72, topY + noseH * 0.95);
      g.lineTo(x - rw * 0.4, topY + noseH * 1.05);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(x + rw * 0.4, topY + noseH * 0.45);
      g.lineTo(x + rw * 0.72, topY + noseH * 0.95);
      g.lineTo(x + rw * 0.4, topY + noseH * 1.05);
      g.closePath(); g.fill(); g.stroke();

      // Aft flaps at bottom of upper stage
      const stageY = topY + noseH + shipH;
      g.beginPath();
      g.moveTo(x - rw * 0.5, stageY - shipH * 0.32);
      g.lineTo(x - rw * 0.85, stageY);
      g.lineTo(x - rw * 0.5, stageY);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(x + rw * 0.5, stageY - shipH * 0.32);
      g.lineTo(x + rw * 0.85, stageY);
      g.lineTo(x + rw * 0.5, stageY);
      g.closePath(); g.fill(); g.stroke();

      // Booster Body (Bottom Half)
      C.roundRect(g, x - rw / 2, stageY, rw, boostH - 10, 4, { fill: '#CBD5E1', lw: 3.5 });
      // Grid fins
      C.roundRect(g, x - rw / 2 - 12, stageY + 12, 12, 16, 2, { fill: '#475569', lw: 2.5 });
      C.roundRect(g, x + rw / 2, stageY + 12, 12, 16, 2, { fill: '#475569', lw: 2.5 });
      // Hot-stage ring
      C.roundRect(g, x - rw / 2, stageY - 4, rw, 10, 2, { fill: '#475569', lw: 3 });

      // Upper Stage Body (Starship)
      C.roundRect(g, x - rw / 2, topY + noseH, rw, shipH, 2, { fill: '#E2E8F0', lw: 3.5 });
      // Black Heat Shield strip on left side of Starship
      C.roundRect(g, x - rw / 2, topY + noseH, rw * 0.38, shipH, 2, { fill: '#1E293B', lw: 2.5 });

      // Nosecone (Connected seamlessly to topY + noseH!)
      g.beginPath();
      g.moveTo(x, topY);
      g.quadraticCurveTo(x + rw * 0.52, topY + noseH * 0.4, x + rw / 2, topY + noseH);
      g.lineTo(x - rw / 2, topY + noseH);
      g.quadraticCurveTo(x - rw * 0.52, topY + noseH * 0.4, x, topY);
      g.closePath();
      g.fillStyle = '#E2E8F0';
      g.fill();
      C.inkStyle(g, 3.5, C.PAL.ink);
      g.stroke();

      // Raptor Engine Nozzles at base
      [-rw * 0.3, 0, rw * 0.3].forEach((ox) => {
        C.roundRect(g, x + ox - 7, fy - 12, 14, 12, 3, { fill: '#334155', lw: 2.5 });
      });
      g.restore();
      return;
    }

    // 2. QUTUB MINAR / MINARET / ANCIENT TOWER SILHOUETTE
    if (key.includes('qutub') || key.includes('minar') || key.includes('pis') || key.includes('tower')) {
      const baseW = Math.min(w * 0.78, 110);
      const topW = baseW * 0.42;
      const topY = fy - h;
      const tiers = 5;

      for (let t = 0; t < tiers; t++) {
        const u0 = t / tiers;
        const u1 = (t + 1) / tiers;
        const y0 = C.lerp(topY + 14, fy, u0);
        const y1 = C.lerp(topY + 14, fy, u1);
        const w0 = C.lerp(topW, baseW, u0);
        const w1 = C.lerp(topW, baseW, u1);

        g.beginPath();
        g.moveTo(x - w0 / 2, y0);
        g.lineTo(x + w0 / 2, y0);
        g.lineTo(x + w1 / 2, y1);
        g.lineTo(x - w1 / 2, y1);
        g.closePath();
        g.fillStyle = t % 2 === 0 ? (color || '#D97706') : C.shadeColor(color || '#D97706', -12);
        g.fill();
        C.inkStyle(g, 3.4, C.PAL.ink);
        g.stroke();

        // Vertical fluting lines
        C.line(g, x - w0 * 0.18, y0, x - w1 * 0.18, y1, { lw: 2, color: 'rgba(24,24,27,0.35)' });
        C.line(g, x + w0 * 0.18, y0, x + w1 * 0.18, y1, { lw: 2, color: 'rgba(24,24,27,0.35)' });

        // Balcony ring (chhajja) between tiers
        if (t > 0) {
          C.roundRect(g, x - w0 / 2 - 6, y0 - 5, w0 + 12, 10, 3, { fill: '#FEF3C7', lw: 2.8 });
        }
      }
      // Top Cupola Dome
      C.circle(g, x, topY + 14, topW * 0.38, { fill: '#FDE68A', lw: 3 });
      g.restore();
      return;
    }

    // 3. STATUE OF LIBERTY / MONUMENT SILHOUETTE
    if (key.includes('liberty') || key.includes('statue')) {
      const pedH = h * 0.46;
      const statH = h * 0.54;
      const pedW = Math.min(w * 0.82, 115);

      // Stepped Stone Pedestal
      C.roundRect(g, x - pedW / 2, fy - pedH * 0.55, pedW, pedH * 0.55, 4, { fill: '#D6D3D1', lw: 3.4 });
      C.roundRect(g, x - pedW * 0.38, fy - pedH, pedW * 0.76, pedH * 0.45, 4, { fill: '#E7E5E4', lw: 3.4 });

      // Verdigris Copper Statue Body
      const sy = fy - pedH;
      const col = color || '#34D399';
      g.beginPath();
      g.moveTo(x - pedW * 0.26, sy);
      g.lineTo(x - pedW * 0.18, sy - statH * 0.68);
      g.lineTo(x + pedW * 0.18, sy - statH * 0.68);
      g.lineTo(x + pedW * 0.26, sy);
      g.closePath();
      g.fillStyle = col;
      g.fill();
      C.inkStyle(g, 3.4, C.PAL.ink);
      g.stroke();

      // Head & 7-Spike Crown
      const headY = sy - statH * 0.74;
      C.circle(g, x, headY, 13, { fill: col, lw: 3 });
      for (let a = -1.2; a <= 1.2; a += 0.4) {
        C.line(g, x + Math.sin(a) * 12, headY - Math.cos(a) * 12, x + Math.sin(a) * 23, headY - Math.cos(a) * 23, { lw: 3, color: C.PAL.ink });
      }

      // Raised Torch Arm & Golden Flame
      const torchX = x + pedW * 0.22;
      const torchY = fy - h + 14;
      C.line(g, x + pedW * 0.14, sy - statH * 0.62, torchX, torchY + 12, { lw: 7, color: C.PAL.ink });
      C.line(g, x + pedW * 0.14, sy - statH * 0.62, torchX, torchY + 12, { lw: 4, color: col });
      C.circle(g, torchX, torchY, 10, { fill: '#FACC15', stroke: '#EA580C', lw: 3 });
      g.restore();
      return;
    }

    // 4. DEFAULT ARCHITECTURAL MONOLITH BAR WITH METER TICKS
    drawSoftCardShade(g, x - w / 2, fy - h, w, h, 10, color || '#3B82F6');
    C.hatchRect(g, x - w / 2, fy - h, w, h, { rad: 10, color: 'rgba(24,24,27,0.14)', spacing: 12 });
    g.restore();
  }

  /**
   * 4. SIDE-BY-SIDE 9:16 SCALE COMPARISON ARENA (`DIAGRAM.scaleCompare(g, lt, opts)`)
   * Renders recognizable silhouettes (Starship, Qutub Minar, Statue of Liberty, Buildings)
   * with high-contrast pill labels so text never disappears on dark/blueprint backgrounds!
   */
  function scaleCompare(g, lt, opts) {
    const o = opts || {};
    const fy = o.floorY !== undefined ? o.floorY : C.FLOOR_Y;
    const items = o.items || [];
    if (!items.length) return;

    let maxH = 0;
    items.forEach((it) => { if ((it.size || 1) > maxH) maxH = it.size || 1; });

    g.save();
    const span = Math.min(o.span || 540, C.SAFE.w - 180);
    const startX = C.SAFE.cx - span / 2;

    // Subtle horizontal height reference gridlines behind structures
    [0.25, 0.5, 0.75, 1.0].forEach((u) => {
      const gy = fy - u * 660;
      C.line(g, 110, gy, 840, gy, { lw: 1.5, color: 'rgba(148, 163, 184, 0.25)', dash: [8, 8] });
    });

    items.forEach((it, i) => {
      const ix = items.length === 1 ? C.SAFE.cx : startX + (i / (items.length - 1)) * span;
      const sc = C.pop(lt, it.t0 !== undefined ? it.t0 : i * 0.15, 0.30);
      if (sc <= 0.01) return;

      const pixelH = Math.max(60, ((it.size || 1) / maxH) * 660) * sc;
      const pixelW = it.w || Math.min(165, Math.max(78, pixelH * 0.38));

      drawScaleSilhouette(g, it.kind, it.label, ix, fy, pixelW, pixelH, it.color || '#3B82F6', lt);

      if (it.parts && window.CHAR) {
        g.save();
        g.translate(ix, fy - pixelH / 2);
        window.CHAR.renderParts(g, it.parts, lt);
        g.restore();
      }

      // High-contrast bottom label pill (Never invisible on dark/blueprint floors!)
      if (it.label) {
        drawPillLabel(g, ix, fy + 42, it.label, null, {
          size: 21,
          h: 38,
          padX: 14,
          maxW: 230
        });
      }

      // High-contrast top metric badge
      if (it.metric) {
        drawPillLabel(g, ix, fy - pixelH - 32, it.metric, null, {
          fontMain: '900 28px "Space Mono", monospace',
          fill: it.color || '#FEF08A',
          color: '#18181B',
          h: 42,
          padX: 14
        });
      }
    });
    g.restore();
  }

  // Helper: Draw a cohesive mini vector spacecraft/satellite tangent to its orbit
  function drawOrbitingBody(g, b, bx, by, tangentAngle, t) {
    const r = b.r || 16;
    const rawKind = String(b.kind || b.label || '').toLowerCase();

    g.save();
    g.translate(bx, by);

    // 1. MINI VECTOR STARSHIP / ROCKET IN ORBIT
    if (rawKind.includes('ship') || rawKind.includes('starship') || rawKind.includes('rocket') || rawKind.includes('s42')) {
      g.rotate(tangentAngle);
      const sc = Math.max(0.75, r / 18);
      g.scale(sc, sc);

      // Thruster plasma flame
      g.beginPath();
      g.moveTo(-22, -5);
      g.lineTo(-42 - Math.sin(t * 28) * 6, 0);
      g.lineTo(-22, 5);
      g.closePath();
      g.fillStyle = '#38BDF8';
      g.fill();

      // Aft flaps
      g.fillStyle = '#1E293B';
      C.roundRect(g, -22, -14, 10, 28, 2, { fill: '#1E293B', lw: 2.5 });
      // Cylindrical hull + black heat shield belly
      C.roundRect(g, -20, -8, 32, 16, 3, { fill: '#E2E8F0', lw: 2.8 });
      C.roundRect(g, -20, 1, 32, 7, 2, { fill: '#1E293B', lw: 2 });
      // Nosecone pointing forward (+x)
      g.beginPath();
      g.moveTo(12, -8);
      g.quadraticCurveTo(24, -6, 28, 0);
      g.quadraticCurveTo(24, 6, 12, 8);
      g.closePath();
      g.fillStyle = '#F8FAFC';
      g.fill();
      C.inkStyle(g, 2.8, C.PAL.ink);
      g.stroke();
      g.restore();
    }
    // 2. MINI VECTOR SATELLITE IN ORBIT
    else if (rawKind.includes('sat') || rawKind.includes('iss') || rawKind.includes('probe')) {
      g.rotate(tangentAngle * 0.25);
      // Solar panel wings (locked in local coordinates!)
      C.roundRect(g, -38, -8, 24, 16, 2, { fill: '#2563EB', lw: 2.5 });
      C.roundRect(g, 14, -8, 24, 16, 2, { fill: '#2563EB', lw: 2.5 });
      // Gold foil core bus
      C.roundRect(g, -11, -11, 22, 22, 4, { fill: '#FACC15', lw: 3 });
      // Dish antenna
      C.circle(g, 0, -15, 5, { fill: '#E2E8F0', lw: 2.2 });
      g.restore();
    }
    // 3. STANDARD PLANET / MOON / ELECTRON SPHERE
    else {
      C.circle(g, 0, 0, r, { fill: b.color || '#38BDF8', lw: 3.5, shade: true, shadow: true });
      g.restore();
    }

    // High-contrast label pill above orbiting body
    if (b.label) {
      drawPillLabel(g, 0, 0, null, null); // no-op guard
      g.save();
      g.translate(bx, by - r - 24);
      g.font = '900 17px "Nunito", sans-serif';
      const tw = g.measureText(b.label).width + 20;
      C.roundRect(g, -tw / 2, -15, tw, 30, 8, {
        fill: 'rgba(15, 23, 42, 0.90)',
        stroke: b.color || '#38BDF8',
        lw: 2.5
      });
      g.fillStyle = '#FFFFFF';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(b.label, 0, 0);
      g.restore();
    }
  }

  /**
   * 5. UNIVERSAL ORBITAL / PLANETARY / ATOMIC SYSTEM CREATOR (`DIAGRAM.orbit(g, t, opts)`)
   * Automatically renders a real 2.5D Vector Earth Globe (never an Earth emoji inside a blue ball!)
   * when `coreType: 'earth'` or `coreLabel` mentions Earth/World/🌍.
   */
  function orbit(g, t, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? C.clamp(o.x, 260, 660) : 485;
    const cy = o.y !== undefined ? C.clamp(o.y, 460, 1060) : 800;
    const coreR = o.coreR || 95;
    const rawCoreLabel = String(o.coreLabel || '');
    const isEarthCore =
      o.coreType === 'earth' ||
      /earth|world|globe|terra|🌍|🌎|🌏/i.test(rawCoreLabel) ||
      (o.coreColor === '#2563EB' && coreR >= 65);

    const rings = o.rings || [
      { rx: 205, ry: 205, rot: -12, bodies: [{ r: 18, kind: 'starship', color: '#38BDF8', speed: 1.6, label: 'SHIP 42' }] }
    ];

    g.save();
    g.translate(cx, cy);

    // 1. Draw Orbital Rings
    rings.forEach((rg) => {
      g.save();
      if (rg.rot) g.rotate((rg.rot * Math.PI) / 180);
      const rx = Math.min(rg.rx || 195, 330);
      const ry = Math.min(rg.ry || rx, 330);

      // Soft outer glow on orbital track
      g.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      g.lineWidth = 10;
      g.beginPath();
      g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      g.stroke();

      // Dashed engineering orbit track
      g.strokeStyle = rg.trackColor || 'rgba(148, 163, 184, 0.65)';
      g.lineWidth = 3.2;
      g.setLineDash(rg.dash || [12, 9]);
      g.beginPath();
      g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.restore();
    });

    // 2. Draw Core (True Vector Earth Globe vs. Sun/Atom Core)
    if (isEarthCore && window.MAP && typeof window.MAP.drawEarthCore === 'function') {
      window.MAP.drawEarthCore(g, t, 0, 0, coreR, {
        spin: o.spin !== undefined ? o.spin : 18,
        lon: o.lon !== undefined ? o.lon : 78
      });
      // Clean editorial badge below the Earth (strips redundant emoji inside the ball!)
      const cleanLabel = rawCoreLabel.replace(/[🌍🌎🌏]/g, '').trim();
      if (cleanLabel && cleanLabel.toUpperCase() !== 'EARTH') {
        g.restore();
        drawPillLabel(g, cx, cy + coreR + 36, cleanLabel, null, { size: 20, h: 36 });
        g.save();
        g.translate(cx, cy);
      }
    } else {
      // Sun / Star / Atomic Core with radial glow
      const glow = g.createRadialGradient(0, 0, coreR * 0.4, 0, 0, coreR * 1.35);
      glow.addColorStop(0, C.rgba(o.coreColor || '#FACC15', 0.45));
      glow.addColorStop(1, C.rgba(o.coreColor || '#FACC15', 0));
      g.fillStyle = glow;
      g.beginPath();
      g.arc(0, 0, coreR * 1.35, 0, Math.PI * 2);
      g.fill();

      C.circle(g, 0, 0, coreR, { fill: o.coreColor || '#FACC15', lw: 4.2, shade: true, shadow: true });
      if (rawCoreLabel) {
        g.font = '900 24px "Nunito", sans-serif';
        g.fillStyle = o.coreTextColor || C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(rawCoreLabel, 0, 0, coreR * 1.7);
      }
    }

    // 3. Draw Orbiting Spacecraft / Bodies + Motion Trails
    rings.forEach((rg, rIdx) => {
      const rx = Math.min(rg.rx || 195, 330);
      const ry = Math.min(rg.ry || rx, 330);
      const rotRad = ((rg.rot || 0) * Math.PI) / 180;

      (rg.bodies || []).forEach((b, bIdx) => {
        const speed = b.speed !== undefined ? b.speed : 1.35;
        const ang = (b.phase || bIdx * 2.1 + rIdx) + t * speed;

        // Motion trail arc behind the orbiting body
        g.save();
        if (rg.rot) g.rotate(rotRad);
        g.strokeStyle = C.rgba(b.color || '#38BDF8', 0.55);
        g.lineWidth = 5;
        g.lineCap = 'round';
        g.beginPath();
        const dir = speed >= 0 ? 1 : -1;
        g.ellipse(0, 0, rx, ry, 0, ang - dir * 0.65, ang, dir < 0);
        g.stroke();
        g.restore();

        const lx = Math.cos(ang) * rx;
        const ly = Math.sin(ang) * ry;
        const bx = lx * Math.cos(rotRad) - ly * Math.sin(rotRad);
        const by = lx * Math.sin(rotRad) + ly * Math.cos(rotRad);

        // Tangent velocity vector for spacecraft orientation
        const dlx = -Math.sin(ang) * rx * (speed >= 0 ? 1 : -1);
        const dly = Math.cos(ang) * ry * (speed >= 0 ? 1 : -1);
        const dbx = dlx * Math.cos(rotRad) - dly * Math.sin(rotRad);
        const dby = dlx * Math.sin(rotRad) + dly * Math.cos(rotRad);
        const tangentAngle = Math.atan2(dby, dbx);

        drawOrbitingBody(g, b, bx, by, tangentAngle, t);
      });
    });

    g.restore();
  }

  window.DIAGRAM = {
    flow,
    cutaway,
    cycle,
    scaleCompare,
    orbit
  };
})();