/**
 * MODULE 07: UNIVERSAL 9:16 HAND-DRAWN CHARTS, COUNTERS, RECEIPTS & TIMELINES (engine/07_charts.js)
 * 100% Data-Driven Vertical Editorial Cartoon Visualizations for YouTube Shorts & Instagram Reels.
 * - Auto-positions and clamps all charts inside the camera-aware Golden UI Safe Box (x: 90..860)
 * - Auto-detects dark backgrounds ('blueprint', 'slate', 'noir', 'danger', 'space') and switches
 *   titles, category labels, and axes to high-contrast white with ink halos so labels are NEVER invisible.
 */
(function () {
  const C = window.CORE;
  const SAFE = C.SAFE || { left: 90, right: 860, top: 240, bottom: 1340, cx: 485, cy: 820, floorY: 1320 };

  // Helper: Normalize X/Y/W inside the visible camera-aware Safe Box
  function safeChartBox(o, defW, defH, defY) {
    const sbX = C.getSafeBoundsX ? C.getSafeBoundsX() : { minX: SAFE.left, maxX: SAFE.right };
    const availW = Math.max(360, sbX.maxX - sbX.minX - 24);
    const w = Math.min(o.w || defW, availW);
    const h = o.h || defH;
    const rawX = o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx;
    const rawY = o.y !== undefined ? o.y : (defY || SAFE.cy);

    const cx = C.safeX(rawX, w / 2 + 10);
    const cy = C.safeY(rawY, h / 2 + 24);

    return { cx, cy, w, h, left: cx - w / 2, top: cy - h / 2, bottom: cy + h / 2 };
  }

  // Helper: Detect dark background and return high-contrast theme colors
  function getChartContrast(g, cx, cy, o) {
    const darkBg = o.dark !== undefined ? o.dark : (C.isCanvasDarkAt ? C.isCanvasDarkAt(g, cx, cy) : false);
    return {
      darkBg,
      ink: darkBg ? '#F8FAFC' : C.PAL.ink,
      axis: darkBg ? '#E2E8F0' : C.PAL.ink,
      grid: darkBg ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
      halo: darkBg ? 'rgba(15,23,42,0.90)' : 'rgba(255,255,255,0.88)'
    };
  }

  /**
   * 1. HAND-DRAWN HATCHED BAR CHART (`CHART.bar(g, lt, opts)`)
   */
  function bar(g, lt, opts) {
    const o = opts || {};
    const box = safeChartBox(o, 660, 480, 820);
    const { cx, cy, w, h, left, top } = box;
    const bars = o.bars || o.data || [];
    const t0 = o.t0 !== undefined ? o.t0 : 0.08;
    const dur = o.dur !== undefined ? o.dur : 0.75;

    if (!bars.length) return;

    const theme = getChartContrast(g, cx, cy, o);

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
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      C.drawContrastText(g, o.title, cx, top - 46, {
        fill: o.titleColor || theme.ink,
        darkBg: theme.darkBg,
        haloW: 6
      });
    }

    // Subtle horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const gy = top + (i / 4) * h;
      C.line(g, left, gy, left + w, gy, { lw: 1.8, color: theme.grid, dash: [8, 8] });
    }

    const slotW = w / bars.length;
    const barW = Math.min(o.barW || 115, slotW * 0.58);
    const barTops = [];

    bars.forEach((b, i) => {
      const bt0 = b.t0 !== undefined ? b.t0 : t0 + i * (dur / Math.max(1, bars.length)) * 0.42;
      const p = C.seg(lt, bt0, bt0 + dur * 0.65, C.ease.outBack);
      const val = b.value * p;
      const bh = (Math.abs(val) / totalSpan) * (h * 0.78);
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

      // Value label (handwritten style with contrast halo)
      if (p > 0.1) {
        const dispVal = (b.value * C.clamp(p, 0, 1)).toFixed(b.decimals !== undefined ? b.decimals : (Math.abs(b.value) % 1 !== 0 ? 1 : 0));
        const sign = b.value < 0 ? '-' : (b.plus ? '+' : '');
        const valStr = b.displayValue || (sign + (o.unit || '') + Math.abs(dispVal) + (o.suffix || ''));

        g.font = '700 ' + (o.valueSize || 42) + 'px "Caveat", "Kalam", cursive';
        g.textAlign = 'center';
        g.textBaseline = isNeg ? 'top' : 'bottom';
        C.drawContrastText(g, valStr, bx + barW / 2, isNeg ? by + bh + 12 : by - 10, {
          fill: b.valueColor || (theme.darkBg && C.isDarkColor(col) ? '#FACC15' : col),
          darkBg: theme.darkBg,
          haloW: 6
        });
      }

      // Category label on X-axis (auto-contrasted so never invisible on dark blue/slate!)
      if (b.label) {
        let lblSize = o.labelSize || 23;
        g.font = '800 ' + lblSize + 'px "Nunito", sans-serif';
        const maxLblW = slotW - 8;
        const lw = g.measureText(b.label).width;
        if (lw > maxLblW && lw > 0) {
          lblSize = Math.max(15, Math.floor(lblSize * (maxLblW / lw)));
          g.font = '800 ' + lblSize + 'px "Nunito", sans-serif';
        }
        g.textAlign = 'center';
        g.textBaseline = isNeg ? 'bottom' : 'top';
        C.drawContrastText(g, b.label, bx + barW / 2, isNeg ? zeroY - 12 : zeroY + 14, {
          fill: b.labelColor || theme.ink,
          darkBg: theme.darkBg,
          haloW: 5
        });
      }
    });

    // Bold L-Axis & Zero Baseline
    C.line(g, left, top - 15, left, top + h + 10, { lw: 5, color: theme.axis });
    C.line(g, left - 10, zeroY, left + w + 12, zeroY, { lw: 5, color: theme.axis });

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
   */
  function line(g, lt, opts) {
    const o = opts || {};
    const box = safeChartBox(o, 660, 460, 820);
    const { cx, cy, w, h, left, top, bottom } = box;
    const t0 = o.t0 !== undefined ? o.t0 : 0.08;
    const dur = o.dur !== undefined ? o.dur : 0.85;
    const p = C.seg(lt, t0, t0 + dur, C.ease.outCubic);
    const theme = getChartContrast(g, cx, cy, o);

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
      g.textAlign = 'center';
      C.drawContrastText(g, o.title, cx, top - 45, {
        fill: o.titleColor || theme.ink,
        darkBg: theme.darkBg,
        haloW: 6
      });
    }

    // Grid
    for (let i = 0; i <= 4; i++) {
      const gy = top + (i / 4) * h;
      C.line(g, left, gy, left + w, gy, { lw: 1.8, color: theme.grid, dash: [8, 8] });
    }

    // X-Axis Labels
    if (Array.isArray(o.xLabels)) {
      g.font = '800 22px "Nunito", sans-serif';
      g.textAlign = 'center';
      o.xLabels.forEach((lbl, i) => {
        const lx = left + (i / Math.max(1, o.xLabels.length - 1)) * w;
        C.drawContrastText(g, lbl, lx, bottom + 34, {
          fill: theme.ink,
          darkBg: theme.darkBg,
          haloW: 5
        });
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
        g.fillStyle = C.rgba(col, 0.22);
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
          const bx = C.safeX(apt.x, 90);
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
    C.line(g, left, top - 15, left, bottom, { lw: 5, color: theme.axis });
    C.line(g, left, bottom, left + w + 12, bottom, { lw: 5, color: theme.axis });

    g.restore();
  }

  /**
   * 3. EXPLODED PIE / DONUT CHART (`CHART.pie(g, lt, opts)`)
   */
  function pie(g, lt, opts) {
    const o = opts || {};
    const r = o.r || 195;
    const cx = C.safeX(o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx, r + 90);
    const cy = C.safeY(o.y !== undefined ? o.y : SAFE.cy, r + 80);
    const t0 = o.t0 !== undefined ? o.t0 : 0.08;
    const p = C.seg(lt, t0, t0 + (o.dur || 0.78), C.ease.outCubic);
    const slices = o.slices || [];
    const total = slices.reduce((acc, s) => acc + (s.value || 1), 0) || 1;
    const theme = getChartContrast(g, cx, cy, o);

    g.save();

    if (o.title) {
      g.font = '900 ' + (o.titleSize || 38) + 'px "Nunito", sans-serif';
      g.textAlign = 'center';
      C.drawContrastText(g, o.title, cx, cy - r - 76, {
        fill: o.titleColor || theme.ink,
        darkBg: theme.darkBg,
        haloW: 6
      });
    }

    let curAngle = -Math.PI / 2;
    const sbX = C.getSafeBoundsX ? C.getSafeBoundsX() : { minX: SAFE.left, maxX: SAFE.right };

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
        g.font = '800 23px "Nunito", sans-serif';
        const tw = g.measureText(s.label).width;
        let lx = sx + Math.cos(midA) * (r + 42);
        const ly = sy + Math.sin(midA) * (r + 42);
        const isRight = Math.cos(midA) >= 0;

        if (isRight && lx + tw > sbX.maxX - 10) lx = sbX.maxX - 10 - tw;
        if (!isRight && lx - tw < sbX.minX + 10) lx = sbX.minX + 10 + tw;

        g.textAlign = isRight ? 'left' : 'right';
        g.textBaseline = 'middle';
        C.drawContrastText(g, s.label, lx, ly, {
          fill: theme.ink,
          darkBg: theme.darkBg,
          haloW: 5
        });
      }

      curAngle += span;
    });

    if (o.donut) {
      C.circle(g, cx, cy, r * (typeof o.donut === 'number' ? o.donut : 0.48), {
        fill: o.holeColor || (theme.darkBg ? '#1E293B' : C.PAL.studioWall),
        lw: 4.0
      });
    }
    g.restore();
  }

  /**
   * 4. LIVE COUNTING SCOREBOARD / BIG NUMBER TICKER (`CHART.counter(g, lt, opts)`)
   */
  function counter(g, lt, opts) {
    const o = opts || {};
    const sbX = C.getSafeBoundsX ? C.getSafeBoundsX() : { minX: SAFE.left, maxX: SAFE.right };
    const cw = Math.min(o.w || 560, sbX.maxX - sbX.minX - 24);
    const ch = o.h || 210;
    const rawX = o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx;
    const rawY = o.y !== undefined ? o.y : 760;

    const x = C.safeX(rawX, cw / 2 + 10);
    const y = C.safeY(rawY, ch / 2 + 10);

    const t0 = o.t0 !== undefined ? o.t0 : 0.05;
    const dur = o.dur !== undefined ? o.dur : 0.75;
    const p = C.seg(lt, t0, t0 + dur, C.ease.outCubic);
    const val = C.lerp(o.from || 0, o.to !== undefined ? o.to : 100, p);
    const dec = o.decimals !== undefined ? o.decimals : 0;
    const formatted = (o.prefix || '') + val.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (o.suffix || '');

    const theme = getChartContrast(g, x, y, o);

    g.save();
    if (o.card !== false) {
      C.roundRect(g, x - cw / 2, y - ch / 2, cw, ch, 16, {
        fill: o.bg || '#FFFFFF',
        hatch: o.hatch,
        lw: 4.2,
        shadow: true
      });
    }

    const onCard = o.card !== false;

    if (o.label) {
      let lblSize = o.labelSize || 27;
      g.font = '800 ' + lblSize + 'px "Nunito", sans-serif';
      const lw = g.measureText(o.label).width;
      if (lw > cw - 36 && lw > 0) {
        lblSize = Math.max(18, Math.floor(lblSize * ((cw - 36) / lw)));
        g.font = '800 ' + lblSize + 'px "Nunito", sans-serif';
      }
      g.fillStyle = o.labelColor || (onCard ? '#475569' : theme.ink);
      g.textAlign = 'center';
      g.fillText(o.label, x, y - (o.size || 92) * 0.66);
    }

    let numSize = o.size || 92;
    const numFont = o.font || '"Caveat", "Kalam", cursive';
    g.font = '700 ' + numSize + 'px ' + numFont;
    const nw = g.measureText(formatted).width;
    if (nw > cw - 32 && nw > 0) {
      numSize = Math.max(46, Math.floor(numSize * ((cw - 32) / nw)));
      g.font = '700 ' + numSize + 'px ' + numFont;
    }

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (onCard) {
      g.fillStyle = o.color || C.PAL.ink;
      g.fillText(formatted, x, y);
    } else {
      C.drawContrastText(g, formatted, x, y, {
        fill: o.color || theme.ink,
        darkBg: theme.darkBg,
        haloW: 7
      });
    }

    if (o.sub) {
      g.font = '700 25px "Nunito", sans-serif';
      g.fillStyle = o.subColor || (onCard ? '#64748B' : theme.ink);
      g.fillText(o.sub, x, y + (o.size || 92) * 0.64);
    }
    g.restore();
  }

  /**
   * 5. ENDLESS UNROLLING RECEIPT / BILL / LEDGER (`CHART.receipt(g, lt, opts)`)
   */
  function receipt(g, lt, opts) {
    const o = opts || {};
    const sbX = C.getSafeBoundsX ? C.getSafeBoundsX() : { minX: SAFE.left, maxX: SAFE.right };
    const w = Math.min(o.w || 460, sbX.maxX - sbX.minX - 40);
    const rawX = o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx;
    const x = C.safeX(rawX, w / 2 + 12);

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
   */
  function timeline(g, lt, opts) {
    const o = opts || {};
    const events = o.events || [];
    const p = C.seg(lt, o.t0 || 0.08, (o.t0 || 0.08) + (o.dur || 0.80), C.ease.outCubic);
    const useVertical = o.vertical !== undefined ? o.vertical : events.length >= 4;
    const theme = getChartContrast(g, SAFE.cx, SAFE.cy, o);

    g.save();

    if (useVertical) {
      const cx = C.safeX(o.x !== undefined ? (o.x === 960 ? SAFE.cx : o.x) : SAFE.cx, 180);
      const y0 = o.y0 !== undefined ? o.y0 : 340;
      const y1 = o.y1 !== undefined ? o.y1 : 1220;

      C.arrow(g, cx, y0, cx, y1, { p: p, lw: 6, color: theme.axis });

      events.forEach((ev, i) => {
        const u = events.length > 1 ? i / (events.length - 1) : 0.5;
        if (p < u) return;
        const ey = C.lerp(y0 + 40, y1 - 60, u);
        const side = i % 2 === 0 ? -1 : 1;
        const cardW = 240, cardH = 86;
        const cardX = C.safeX(cx + side * 195, cardW / 2 + 8);

        C.line(g, cx, ey, cardX, ey, { lw: 3.5, color: theme.axis, dash: [6, 6] });
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
      const y = o.y !== undefined ? o.y : SAFE.cy;
      const sbX = C.getSafeBoundsX ? C.getSafeBoundsX() : { minX: SAFE.left, maxX: SAFE.right };
      const x0 = Math.max(sbX.minX + 20, o.x0 !== undefined ? o.x0 : 115);
      const x1 = Math.min(sbX.maxX - 20, o.x1 !== undefined ? o.x1 : 835);

      C.arrow(g, x0, y, x1, y, { p: p, lw: 6, color: theme.axis });

      events.forEach((ev, i) => {
        const u = events.length > 1 ? i / (events.length - 1) : 0.5;
        if (p < u) return;
        const cardW = 200, cardH = 84;
        const ex = C.safeX(C.lerp(x0 + 70, x1 - 70, u), cardW / 2 + 8);
        const above = i % 2 === 0;
        const cardY = above ? y - 115 : y + 115;

        C.line(g, ex, y, ex, cardY, { lw: 3.5, color: theme.axis, dash: [6, 6] });
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