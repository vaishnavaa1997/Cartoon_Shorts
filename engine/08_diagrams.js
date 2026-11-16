/**
 * MODULE 08: 9:16 VERTICAL SCIENCE, SPACE, HISTORY & TECH BREAKDOWN CREATOR (engine/08_diagrams.js)
 * Built for 1080x1920 vertical flowcharts (top-to-bottom), X-ray cutaways, cycles,
 * full-height scale comparisons (floorY = 1320), and orbital systems inside C.SAFE.
 */
(function () {
  const C = window.CORE;

  /**
   * 1. NODE & ANIMATED PIPE/PACKET FLOW NETWORK (`DIAGRAM.flow(g, lt, opts)`)
   * Auto-clamps nodes inside C.SAFE (x: 110..840, y: 270..1300) so horizontal or
   * vertical flowcharts never get clipped by the right-side Like/Comment buttons!
   */
  function flow(g, lt, opts) {
    const o = opts || {};
    const rawNodes = o.nodes || [];
    const links = o.links || [];
    const nodeMap = {};

    // Normalize node coordinates into 9:16 Safe Box (auto-stacks vertically if legacy wide X coordinates are detected)
    const isLegacyWide = rawNodes.some((n) => n.x > 880);
    const nodes = rawNodes.map((n, idx) => {
      const copy = Object.assign({}, n);
      if (isLegacyWide) {
        copy.x = C.SAFE.cx;
        copy.y = C.lerp(420, 1160, rawNodes.length > 1 ? idx / (rawNodes.length - 1) : 0.5);
      } else {
        copy.x = C.safeX(n.x !== undefined ? n.x : C.SAFE.cx, (n.w || 220) / 2);
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
          lw: lk.lw || 4.5,
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
            lw: 2.5
          });
        }
      }

      if (lk.label) {
        const isVert = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        const mx = isVert ? (x0 + x1) / 2 + 95 : (x0 + x1) / 2;
        const my = isVert ? (y0 + y1) / 2 : (y0 + y1) / 2 - 26;
        g.font = '800 20px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'center';
        g.fillText(lk.label, C.clamp(mx, 120, 820), my);
      }
    });

    nodes.forEach((n, idx) => {
      const sc = C.pop(lt, n.t0 !== undefined ? n.t0 : idx * 0.08, 0.25);
      if (sc <= 0.01) return;
      const w = n.w || 260, h = n.h || 115;

      g.save();
      g.translate(n.x, n.y);
      g.scale(sc, sc);

      if (n.shape === 'circle') {
        C.circle(g, 0, 0, w / 2, { fill: n.color || '#FFFFFF', lw: 4, shadow: true });
      } else {
        C.roundRect(g, -w / 2, -h / 2, w, h, n.rad || 14, {
          fill: n.color || '#FFFFFF',
          hatch: n.hatch,
          lw: 4,
          shadow: true
        });
      }

      if (n.parts && window.CHAR) {
        window.CHAR.renderParts(g, n.parts, lt);
      }

      if (n.label) {
        g.font = '900 ' + (n.size || 26) + 'px "Nunito", sans-serif';
        g.fillStyle = n.textColor || C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(n.label, 0, n.sub ? -14 : 0);
      }
      if (n.sub) {
        g.font = '700 19px "Space Mono", monospace';
        g.fillStyle = '#475569';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(n.sub, 0, 18);
      }
      g.restore();
    });

    g.restore();
  }

  /**
   * 2. UNIVERSAL X-RAY / EXPLODED LAYER CUTAWAY CREATOR (`DIAGRAM.cutaway(g, lt, opts)`)
   * Framed inside 9:16 Safe Box (x = 400..470) with leader callouts inside x <= 850.
   */
  function cutaway(g, lt, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? C.clamp(o.x, 300, 520) : 390;
    const cy = o.y !== undefined ? C.clamp(o.y, 480, 980) : 780;
    const explode = o.explode !== undefined ? o.explode : C.seg(lt, o.t0 || 0.15, (o.t0 || 0.15) + 0.65, C.ease.outCubic);
    const layers = o.layers || [];
    const gap = (o.gap || 64) * explode;

    g.save();
    const totalH = layers.reduce((acc, l) => acc + (l.h || 72), 0) + Math.max(0, layers.length - 1) * gap;
    let curY = cy - totalH / 2;

    layers.forEach((l, idx) => {
      const lw = Math.min(l.w || 340, 400);
      const lh = l.h || 72;
      const ly = curY + lh / 2;
      const isDimmed = o.isolateIdx !== undefined && o.isolateIdx !== null && o.isolateIdx !== idx;

      g.save();
      g.globalAlpha = isDimmed ? 0.25 : 1.0;

      C.roundRect(g, cx - lw / 2, curY, lw, lh, l.rad || 10, {
        fill: l.color || '#CBD5E1',
        hatch: l.hatch,
        lw: l.highlight ? 5 : 3.8,
        stroke: l.highlight ? '#FACC15' : C.PAL.ink,
        shadow: true
      });

      if (l.parts && window.CHAR) {
        g.save();
        g.translate(cx, ly);
        window.CHAR.renderParts(g, l.parts, lt);
        g.restore();
      }

      // Leader-line technical callout on right side (kept inside x <= 850 Safe Zone)
      if (l.label && explode > 0.30) {
        const startX = cx + lw / 2 + 8;
        const endX = startX + 55;
        C.line(g, startX, ly, endX, ly, { lw: 3, color: C.PAL.ink });
        C.circle(g, startX, ly, 5, { fill: C.PAL.ink, stroke: false });

        g.font = '900 22px "Nunito", sans-serif';
        g.fillStyle = C.PAL.ink;
        g.textAlign = 'left';
        g.textBaseline = 'bottom';
        g.fillText(l.label, endX + 10, ly - 2);

        if (l.sub) {
          g.font = '700 17px "Space Mono", monospace';
          g.fillStyle = '#475569';
          g.textBaseline = 'top';
          g.fillText(l.sub, endX + 10, ly + 4);
        }
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
    g.strokeStyle = 'rgba(24,24,27,0.22)';
    g.lineWidth = 4;
    g.setLineDash([12, 10]);
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);

    if (o.centerLabel) {
      g.font = '900 32px "Caveat", cursive';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.centerLabel, cx, cy);
    }

    steps.forEach((st, i) => {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const sx = cx + Math.cos(a0) * r;
      const sy = cy + Math.sin(a0) * r;
      const nx = cx + Math.cos(a1) * r;
      const ny = cy + Math.sin(a1) * r;

      const midX = (sx + nx) / 2 + Math.cos((a0 + a1) / 2) * 30;
      const midY = (sy + ny) / 2 + Math.sin((a0 + a1) / 2) * 30;
      C.arrow(g, sx, sy, nx, ny, {
        lw: 4.5,
        color: st.arrowColor || C.PAL.ink,
        curve: true,
        curveX: (midX - (sx + nx) / 2),
        curveY: (midY - (sy + ny) / 2)
      });

      const w = st.w || 185, h = st.h || 90;
      C.roundRect(g, sx - w / 2, sy - h / 2, w, h, 14, {
        fill: st.color || '#FFFFFF',
        lw: 3.8,
        shadow: true
      });
      g.font = '900 21px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(st.label || '', sx, sy - (st.sub ? 10 : 0));
      if (st.sub) {
        g.font = '700 17px "Space Mono", monospace';
        g.fillStyle = '#475569';
        g.fillText(st.sub, sx, sy + 16);
      }
    });
    g.restore();
  }

  /**
   * 4. SIDE-BY-SIDE 9:16 SCALE COMPARISON ARENA (`DIAGRAM.scaleCompare(g, lt, opts)`)
   * Uses the full vertical height above floorY = 1320 (up to 680px tall!).
   */
  function scaleCompare(g, lt, opts) {
    const o = opts || {};
    const fy = o.floorY !== undefined ? o.floorY : C.FLOOR_Y;
    const items = o.items || [];
    if (!items.length) return;

    let maxH = 0;
    items.forEach((it) => { if ((it.size || 1) > maxH) maxH = it.size || 1; });

    g.save();
    const span = Math.min(o.span || 560, C.SAFE.w - 140);
    const startX = C.SAFE.cx - span / 2;

    items.forEach((it, i) => {
      const ix = items.length === 1 ? C.SAFE.cx : startX + (i / (items.length - 1)) * span;
      const sc = C.pop(lt, it.t0 !== undefined ? it.t0 : i * 0.16, 0.30);
      const pixelH = Math.max(54, ((it.size || 1) / maxH) * 680) * sc;
      const pixelW = it.w || Math.min(180, Math.max(68, pixelH * 0.42));

      C.roundRect(g, ix - pixelW / 2, fy - pixelH, pixelW, pixelH, 8, {
        fill: it.color || '#3B82F6',
        hatch: true,
        lw: 3.8,
        shadow: true
      });

      g.font = '900 26px "Nunito", sans-serif';
      g.fillStyle = C.PAL.ink;
      g.textAlign = 'center';
      g.fillText(it.label || '', ix, fy + 44);

      if (it.metric) {
        g.font = '700 36px "Caveat", cursive';
        g.fillStyle = it.color || C.PAL.red;
        g.fillText(it.metric, ix, fy - pixelH - 22);
      }
    });
    g.restore();
  }

  /**
   * 5. UNIVERSAL ORBITAL / ATOMIC / SOLAR SYSTEM CREATOR (`DIAGRAM.orbit(g, t, opts)`)
   */
  function orbit(g, t, opts) {
    const o = opts || {};
    const cx = o.x !== undefined ? C.clamp(o.x, 260, 660) : 475;
    const cy = o.y !== undefined ? C.clamp(o.y, 460, 1080) : 800;
    const coreR = o.coreR || 64;
    const rings = o.rings || [
      { rx: 170, ry: 170, rot: 0, bodies: [{ r: 16, color: '#38BDF8', speed: 1.6, label: 'e-' }] },
      { rx: 285, ry: 285, rot: 0, bodies: [{ r: 22, color: '#4ADE80', speed: 1.0 }] }
    ];

    g.save();
    g.translate(cx, cy);

    rings.forEach((rg) => {
      g.save();
      if (rg.rot) g.rotate((rg.rot * Math.PI) / 180);
      g.strokeStyle = rg.trackColor || 'rgba(148, 163, 184, 0.45)';
      g.lineWidth = 3;
      g.setLineDash(rg.dash || [10, 8]);
      g.beginPath();
      g.ellipse(0, 0, Math.min(rg.rx || 190, 320), Math.min(rg.ry || rg.rx || 190, 320), 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.restore();
    });

    C.circle(g, 0, 0, coreR, { fill: o.coreColor || '#FACC15', lw: 4, shadow: true });
    if (o.coreLabel) {
      g.font = '900 26px "Nunito", sans-serif';
      g.fillStyle = o.coreTextColor || C.PAL.ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(o.coreLabel, 0, 0);
    }

    rings.forEach((rg, rIdx) => {
      const rx = Math.min(rg.rx || 190, 320), ry = Math.min(rg.ry || rx, 320);
      const rotRad = ((rg.rot || 0) * Math.PI) / 180;
      (rg.bodies || []).forEach((b, bIdx) => {
        const ang = (b.phase || bIdx * 2.1 + rIdx) + t * (b.speed !== undefined ? b.speed : 1.3);
        const lx = Math.cos(ang) * rx;
        const ly = Math.sin(ang) * ry;
        const bx = lx * Math.cos(rotRad) - ly * Math.sin(rotRad);
        const by = lx * Math.sin(rotRad) + ly * Math.cos(rotRad);

        C.circle(g, bx, by, b.r || 16, { fill: b.color || '#38BDF8', lw: 3.5 });
        if (b.label) {
          g.font = '800 18px "Nunito", sans-serif';
          g.fillStyle = b.labelColor || '#FFFFFF';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(b.label, bx, by - (b.r || 16) - 16);
        }
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