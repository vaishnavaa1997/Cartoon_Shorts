/**
 * MODULE 07: UNIVERSAL 9:16 HAND-DRAWN CHARTS, COUNTERS, RECEIPTS & TIMELINES (engine/07_charts.js)
 * 100% Data-Driven Vertical Editorial Cartoon Visualizations for YouTube Shorts & Instagram Reels.
 * - Auto-positions and clamps all charts inside the Golden UI Safe Box (x: 90..860, y: 260..1300)
 *   so zero bars, numbers, pie labels, or timeline cards are ever blocked by Like/Comment buttons or Titles.
 * - Snappier default animation timings (t0: 0.06s–0.08s, dur: 0.75s–0.85s) tuned for 1s–4s Shorts pacing.
 */
(function () {
  const C = window.CORE;
  const SAFE = C.SAFE || { left: 90, right: 860, top: 240, bottom: 1340, cx: 485, cy: 820, floorY: 1320 };

  // Helper: Normalize X/Y/W so charts never collide with right-side UI buttons (x > 860)
  function safeChartBox(o, defW, defH, defY) {
    let w = Math.min(o.w || defW, SAFE.right - SAFE.left - 20);
    let h = o.h || defH;
    let cx = o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx;
    let cy = o.y !== undefined ? o.y : (defY || SAFE.cy);

    if (cx - w / 2 < SAFE.left) cx = SAFE.left + w / 2;
    if (cx + w / 2 > SAFE.right) cx = SAFE.right - w / 2;
    if (cy - h / 2 < SAFE.top + 40) cy = SAFE.top + 40 + h / 2;
    if (cy + h / 2 > SAFE.bottom - 30) cy = SAFE.bottom - 30 - h / 2;

    return { cx, cy, w, h, left: cx - w / 2, top: cy - h / 2, bottom: cy + h / 2 };
  }

  /**
   * 1. HAND-DRAWN HATCHED BAR CHART (`CHART.bar(g, lt, opts)`)
   * Supports positive & negative bars (zero-baseline), diagonal hatching,
   * jagged trend arrows, and crumbling/burning crash effects inside the 9:16 Safe Box.
   *
   * Usage:
   *   CHART.bar(g, lt, {
   *     x: 485, y: 820, w: 680, h: 500,
   *     title: 'ANNUAL CASH FLOW',
   *     unit: '$', suffix: 'B',
   *     bars: [
   *       { label: '2023', value: 12.4, color: '#22C55E', hatch: true },
   *       { label: '2025', value: -31.4, color: '#EF4444', hatch: true },
   *       { label: '2026', value: -80.7, color: '#DC2626', hatch: true, fire: true }
   *     ],
   *     trendArrow: { color: '#DC2626', t0: 0.55 },
   *     t0: 0.08, dur: 0.75
   *   });
   */
  function bar(g, lt, opts) {
    const o = opts || {};
    const box = safeChartBox(o, 680, 500, 820);
    const { cx, w, h, left, top } = box;
    const bars = o.bars || o.data || [];
    const t0 = o.t0 !== undefined ? o.t0 : 0.08;
    const dur = o.dur !== undefined ? o.dur : 0.75;

    if (!bars.length) return;

    // Determine min & max values to position the zero baseline
    let minVal = 0, maxVal = 0;
    bars.forEach((b) => {
      if (b.value < minVal) minVal = b.value;
      if (b.value > maxVal) maxVal = b.value;
    });
    if (maxVal === 0 && minVal === 0) maxVal = 100;

    const totalSpan = (maxVal - minVal) || 1;
    const zeroRatio = maxVal / totalSpan;
    const zeroY = top + C.clamp(zeroRatio, 0.16, 0.86) * h;

    g.save();

    // Title
    if (o.title) {
      g.font = '900 ' + (o.titleSize || 38) + 'px "Nunito", sans-serif';
      g.fillStyle = o.titleColor || C.PAL.ink;
      g.textAlign = 'center';
      g.fillText(o.title, cx, top - 46);
    }

    // Subtle horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const gy = top + (i / 4) * h;
      C.line(g, left, gy, left + w, gy, { lw: 1.8, color: 'rgba(0,0,0,0.08)', dash: [8, 8] });
    }

    const slotW = w / bars.length;
    const barW = Math.min(o.barW || 115, slotW * 0.60);
    const barTops = [];

    bars.forEach((b, i) => {
      const bt0 = b.t0 !== undefined ? b.t0 : t0 + i * (dur / Math.max(1, bars.length)) * 0.42;
      const p = C.seg(lt, bt0, bt0 + dur * 0.65, C.ease.outBack);
      const val = b.value * p;
      const bh = (Math.abs(val) / totalSpan) * (h * 0.80);
      const bx = left + i * slotW + (slotW - barW) / 2;
      const isNeg = b.value < 0;
      const by = isNeg ? zeroY : zeroY - bh;
      const col = b.color || (isNeg ? C.PAL.red : C.PAL.green);

      barTops.push({ x: bx + barW / 2, y: isNeg ? zeroY + bh : zeroY - bh });

      if (bh > 1) {
        C.roundRect(g, bx, by, barW, bh, 6, {
          fill: col,
          hatch: b.hatch !== false,
          hatchColor: 'rgba(0,0,0,0.22)',
          lw: 4.0,
          shadow: true
        });
      }

      // Optional flames on crashing/hot bar
      if (b.fire && p > 0.55 && window.PROP) {
        const fy = isNeg ? by + bh : by;
        window.PROP.build(g, {
          x: bx + barW / 2,
          y: fy,
          shadow: false,
          t: lt,
          parts: [
            { type: 'flame', x: -18, y: 0, r: 22 },
            { type: 'flame', x: 16, y: 4, r: 18 },
            { type: 'flame', x: 0, y: -6, r: 26 }
          ]
        });
      }

      // Value label (handwritten style)
      if (p > 0.1) {
        const dispVal = (b.value * C.clamp(p, 0, 1)).toFixed(b.decimals !== undefined ? b.decimals : (Math.abs(b.value) % 1 !== 0 ? 1 : 0));
        const sign = b.value < 0 ? '-' : (b.plus ? '+' : '');
        const valStr = b.displayValue || (sign + (o.unit || '') + Math.abs(dispVal) + (o.suffix || ''));

        g.font = '700 ' + (o.valueSize || 42) + 'px "Caveat", "Kalam", cursive';
        g.fillStyle = b.valueColor || col;
        g.textAlign = 'center';
        g.textBaseline = isNeg ? 'top' : 'bottom';
        g.fillText(valStr, bx + barW / 2, isNeg ? by + bh + 12 : by - 10);
      }

      // Category label on X-axis
      if (b.label) {
        g.font = '800 ' + (o.labelSize || 24) + 'px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = isNeg ? 'bottom' : 'top';
        g.fillText(b.label, bx + barW / 2, isNeg ? zeroY - 12 : zeroY + 14);
      }
    });

    // Bold L-Axis & Zero Baseline
    C.line(g, left, top - 15, left, top + h + 10, { lw: 5, color: C.PAL.ink });
    C.line(g, left - 10, zeroY, left + w + 12, zeroY, { lw: 5, color: C.PAL.ink });

    // Optional Trend Arrow across bar tops
    if (o.trendArrow && barTops.length >= 2) {
      const ta = typeof o.trendArrow === 'object' ? o.trendArrow : {};
      const ap = C.seg(lt, ta.t0 || (t0 + dur * 0.45), (ta.t0 || (t0 + dur * 0.45)) + 0.42, C.ease.outCubic);
      const first = barTops[0];
      const last = barTops[barTops.length - 1];
      C.arrow(g, first.x, first.y - 35, last.x, last.y - 35, {
        p: ap,
        lw: 6,
        headSize: 22,
        color: ta.color || (last.y > first.y ? C.PAL.red : C.PAL.green)
      });
    }

    g.restore();
  }

  /**
   * 2. JAGGED EDITORIAL LINE GRAPH (`CHART.line(g, lt, opts)`)
   * Supports multi-series lines, shaded area fills, vertex dots, and anomaly callouts in 9:16 Safe Box.
   */
  function line(g, lt, opts) {
    const o = opts || {};
    const box = safeChartBox(o, 680, 480, 820);
    const { cx, w, h, left, top, bottom } = box;
    const t0 = o.t0 !== undefined ? o.t0 : 0.08;
    const dur = o.dur !== undefined ? o.dur : 0.85;
    const p = C.seg(lt, t0, t0 + dur, C.ease.outCubic);

    const seriesList = o.series || [{ values: o.values || [10, 40, 30, 80, 20], color: o.color || C.PAL.green, area: true }];
    let minV = o.min !== undefined ? o.min : Infinity;
    let maxV = o.max !== undefined ? o.max : -Infinity;
    seriesList.forEach((s) => {
      (s.values || []).forEach((v) => {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      });
    });
    if (minV === Infinity) { minV = 0; maxV = 100; }
    const span = (maxV - minV) || 1;

    g.save();

    if (o.title) {
      g.font = '900 ' + (o.titleSize || 38) + 'px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.fillText(o.title, cx, top - 45);
    }

    // Grid
    for (let i = 0; i <= 4; i++) {
      const gy = top + (i / 4) * h;
      C.line(g, left, gy, left + w, gy, { lw: 1.8, color: 'rgba(0,0,0,0.08)', dash: [8, 8] });
    }

    // X-Axis Labels
    if (Array.isArray(o.xLabels)) {
      g.font = '800 22px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      o.xLabels.forEach((lbl, i) => {
        const lx = left + (i / Math.max(1, o.xLabels.length - 1)) * w;
        g.fillText(lbl, lx, bottom + 34);
      });
    }

    seriesList.forEach((s) => {
      const vals = s.values || [];
      if (vals.length < 2) return;
      const col = s.color || C.PAL.red;
      const pts = vals.map((v, i) => ({
        x: left + (i / (vals.length - 1)) * w,
        y: bottom - ((v - minV) / span) * (h * 0.84) - h * 0.06
      }));

      g.save();
      g.beginPath();
      g.rect(left, top - 30, w * p, h + 60);
      g.clip();

      // Area fill underneath line
      if (s.area !== false) {
        g.beginPath();
        g.moveTo(pts[0].x, bottom);
        pts.forEach((pt) => g.lineTo(pt.x, pt.y));
        g.lineTo(pts[pts.length - 1].x, bottom);
        g.closePath();
        g.fillStyle = C.rgba(col, 0.20);
        g.fill();
      }

      // Thick jagged line
      C.inkStyle(g, s.lw || 6.5, col);
      g.beginPath();
      pts.forEach((pt, idx) => {
        if (idx === 0) g.moveTo(pt.x, pt.y);
        else g.lineTo(pt.x, pt.y);
      });
      g.stroke();

      // Vertex dots
      pts.forEach((pt) => {
        C.circle(g, pt.x, pt.y, 7.5, { fill: '#FFFFFF', stroke: col, lw: 3.5 });
      });

      g.restore();

      // Anomaly / Event Pin
      if (s.anomalyIdx !== undefined && pts[s.anomalyIdx] && p >= s.anomalyIdx / (vals.length - 1)) {
        const apt = pts[s.anomalyIdx];
        C.circle(g, apt.x, apt.y, 12, { fill: col, stroke: C.PAL.ink, lw: 3.8 });
        if (s.anomalyLabel && window.TEXT) {
          const bx = C.clamp(apt.x, SAFE.left + 80, SAFE.right - 80);
          window.TEXT.badge(g, lt, {
            x: bx,
            y: apt.y - 48,
            text: s.anomalyLabel,
            fill: col,
            color: '#FFFFFF',
            size: 22,
            t0: t0 + 0.22
          });
        }
      }
    });

    // Axes
    C.line(g, left, top - 15, left, bottom, { lw: 5, color: C.PAL.ink });
    C.line(g, left, bottom, left + w + 12, bottom, { lw: 5, color: C.PAL.ink });

    g.restore();
  }

  /**
   * 3. EXPLODED PIE / DONUT CHART (`CHART.pie(g, lt, opts)`)
   * Centered in the 9:16 Safe Box with label clamping so right-side labels never hit Like/Comment icons.
   */
  function pie(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx;
    const cy = o.y !== undefined ? o.y : SAFE.cy;
    const r = o.r || 200;
    const t0 = o.t0 !== undefined ? o.t0 : 0.08;
    const p = C.seg(lt, t0, t0 + (o.dur || 0.78), C.ease.outCubic);
    const slices = o.slices || [];
    const total = slices.reduce((acc, s) => acc + (s.value || 1), 0) || 1;

    g.save();

    if (o.title) {
      g.font = '900 ' + (o.titleSize || 38) + 'px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.fillText(o.title, cx, cy - r - 76);
    }

    let curAngle = -Math.PI / 2;

    slices.forEach((s, idx) => {
      const span = ((s.value || 1) / total) * Math.PI * 2 * p;
      const midA = curAngle + span / 2;
      const explode = s.explode ? 22 * p : 0;
      const sx = cx + Math.cos(midA) * explode;
      const sy = cy + Math.sin(midA) * explode;

      g.beginPath();
      g.moveTo(sx, sy);
      g.arc(sx, sy, r, curAngle, curAngle + span);
      g.closePath();
      g.fillStyle = s.color || ['#3B82F6', '#22C55E', '#FACC15', '#EF4444', '#A855F7'][idx % 5];
      g.fill();
      C.inkStyle(g, 4.0, C.PAL.ink);
      g.stroke();

      if (s.label && p > 0.55) {
        g.font = '800 24px "Nunito", sans-serif';
        const tw = g.measureText(s.label).width;
        let lx = sx + Math.cos(midA) * (r + 44);
        const ly = sy + Math.sin(midA) * (r + 44);
        const isRight = Math.cos(midA) >= 0;

        // Clamp so label never crosses SAFE.right (860) or SAFE.left (90)
        if (isRight && lx + tw > SAFE.right - 10) lx = SAFE.right - 10 - tw;
        if (!isRight && lx - tw < SAFE.left + 10) lx = SAFE.left + 10 + tw;

        g.fillStyle = C.PAL.ink;
        g.textAlign = isRight ? 'left' : 'right';
        g.textBaseline = 'middle';
        g.fillText(s.label, lx, ly);
      }

      curAngle += span;
    });

    if (o.donut) {
      C.circle(g, cx, cy, r * (typeof o.donut === 'number' ? o.donut : 0.48), {
        fill: o.holeColor || C.PAL.studioWall,
        lw: 4.0
      });
    }
    g.restore();
  }

  /**
   * 4. LIVE COUNTING SCOREBOARD / BIG NUMBER TICKER (`CHART.counter(g, lt, opts)`)
   * Defaults to x = 485, y = 760 inside the 9:16 Safe Zone.
   */
  function counter(g, lt, opts) {
    const o = opts || {};
    const cw = Math.min(o.w || 580, SAFE.right - SAFE.left - 20);
    const ch = o.h || 210;
    let x = o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx;
    let y = o.y !== undefined ? o.y : 760;

    if (x - cw / 2 < SAFE.left) x = SAFE.left + cw / 2;
    if (x + cw / 2 > SAFE.right) x = SAFE.right - cw / 2;

    const t0 = o.t0 !== undefined ? o.t0 : 0.05;
    const dur = o.dur !== undefined ? o.dur : 0.75;
    const p = C.seg(lt, t0, t0 + dur, C.ease.outCubic);
    const val = C.lerp(o.from || 0, o.to !== undefined ? o.to : 100, p);
    const dec = o.decimals !== undefined ? o.decimals : 0;
    const formatted = (o.prefix || '') + val.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (o.suffix || '');

    g.save();
    if (o.card) {
      C.roundRect(g, x - cw / 2, y - ch / 2, cw, ch, 16, {
        fill: o.bg || '#FFFFFF',
        hatch: o.hatch,
        lw: 4.2,
        shadow: true
      });
    }

    if (o.label) {
      g.font = '800 ' + (o.labelSize || 28) + 'px "Nunito", sans-serif';
      g.fillStyle = o.labelColor || '#475569';
      g.textAlign = 'center';
      g.fillText(o.label, x, y - (o.size || 96) * 0.68);
    }

    g.font = '700 ' + (o.size || 96) + 'px ' + (o.font || '"Caveat", "Kalam", cursive');
    g.fillStyle = o.color || C.PAL.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(formatted, x, y);

    if (o.sub) {
      g.font = '700 26px "Nunito", sans-serif';
      g.fillStyle = o.subColor || '#64748B';
      g.fillText(o.sub, x, y + (o.size || 96) * 0.65);
    }
    g.restore();
  }

  /**
   * 5. ENDLESS UNROLLING RECEIPT / BILL / LEDGER (`CHART.receipt(g, lt, opts)`)
   * Naturally vertical — unrolls from topY = 320 down to y = 1160 inside the 9:16 Safe Box.
   */
  function receipt(g, lt, opts) {
    const o = opts || {};
    const w = Math.min(o.w || 460, SAFE.right - SAFE.left - 40);
    let x = o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx;
    if (x + w / 2 > SAFE.right) x = SAFE.right - w / 2;
    if (x - w / 2 < SAFE.left) x = SAFE.left + w / 2;

    const topY = o.topY !== undefined ? Math.max(SAFE.top + 20, o.topY) : 320;
    const maxH = Math.min(o.h || 820, SAFE.bottom - topY - 30);
    const p = C.seg(lt, o.t0 || 0.08, (o.t0 || 0.08) + (o.dur || 0.85), C.ease.outCubic);
    const curH = Math.max(95, maxH * p);
    const items = o.items || [];

    g.save();
    // Paper strip with zig-zag bottom tear
    g.fillStyle = '#FAF7F0';
    g.strokeStyle = C.PAL.ink;
    g.lineWidth = 4.0;
    g.beginPath();
    g.moveTo(x - w / 2, topY);
    g.lineTo(x + w / 2, topY);
    g.lineTo(x + w / 2, topY + curH);
    const teeth = 12;
    const step = w / teeth;
    for (let i = teeth; i >= 0; i--) {
      const tx = x - w / 2 + i * step;
      const ty = topY + curH + (i % 2 === 0 ? 0 : -14);
      g.lineTo(tx, ty);
    }
    g.closePath();
    g.fill();
    g.stroke();

    // Clip content to unrolled height
    g.clip();

    g.font = '900 30px "Space Mono", monospace';
    g.fillStyle = C.PAL.ink;
    g.textAlign = 'center';
    g.fillText(o.title || 'INVOICE / RECEIPT', x, topY + 50);
    C.line(g, x - w / 2 + 28, topY + 76, x + w / 2 - 28, topY + 76, { lw: 2.5, dash: [8, 6] });

    g.font = '700 22px "Space Mono", monospace';
    items.forEach((it, idx) => {
      const iy = topY + 120 + idx * 52;
      g.textAlign = 'left';
      g.fillStyle = C.PAL.ink;
      g.fillText(it.label || '', x - w / 2 + 32, iy);
      g.textAlign = 'right';
      g.fillStyle = it.color || C.PAL.ink;
      g.fillText(it.cost || '', x + w / 2 - 32, iy);
    });

    if (o.total) {
      const ty = topY + maxH - 72;
      C.line(g, x - w / 2 + 28, ty - 34, x + w / 2 - 28, ty - 34, { lw: 3 });
      g.fillStyle = C.PAL.highlighter;
      g.fillRect(x - w / 2 + 24, ty - 22, w - 48, 44);
      g.font = '900 28px "Space Mono", monospace';
      g.fillStyle = C.PAL.red;
      g.textAlign = 'center';
      g.fillText('TOTAL: ' + o.total, x, ty + 8);
    }

    // Bottom paper roll cylinder
    C.roundRect(g, x - w / 2 - 8, topY + curH - 18, w + 16, 28, 14, { fill: '#E2E8F0', lw: 3.5 });
    g.restore();
  }

  /**
   * 6. 9:16 SAFE-ZONE TIMELINE (`CHART.timeline(g, lt, opts)`)
   * Supports both Vertical Top-to-Bottom cascading timelines (`vertical: true` or >= 4 events)
   * and compact Horizontal timelines clamped inside x: 110..830.
   */
  function timeline(g, lt, opts) {
    const o = opts || {};
    const events = o.events || [];
    const p = C.seg(lt, o.t0 || 0.08, (o.t0 || 0.08) + (o.dur || 0.80), C.ease.outCubic);
    const useVertical = o.vertical !== undefined ? o.vertical : events.length >= 4;

    g.save();

    if (useVertical) {
      // Vertical Top-to-Bottom Shorts Timeline (Cleo Abram / Smart Nonsense style)
      const cx = o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx;
      const y0 = o.y0 !== undefined ? o.y0 : 340;
      const y1 = o.y1 !== undefined ? o.y1 : 1220;

      C.arrow(g, cx, y0, cx, y1, { p: p, lw: 6, color: C.PAL.ink });

      events.forEach((ev, i) => {
        const u = events.length > 1 ? i / (events.length - 1) : 0.5;
        if (p < u) return;
        const ey = C.lerp(y0 + 40, y1 - 60, u);
        const side = i % 2 === 0 ? -1 : 1;
        const cardW = 240, cardH = 86;
        const cardX = C.clamp(cx + side * 195, SAFE.left + cardW / 2 + 6, SAFE.right - cardW / 2 - 6);

        C.line(g, cx, ey, cardX, ey, { lw: 3.5, dash: [6, 6] });
        C.circle(g, cx, ey, 12, { fill: ev.color || '#FACC15', lw: 3.8 });

        C.roundRect(g, cardX - cardW / 2, ey - cardH / 2, cardW, cardH, 12, {
          fill: '#FFFFFF',
          lw: 3.5,
          shadow: true
        });
        g.font = '900 24px "Fredoka", sans-serif';
        g.fillStyle = ev.color || C.PAL.red;
        g.textAlign = 'center';
        g.fillText(ev.year || ev.date || '', cardX, ey - 10);

        g.font = '700 20px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.fillText(ev.label || '', cardX, ey + 20);
      });
    } else {
      // Compact Horizontal Timeline clamped inside x: 110..830
      const y = o.y !== undefined ? o.y : SAFE.cy;
      const x0 = Math.max(SAFE.left + 20, o.x0 !== undefined ? o.x0 : 115);
      const x1 = Math.min(SAFE.right - 20, o.x1 !== undefined ? o.x1 : 835);

      C.arrow(g, x0, y, x1, y, { p: p, lw: 6, color: C.PAL.ink });

      events.forEach((ev, i) => {
        const u = events.length > 1 ? i / (events.length - 1) : 0.5;
        if (p < u) return;
        const cardW = 200, cardH = 84;
        const ex = C.clamp(C.lerp(x0 + 70, x1 - 70, u), SAFE.left + cardW / 2 + 6, SAFE.right - cardW / 2 - 6);
        const above = i % 2 === 0;
        const cardY = above ? y - 115 : y + 115;

        C.line(g, ex, y, ex, cardY, { lw: 3.5, dash: [6, 6] });
        C.circle(g, ex, y, 12, { fill: ev.color || '#FACC15', lw: 3.8 });

        C.roundRect(g, ex - cardW / 2, cardY - cardH / 2, cardW, cardH, 12, {
          fill: '#FFFFFF',
          lw: 3.5,
          shadow: true
        });
        g.font = '900 24px "Fredoka", sans-serif';
        g.fillStyle = ev.color || C.PAL.red;
        g.textAlign = 'center';
        g.fillText(ev.year || ev.date || '', ex, cardY - 10);

        g.font = '700 20px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.fillText(ev.label || '', ex, cardY + 20);
      });
    }

    g.restore();
  }

  window.CHART = {
    bar,
    line,
    pie,
    counter,
    receipt,
    timeline
  };
})();