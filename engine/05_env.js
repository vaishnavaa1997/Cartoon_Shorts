/**
 * MODULE 05: UNIVERSAL COMPOSABLE ENVIRONMENT CREATOR — 9:16 EDITION (engine/05_env.js)
 * Built for 1080x1920 vertical screens with raised floor (floorY = 1320) so
 * all room details, windows, horizons, and characters sit above the bottom title overlay.
 */
(function () {
  const C = window.CORE;

  /**
   * 1. THE SIGNATURE 9:16 STUDIO CURVE (`ENV.studio(g, opts)`)
   * Minimalist curved horizon backdrop used for metaphors, charts, and skits.
   * Default `floorY = 1320` (C.FLOOR_Y).
   */
  function studio(g, opts) {
    const o = opts || {};
    const palettes = {
      warm:      { wall: '#D8D2C5', floor: '#9E9789' },
      paper:     { wall: '#EFECE4', floor: '#C8C2B4' },
      parchment: { wall: '#E8DFC8', floor: '#B8A98A' },
      cool:      { wall: '#CBD5E1', floor: '#64748B' },
      mint:      { wall: '#D1FAE5', floor: '#6EE7B7' },
      rose:      { wall: '#FFE4E6', floor: '#FDA4AF' },
      amber:     { wall: '#FEF3C7', floor: '#FCD34D' },
      slate:     { wall: '#334155', floor: '#1E293B' },
      noir:      { wall: '#18181B', floor: '#09090B' },
      danger:    { wall: '#450A0A', floor: '#280505' },
      blueprint: { wall: '#1E3A8A', floor: '#172554', grid: true }
    };
    const pal = palettes[o.theme || 'warm'] || palettes.warm;
    const wallCol = o.wall || pal.wall;
    const floorCol = o.floor || pal.floor;
    const fy = o.floorY !== undefined ? o.floorY : C.FLOOR_Y;
    const curve = o.curve !== undefined ? o.curve : -20;

    g.save();
    g.fillStyle = wallCol;
    g.fillRect(0, 0, C.W, C.H);

    if (o.grid || pal.grid) {
      const gCol = o.gridColor || (pal.grid ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)');
      const step = o.gridStep || 60;
      for (let x = 0; x < C.W; x += step) C.line(g, x, 0, x, C.H, { lw: 1.2, color: gCol });
      for (let y = 0; y < C.H; y += step) C.line(g, 0, y, C.W, y, { lw: 1.2, color: gCol });
    }

    if (o.stripes) {
      g.fillStyle = o.stripeColor || 'rgba(0,0,0,0.035)';
      for (let x = 0; x < C.W; x += 90) g.fillRect(x, 0, 45, fy + 20);
    }

    if (o.spotlight !== false) {
      const grd = g.createRadialGradient(C.SAFE.cx, fy - 440, 50, C.SAFE.cx, fy - 380, 780);
      grd.addColorStop(0, o.glowColor || 'rgba(255, 255, 255, 0.22)');
      grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, C.W, C.H);
    }

    if (o.showFloor !== false) {
      // Subtle top-to-bottom shading on the 1320..1920 floor so bottom captions read cleanly
      const fGrd = g.createLinearGradient(0, fy, 0, C.H);
      fGrd.addColorStop(0, floorCol);
      fGrd.addColorStop(1, C.shadeColor(floorCol, -14));
      g.fillStyle = fGrd;

      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(540, fy + curve, C.W + 20, fy);
      g.lineTo(C.W + 20, C.H + 20);
      g.lineTo(-20, C.H + 20);
      g.closePath();
      g.fill();

      C.inkStyle(g, 3.8, C.PAL.ink);
      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(540, fy + curve, C.W + 20, fy);
      g.stroke();
    }
    g.restore();
  }

  /**
   * 2. UNIVERSAL 1-CALL COMPOSABLE SCENE CREATOR (`ENV.create(g, recipe)`)
   * Builds any custom 9:16 interior or exterior scene from a declarative recipe object.
   * Default `floorY = 1320`.
   */
  function create(g, recipe) {
    const r = recipe || {};
    const fy = r.floorY !== undefined ? r.floorY : C.FLOOR_Y;
    const t = r.t !== undefined ? r.t : 0;

    g.save();

    // Layer 1: Sky / Space / Backdrop
    if (r.sky) {
      sky(g, Object.assign({ floorY: r.ground === false ? C.H : fy, t: t }, r.sky));
    }

    // Layer 2: Distant Horizon Silhouettes
    if (r.horizon) {
      horizon(g, Array.isArray(r.horizon) ? r.horizon : [r.horizon], fy, t);
    }

    // Layer 3: Interior Wall Surface
    if (r.wall) {
      wall(g, Object.assign({ floorY: fy, t: t }, typeof r.wall === 'string' ? { color: r.wall } : r.wall));
    }

    // Layer 4: Architectural & Midground Structures
    if (Array.isArray(r.structures)) {
      structures(g, r.structures, fy, t);
    }

    // Layer 5: Custom Declarative Background Parts
    if (Array.isArray(r.parts) && window.CHAR && typeof window.CHAR.renderParts === 'function') {
      window.CHAR.renderParts(g, r.parts, t);
    }
    if (typeof r.drawBack === 'function') {
      r.drawBack(g, fy, t);
    }

    // Layer 6: Ground / Floor / Road / Water / Subterranean Strata
    if (r.ground !== false && r.ground) {
      ground(g, Object.assign({ y: fy, t: t }, typeof r.ground === 'string' ? { color: r.ground } : r.ground));
    }

    // Layer 7: Ambient Particles / Weather
    if (r.particles) {
      particles(g, t, r.particles);
    }

    g.restore();
  }

  /**
   * 3. SKY, SPACE, UNDERWATER & CELESTIAL LAYER (`ENV.sky`)
   */
  function sky(g, opts) {
    const o = opts || {};
    const fy = o.floorY !== undefined ? o.floorY : C.FLOOR_Y;
    const t = o.t || 0;

    g.save();
    if (o.topColor && o.botColor) {
      const grd = g.createLinearGradient(0, 0, 0, fy);
      grd.addColorStop(0, o.topColor);
      grd.addColorStop(1, o.botColor);
      g.fillStyle = grd;
    } else {
      g.fillStyle = o.color || o.topColor || '#E0F2FE';
    }
    g.fillRect(0, 0, C.W, fy);

    // Stars
    if (o.stars) {
      const count = typeof o.stars === 'number' ? o.stars : 75;
      const rand = C.rng(o.seed || 17);
      for (let i = 0; i < count; i++) {
        const sx = rand() * C.W;
        const sy = rand() * fy;
        const sr = 1.2 + rand() * 2.2;
        const alpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.5 + i));
        g.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        g.beginPath();
        g.arc(sx, sy, sr, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Light Rays / Underwater Sunbeams
    if (o.rays) {
      g.fillStyle = o.rayColor || 'rgba(255,255,255,0.09)';
      for (let rx = 110; rx < 980; rx += 260) {
        g.beginPath();
        g.moveTo(rx, 0); g.lineTo(rx + 85, 0);
        g.lineTo(rx + 210, fy); g.lineTo(rx - 40, fy);
        g.closePath(); g.fill();
      }
    }

    // Sun / Moon / Distant Planet in Sky (Default x=720, y=360 inside Safe Zone)
    if (o.celestial || o.sun || o.moon) {
      const cel = typeof (o.celestial || o.sun || o.moon) === 'object'
        ? (o.celestial || o.sun || o.moon)
        : { x: 720, y: 360, r: 54, color: o.moon ? '#F8FAFC' : '#FACC15' };
      const cx = cel.x !== undefined ? cel.x : 720;
      const cy = cel.y !== undefined ? cel.y : 360;
      const cr = cel.r || 54;
      C.circle(g, cx, cy, cr, { fill: cel.color || '#FACC15', lw: 3.5 });
      if (cel.rings) {
        g.strokeStyle = cel.ringColor || '#FDE68A';
        g.lineWidth = 10;
        g.beginPath();
        g.ellipse(cx, cy, cr * 1.75, cr * 0.35, -0.2, 0, Math.PI * 2);
        g.stroke();
      }
    }

    // Drifting Cartoon Clouds (Placed in Safe Upper Zone y: 320..460)
    if (o.clouds) {
      const count = typeof o.clouds === 'number' ? o.clouds : 3;
      const cCol = o.cloudColor || '#FFFFFF';
      for (let i = 0; i < count; i++) {
        const cx = ((i * 390 + 180 + t * (12 + i * 3)) % (C.W + 240)) - 120;
        const cy = 330 + (i % 2) * 75;
        const sc = 0.85 + (i % 3) * 0.12;
        g.save();
        g.translate(cx, cy);
        g.scale(sc, sc);
        C.roundRect(g, -65, -18, 130, 38, 19, { fill: cCol, lw: 3.2 });
        C.circle(g, -22, -22, 24, { fill: cCol, lw: 3.2 });
        C.circle(g, 18, -26, 28, { fill: cCol, lw: 3.2 });
        g.fillStyle = cCol;
        g.fillRect(-58, -15, 116, 30);
        g.restore();
      }
    }
    g.restore();
  }

  /**
   * 4. PARAMETRIC 9:16 HORIZON SILHOUETTE GENERATOR (`ENV.horizon`)
   * Supports: 'hills' | 'peaks' | 'skyline' | 'stepped' | 'craters' | 'stalactites' | 'poly'
   */
  function horizon(g, layers, floorY, t) {
    const fy = floorY !== undefined ? floorY : C.FLOOR_Y;
    (layers || []).forEach((l) => {
      if (!l) return;
      const type = l.type || 'hills';
      const col = l.color || '#94A3B8';
      const base = l.y !== undefined ? l.y : fy;

      g.save();
      C.inkStyle(g, 3.5, C.PAL.ink, col);

      if (type === 'hills' || type === 'dunes') {
        const amp = l.amp || 180;
        g.beginPath();
        g.moveTo(-20, base);
        g.quadraticCurveTo(270, base - amp, 540, base - amp * 0.35);
        g.quadraticCurveTo(810, base - amp * 1.15, C.W + 20, base);
        g.closePath();
        g.fill(); g.stroke();
      } else if (type === 'peaks' || type === 'pyramids') {
        const count = l.count || 3;
        const maxH = l.maxH || 420;
        const span = C.W / count;
        for (let i = 0; i < count; i++) {
          const x0 = i * span - 50;
          const x1 = (i + 1) * span + 50;
          const mx = (x0 + x1) / 2;
          const ph = maxH * (0.75 + ((i * 37) % 35) / 100);
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(x0, base);
          g.lineTo(mx, base - ph);
          g.lineTo(x1, base);
          g.closePath();
          g.fill(); g.stroke();

          if (l.snow) {
            g.fillStyle = '#F8FAFC';
            g.beginPath();
            g.moveTo(mx, base - ph);
            g.lineTo(mx - (x1 - x0) * 0.14, base - ph * 0.72);
            g.lineTo(mx + (x1 - x0) * 0.14, base - ph * 0.72);
            g.closePath();
            g.fill(); g.stroke();
          }
        }
      } else if (type === 'skyline') {
        const count = l.count || 5;
        const rand = C.rng(l.seed || 23);
        const step = C.W / count;
        for (let i = 0; i < count; i++) {
          const bw = step * 0.80;
          const bh = (l.minH || 280) + rand() * ((l.maxH || 560) - (l.minH || 280));
          const bx = i * step + (step - bw) / 2;
          C.roundRect(g, bx, base - bh, bw, bh, 4, { fill: col, lw: 3.5 });

          if (l.windows !== false) {
            for (let wx = bx + 20; wx < bx + bw - 28; wx += 44) {
              for (let wy = base - bh + 32; wy < base - 50; wy += 60) {
                C.roundRect(g, wx, wy, 24, 34, 3, {
                  fill: l.windowColor || '#F8FAFC',
                  lw: 2
                });
              }
            }
          }
          if (l.chimneys && i % 2 === 0) {
            C.roundRect(g, bx + 24, base - bh - 120, 34, 120, 2, { fill: C.shadeColor(col, -15), lw: 3.5 });
            C.circle(g, bx + 41 + Math.sin((t || 0) * 2 + i) * 14, base - bh - 150, 24, { fill: '#64748B', lw: 2.5 });
          }
        }
      } else if (type === 'stepped') {
        const spots = l.positions || [220, 500, 780];
        spots.forEach((sx, idx) => {
          const tiers = l.tiers || (idx === 1 ? 5 : 4);
          const baseW = l.baseW || 220;
          const tierH = l.tierH || 58;
          for (let j = 0; j < tiers; j++) {
            const tw = baseW - j * (baseW / (tiers + 1));
            C.roundRect(g, sx - tw / 2, base - (j + 1) * tierH, tw, tierH, 4, { fill: col, lw: 3.5 });
          }
        });
      } else if (type === 'craters') {
        [230, 520, 810].forEach((cx, idx) => {
          g.beginPath();
          g.ellipse(cx, base, 130 - idx * 15, 32, 0, Math.PI, Math.PI * 2);
          g.fill(); g.stroke();
        });
      } else if (type === 'stalactites') {
        for (let sx = 60; sx < C.W; sx += 140) {
          const sh = 90 + ((sx * 37) % 120);
          g.beginPath();
          g.moveTo(sx - 35, 0); g.lineTo(sx, sh); g.lineTo(sx + 35, 0);
          g.closePath(); g.fill(); g.stroke();
        }
      } else if (type === 'poly' && Array.isArray(l.pts)) {
        if (window.CHAR) window.CHAR.renderParts(g, [{ type: 'poly', pts: l.pts, fill: col, lw: 3.5 }], t);
      }
      g.restore();
    });
  }

  /**
   * 5. PROCEDURAL INTERIOR WALL CREATOR (`ENV.wall`)
   */
  function wall(g, opts) {
    const o = opts || {};
    const fy = o.floorY !== undefined ? o.floorY : C.FLOOR_Y;
    const col = o.color || '#D6CFC2';
    const pat = o.pattern || 'plain';

    g.save();
    g.fillStyle = col;
    g.fillRect(0, 0, C.W, fy);

    const lineCol = o.patternColor || 'rgba(0,0,0,0.14)';

    if (pat === 'stone') {
      for (let y = 80; y < fy; y += 85) {
        C.line(g, 0, y, C.W, y, { lw: 2.5, color: lineCol });
        const off = (Math.floor(y / 85) % 2) * 80;
        for (let x = off; x < C.W; x += 160) C.line(g, x, y - 85, x, y, { lw: 2.5, color: lineCol });
      }
    } else if (pat === 'brick') {
      for (let y = 44; y < fy; y += 44) {
        C.line(g, 0, y, C.W, y, { lw: 2, color: lineCol });
        const off = (Math.floor(y / 44) % 2) * 45;
        for (let x = off; x < C.W; x += 90) C.line(g, x, y - 44, x, y, { lw: 2, color: lineCol });
      }
    } else if (pat === 'tile' || pat === 'grid') {
      const step = o.step || 80;
      for (let x = 0; x < C.W; x += step) C.line(g, x, 0, x, fy, { lw: 1.5, color: lineCol });
      for (let y = 0; y < fy; y += step) C.line(g, 0, y, C.W, y, { lw: 1.5, color: lineCol });
    } else if (pat === 'wood') {
      for (let y = 0; y < fy; y += 68) C.line(g, 0, y, C.W, y, { lw: 2.5, color: lineCol });
    } else if (pat === 'metal') {
      for (let x = 220; x < C.W; x += 220) {
        C.line(g, x, 0, x, fy, { lw: 3, color: lineCol });
        for (let y = 80; y < fy; y += 130) {
          C.circle(g, x - 12, y, 3, { fill: 'rgba(255,255,255,0.25)', stroke: false });
          C.circle(g, x + 12, y, 3, { fill: 'rgba(255,255,255,0.25)', stroke: false });
        }
      }
    } else if (pat === 'wainscot') {
      const wy = fy - 250;
      g.fillStyle = o.wainscotColor || '#78350F';
      g.fillRect(0, wy, C.W, 250);
      C.line(g, 0, wy, C.W, wy, { lw: 4 });
      for (let x = 60; x < C.W; x += 240) {
        C.roundRect(g, x, wy + 32, 165, 175, 4, { fill: 'rgba(0,0,0,0.14)', lw: 2.5 });
      }
    } else if (pat === 'acoustic') {
      for (let ax = 110; ax < 860; ax += 150) {
        for (let ay = 280; ay < 960; ay += 150) {
          C.roundRect(g, ax, ay, 115, 115, 6, { fill: C.shadeColor(col, -12), hatch: true, hatchColor: 'rgba(255,255,255,0.06)', lw: 2.5 });
        }
      }
    } else if (pat === 'bio') {
      for (let x = 0; x <= C.W; x += 160) {
        C.circle(g, x, 25, 85, { fill: C.shadeColor(col, 10), lw: 3 });
        C.circle(g, x, fy, 65, { fill: C.shadeColor(col, 10), lw: 3 });
      }
    }

    if (o.baseboard !== false && pat !== 'bio') {
      C.roundRect(g, -10, fy - 20, C.W + 20, 20, 0, {
        fill: o.baseboardColor || C.shadeColor(col, -30),
        lw: 3.5
      });
    }
    g.restore();
  }

  /**
   * 6. ARCHITECTURAL & MIDGROUND STRUCTURE PLACER (`ENV.structures`)
   */
  function structures(g, list, floorY, t) {
    const fy = floorY !== undefined ? floorY : C.FLOOR_Y;
    (list || []).forEach((s) => {
      if (!s) return;
      const type = s.type || 'pillar';
      const x = s.x !== undefined ? s.x : C.SAFE.cx;
      const col = s.color || '#94A3B8';

      if (type === 'pillar') {
        const w = s.w || 74;
        const topY = s.topY !== undefined ? s.topY : 180;
        C.roundRect(g, x - w / 2, topY, w, fy - topY, 4, { fill: col, lw: 3.5 });
        C.roundRect(g, x - w * 0.68, topY - 16, w * 1.36, 26, 4, { fill: C.shadeColor(col, -10), lw: 3.5 });
        C.roundRect(g, x - w * 0.68, fy - 28, w * 1.36, 28, 4, { fill: C.shadeColor(col, -10), lw: 3.5 });
      } else if (type === 'arch') {
        const w = s.w || 360, h = s.h || 740;
        C.roundRect(g, x - w / 2, fy - h, w, h, w / 2, { fill: s.fill || 'rgba(0,0,0,0.14)', lw: 4 });
      } else if (type === 'window') {
        drawWindow(g, Object.assign({ floorY: fy, t: t }, s));
      } else if (type === 'door') {
        const w = s.w || 210, h = s.h || 440;
        C.roundRect(g, x - w / 2, fy - h, w, h, s.arched ? w / 2 : 6, { fill: col, lw: 4, shadow: true });
        C.circle(g, x + w * 0.32, fy - h * 0.45, 7, { fill: '#FACC15', lw: 2.5 });
      } else if (type === 'tree') {
        const kind = s.style || 'oak';
        if (kind === 'pine') {
          C.roundRect(g, x - 12, fy - 70, 24, 70, 2, { fill: '#78350F', lw: 3.5 });
          if (window.CHAR) {
            window.CHAR.renderParts(g, [{ type: 'poly', pts: [[x - 65, fy - 60], [x, fy - 240], [x + 65, fy - 60]], fill: s.color || '#15803D' }], t);
          }
        } else if (kind === 'palm') {
          C.roundRect(g, x - 12, fy - 180, 24, 180, 6, { fill: '#92400E', lw: 3.5 });
          C.roundRect(g, x - 75, fy - 195, 70, 20, 10, { fill: '#16A34A', lw: 3 });
          C.roundRect(g, x + 5, fy - 195, 70, 20, 10, { fill: '#16A34A', lw: 3 });
        } else {
          C.roundRect(g, x - 14, fy - 130, 28, 130, 4, { fill: '#78350F', lw: 3.5 });
          C.circle(g, x, fy - 170, s.r || 68, { fill: s.color || '#22C55E', lw: 3.5 });
        }
      } else if (type === 'torch') {
        const ty = s.y || 680;
        C.roundRect(g, x - 8, ty, 16, 58, 4, { fill: '#78350F', lw: 3 });
        C.circle(g, x, ty - 16, 85, { fill: 'rgba(251, 146, 60, 0.18)', stroke: false });
        C.circle(g, x, ty - 14 + Math.sin(t * 14 + x) * 3, 18, { fill: '#F97316', lw: 2.5 });
        C.circle(g, x, ty - 12, 9, { fill: '#FACC15', stroke: false });
      }
    });
  }

  /**
   * 7. UNIVERSAL WINDOW BUILDER (`ENV.window`)
   * 9:16 Safe-Zone Defaults: `x = 500, y = 680, w = 320, h = 340`.
   */
  function drawWindow(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : C.SAFE.cx;
    const y = o.y !== undefined ? o.y : 680;
    const w = o.w || 320;
    const h = o.h || 340;
    const shape = o.shape || 'rect';
    const skyCol = o.skyColor || (o.view === 'night' || o.view === 'space' ? '#0F172A' : '#BAE6FD');

    g.save();
    if (shape === 'porthole') {
      const r = w / 2;
      C.circle(g, x, y, r + 16, { fill: '#64748B', lw: 4, shadow: true });
      C.circle(g, x, y, r, { fill: skyCol, lw: 4 });
      g.restore();
      return;
    }

    const left = x - w / 2, top = y - h / 2;
    const rad = shape === 'arched' ? w / 2 : 8;

    C.pathRoundRect(g, left, top, w, h, rad);
    g.fillStyle = skyCol;
    g.fill();
    g.clip();

    if (o.buildings) {
      const bCol = o.view === 'night' ? '#1E293B' : '#94A3B8';
      [[left + 20, top + 120, 65, h], [left + 95, top + 70, 85, h], [left + 195, top + 135, 70, h]].forEach((b) => {
        C.roundRect(g, b[0], b[1], b[2], b[3], 2, { fill: bCol, lw: 2.5 });
      });
    }

    if (shape === 'barred') {
      for (let bx = left + 40; bx < left + w - 20; bx += 45) {
        C.line(g, bx, top, bx, top + h, { lw: 6, color: '#475569' });
      }
    } else if (o.crossbars !== false) {
      C.line(g, x, top, x, top + h, { lw: 4, color: C.PAL.ink });
      C.line(g, left, y, left + w, y, { lw: 4, color: C.PAL.ink });
    }
    g.restore();

    C.roundRect(g, left, top, w, h, rad, { fill: false, lw: 4.5 });
    C.roundRect(g, left - 12, top + h - 6, w + 24, 16, 4, { fill: o.sillColor || '#F8FAFC', lw: 3.5 });
  }

  /**
   * 8. PROCEDURAL GROUND / FLOOR / STRATA BUILDER (`ENV.ground`)
   * Default `y = 1320` down to `1920` (600px vertical ground/strata section).
   */
  function ground(g, opts) {
    const o = opts || {};
    const fy = o.y !== undefined ? o.y : C.FLOOR_Y;
    const col = o.color || '#8C7A6B';
    const style = o.style || 'solid';

    g.save();
    if (style === 'road') {
      g.fillStyle = o.sidewalkColor || '#CBD5E1';
      g.fillRect(0, fy, C.W, 70);
      C.line(g, 0, fy, C.W, fy, { lw: 4 });
      g.fillStyle = col || '#475569';
      g.fillRect(0, fy + 70, C.W, C.H - fy - 70);
      C.line(g, 0, fy + 70, C.W, fy + 70, { lw: 4 });
      C.line(g, 0, fy + 180, C.W, fy + 180, { lw: 5, color: o.stripeColor || '#FACC15', dash: [48, 36] });
    } else if (style === 'strata') {
      const bands = o.bands || [
        { h: 90, color: '#65A30D' },
        { h: 160, color: '#A16207' },
        { h: 180, color: '#78350F' },
        { h: 300, color: '#44403C' }
      ];
      let curY = fy;
      bands.forEach((b) => {
        g.fillStyle = b.color;
        g.fillRect(0, curY, C.W, b.h);
        C.line(g, 0, curY, C.W, curY, { lw: 3.5 });
        curY += b.h;
      });
    } else if (style === 'curved') {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(540, fy + (o.curve || -20), C.W + 20, fy);
      g.lineTo(C.W + 20, C.H + 20);
      g.lineTo(-20, C.H + 20);
      g.closePath();
      g.fill();
      C.inkStyle(g, 3.8, C.PAL.ink);
      g.stroke();
    } else {
      g.fillStyle = col;
      g.fillRect(0, fy, C.W, C.H - fy);
      C.line(g, 0, fy, C.W, fy, { lw: 4 });

      if (style === 'planks' || style === 'tiles' || style === 'cobblestone') {
        for (let y = fy + 50; y < C.H; y += 55) {
          C.line(g, 0, y, C.W, y, { lw: 2, color: 'rgba(0,0,0,0.15)' });
        }
      }
    }
    g.restore();
  }

  /**
   * 9. UNIVERSAL AMBIENT PARTICLE GENERATOR (`ENV.particles`)
   */
  function particles(g, t, opts) {
    const o = opts || {};
    const shape = o.shape || o.kind || 'dust';
    const count = o.count || 28;
    const r = C.rng(o.seed || 77);

    g.save();
    for (let i = 0; i < count; i++) {
      const vx = o.speedX !== undefined ? o.speedX : (shape === 'rain' ? -110 : 20);
      const vy = o.speedY !== undefined ? o.speedY : (shape === 'rain' ? 720 : (shape === 'bubbles' || shape === 'embers' ? -95 : 130));
      const px = ((r() * C.W + t * vx + Math.sin(t * 2 + i) * 24) % C.W + C.W) % C.W;
      const py = ((r() * C.H + t * vy) % C.H + C.H) % C.H;

      if (shape === 'rain') {
        C.line(g, px, py, px - 10, py + 28, { lw: 2, color: o.color || 'rgba(147, 197, 253, 0.55)' });
      } else if (shape === 'paper') {
        g.save();
        g.translate(px, py);
        g.rotate(Math.sin(t * 3 + i) * 0.6);
        C.roundRect(g, -12, -8, 24, 16, 2, { fill: o.color || '#FFFFFF', lw: 2 });
        g.restore();
      } else if (shape === 'confetti') {
        const cols = ['#EF4444', '#3B82F6', '#10B981', '#FACC15', '#EC4899'];
        g.save();
        g.translate(px, py);
        g.rotate(t * 4 + i);
        C.roundRect(g, -7, -4, 14, 8, 2, { fill: cols[i % cols.length], lw: 1.5 });
        g.restore();
      } else if (shape === 'bubbles') {
        C.circle(g, px, py, 6 + (i % 8), { fill: 'rgba(255,255,255,0.22)', stroke: 'rgba(255,255,255,0.6)', lw: 2 });
      } else {
        const col = o.color || (shape === 'embers' ? '#F97316' : (shape === 'cells' ? '#EF4444' : '#FFFFFF'));
        C.circle(g, px, py, o.r || (shape === 'cells' ? 10 : 3.5), {
          fill: col,
          stroke: shape === 'cells' ? C.PAL.ink : false,
          lw: 2
        });
      }
    }
    g.restore();
  }

  window.ENV = {
    studio,
    create,
    sky,
    horizon,
    wall,
    structures,
    window: drawWindow,
    ground,
    particles,
    room: create,
    exterior: create,
    weather: particles
  };
})();