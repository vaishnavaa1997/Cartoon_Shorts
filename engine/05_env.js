/**
 * MODULE 05: UNIVERSAL COMPOSABLE ENVIRONMENT CREATOR — 9:16 EDITION (engine/05_env.js)
 * Upgraded with "Paper Billions" 3-Layer Interior Rooms, Soft Radial Wall Shading,
 * Overhead Lamp Light Cones, Full-Width Animated Oceans, and Spaceport Horizons.
 * Built for 1080x1920 vertical screens with raised floor (floorY = 1320).
 */
(function () {
  const C = window.CORE;

  /**
   * Helper: Draws a soft Paper Billions overhead conical/radial light beam
   */
  function lightCone(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : C.SAFE.cx;
    const topY = o.topY !== undefined ? o.topY : 0;
    const botY = o.botY !== undefined ? o.botY : (o.floorY !== undefined ? o.floorY : C.FLOOR_Y);
    const topW = o.topW !== undefined ? o.topW : 70;
    const botW = o.botW !== undefined ? o.botW : 640;
    const col = o.color || 'rgba(255, 250, 220, 0.16)';

    g.save();
    const grd = g.createLinearGradient(x, topY, x, botY);
    grd.addColorStop(0, col);
    grd.addColorStop(0.75, C.rgba ? C.rgba('#FEF9C3', 0.07) : 'rgba(254, 249, 195, 0.07)');
    grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(x - topW / 2, topY);
    g.lineTo(x + topW / 2, topY);
    g.lineTo(x + botW / 2, botY);
    g.lineTo(x - botW / 2, botY);
    g.closePath();
    g.fill();

    // Soft floor pool ellipse
    const poolGrd = g.createRadialGradient(x, botY, 10, x, botY, botW * 0.48);
    poolGrd.addColorStop(0, 'rgba(255, 252, 230, 0.14)');
    poolGrd.addColorStop(1, 'rgba(255, 252, 230, 0)');
    g.fillStyle = poolGrd;
    g.beginPath();
    g.ellipse(x, botY + 12, botW * 0.48, 38, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  /**
   * 1. THE SIGNATURE 9:16 STUDIO CURVE (`ENV.studio(g, opts)`)
   * Minimalist curved horizon backdrop used for metaphors, charts, and skits.
   * Upgraded with Paper Billions soft depth vignette & floor rim shading.
   * Default `floorY = 1320` (C.FLOOR_Y).
   */
  function studio(g, opts) {
    const o = opts || {};
    const palettes = {
      warm:      { wall: '#DFD9CD', floor: '#A69F91', dark: false },
      paper:     { wall: '#F2EFE9', floor: '#CFC9BC', dark: false },
      parchment: { wall: '#EAE1CA', floor: '#BCA98B', dark: false },
      cool:      { wall: '#D5E0EC', floor: '#73859B', dark: false },
      mint:      { wall: '#D1FAE5', floor: '#6EE7B7', dark: false },
      rose:      { wall: '#FFE4E6', floor: '#FDA4AF', dark: false },
      amber:     { wall: '#FEF3C7', floor: '#FCD34D', dark: false },
      office:    { wall: '#E2E8F0', floor: '#94A3B8', dark: false },
      lab:       { wall: '#E0F2FE', floor: '#7DD3FC', dark: false },
      slate:     { wall: '#334155', floor: '#1E293B', dark: true },
      noir:      { wall: '#18181B', floor: '#09090B', dark: true },
      danger:    { wall: '#450A0A', floor: '#280505', dark: true },
      space:     { wall: '#0B101E', floor: '#060913', dark: true },
      blueprint: { wall: '#1E3A8A', floor: '#172554', grid: true, dark: true }
    };
    const pal = palettes[o.theme || 'warm'] || palettes.warm;
    const wallCol = o.wall || pal.wall;
    const floorCol = o.floor || pal.floor;
    const fy = o.floorY !== undefined ? o.floorY : C.FLOOR_Y;
    const curve = o.curve !== undefined ? o.curve : -22;

    g.save();

    // Base Wall with subtle Paper Billions vertical gradient
    const wGrd = g.createLinearGradient(0, 0, 0, fy);
    wGrd.addColorStop(0, C.shadeColor(wallCol, pal.dark ? -8 : -4));
    wGrd.addColorStop(0.55, wallCol);
    wGrd.addColorStop(1, C.shadeColor(wallCol, pal.dark ? -12 : -7));
    g.fillStyle = wGrd;
    g.fillRect(0, 0, C.W, C.H);

    // Optional Grid (Blueprint / Editorial graph paper)
    if (o.grid || pal.grid) {
      const gCol = o.gridColor || (pal.grid ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.045)');
      const step = o.gridStep || 60;
      for (let x = 0; x < C.W; x += step) C.line(g, x, 0, x, C.H, { lw: 1.2, color: gCol });
      for (let y = 0; y < C.H; y += step) C.line(g, 0, y, C.W, y, { lw: 1.2, color: gCol });
    }

    // Optional Wallpaper Stripes
    if (o.stripes) {
      g.fillStyle = o.stripeColor || (pal.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.032)');
      for (let x = 0; x < C.W; x += 90) g.fillRect(x, 0, 45, fy + 20);
    }

    // Soft Radial Spotlight in Safe Zone Center (500, 860)
    if (o.spotlight !== false) {
      const grd = g.createRadialGradient(C.SAFE.cx, fy - 450, 40, C.SAFE.cx, fy - 380, 800);
      grd.addColorStop(0, o.glowColor || (pal.dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.28)'));
      grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, C.W, C.H);
    }

    // Optional Paper Billions Overhead Lamp Cone
    if (o.lightCone) {
      lightCone(g, Object.assign({ floorY: fy }, typeof o.lightCone === 'object' ? o.lightCone : {}));
    }

    // Curved Studio Floor (y = 1320..1920)
    if (o.showFloor !== false) {
      // Soft ambient contact shadow just above the horizon line
      const ambGrd = g.createLinearGradient(0, fy - 36, 0, fy + 6);
      ambGrd.addColorStop(0, 'rgba(0,0,0,0)');
      ambGrd.addColorStop(1, pal.dark ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.08)');
      g.fillStyle = ambGrd;
      g.fillRect(0, fy - 36, C.W, 42);

      // Top-to-bottom floor shading so bottom captions read cleanly
      const fGrd = g.createLinearGradient(0, fy, 0, C.H);
      fGrd.addColorStop(0, floorCol);
      fGrd.addColorStop(1, C.shadeColor(floorCol, -16));
      g.fillStyle = fGrd;

      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(540, fy + curve, C.W + 20, fy);
      g.lineTo(C.W + 20, C.H + 20);
      g.lineTo(-20, C.H + 20);
      g.closePath();
      g.fill();

      // Subtle highlight rim right below the horizon stroke
      g.strokeStyle = pal.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.28)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-20, fy + 4);
      g.quadraticCurveTo(540, fy + curve + 4, C.W + 20, fy + 4);
      g.stroke();

      C.inkStyle(g, 3.8, C.PAL.ink);
      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(540, fy + curve, C.W + 20, fy);
      g.stroke();
    }
    g.restore();
  }

  /**
   * Helper: Built-in Paper Billions 3-Layer Interior Room Presets
   * Can be triggered via `ENV.room(g, { preset: 'office', t: gt })` or `ENV.create(g, { preset: 'office' })`
   */
  function getPresetRecipe(presetName, fy) {
    const p = String(presetName || '').toLowerCase();
    if (p === 'office' || p === 'google') {
      return {
        wall: { color: '#E6E2D8', pattern: 'officeStripe', stripeColor: '#3B82F6', accentStripe: '#EF4444' },
        structures: [
          { type: 'window', x: 260, y: 660, w: 260, h: 320, view: 'day', trees: true },
          { type: 'shelf', x: 690, y: 580, w: 240, items: ['books', 'lavaLamp', 'mug'] },
          { type: 'clock', x: 510, y: 420, r: 42 },
          { type: 'plant', x: 140, y: fy }
        ],
        ground: { color: '#9C8D7C', style: 'planks' }
      };
    }
    if (p === 'breakroom' || p === 'kitchen') {
      return {
        wall: { color: '#DFDBD2', pattern: 'tile', step: 70 },
        structures: [
          { type: 'window', x: 260, y: 640, w: 250, h: 300, view: 'night', buildings: true },
          { type: 'shelf', x: 680, y: 560, w: 250, items: ['mugs', 'plant'] },
          { type: 'counter', x: 680, y: fy, w: 320, h: 190 },
          { type: 'lamp', x: 480, y: 240, lightCone: true }
        ],
        ground: { color: '#64748B', style: 'tiles' }
      };
    }
    if (p === 'server' || p === 'datacenter') {
      return {
        wall: { color: '#1E293B', pattern: 'metal', baseboardColor: '#0F172A' },
        structures: [
          { type: 'serverRack', x: 220, y: fy, w: 170, h: 520 },
          { type: 'serverRack', x: 440, y: fy, w: 170, h: 520 },
          { type: 'serverRack', x: 660, y: fy, w: 170, h: 520 },
          { type: 'lamp', x: 440, y: 240, lightCone: true, coneColor: 'rgba(56, 189, 248, 0.12)' }
        ],
        ground: { color: '#0F172A', style: 'tiles' }
      };
    }
    if (p === 'vault') {
      return {
        wall: { color: '#334155', pattern: 'metal', baseboardColor: '#1E293B' },
        structures: [
          { type: 'vaultDoor', x: 500, y: fy, r: 220 },
          { type: 'lamp', x: 500, y: 240, lightCone: true }
        ],
        ground: { color: '#1E293B', style: 'solid' }
      };
    }
    if (p === 'lab' || p === 'missioncontrol') {
      return {
        wall: { color: '#1E293B', pattern: 'grid', patternColor: 'rgba(148,163,184,0.12)' },
        structures: [
          { type: 'whiteboard', x: 310, y: 660, w: 310, h: 240, dark: true, title: 'TELEMETRY' },
          { type: 'serverRack', x: 700, y: fy, w: 165, h: 480 },
          { type: 'clock', x: 700, y: 460, r: 40 }
        ],
        ground: { color: '#0F172A', style: 'tiles' }
      };
    }
    return null;
  }

  /**
   * 2. UNIVERSAL 1-CALL COMPOSABLE SCENE CREATOR (`ENV.create(g, recipe)`)
   * Builds any custom 9:16 interior or exterior scene from a declarative recipe object.
   * Default `floorY = 1320`.
   */
  function create(g, recipe) {
    let r = recipe || {};
    const fy = r.floorY !== undefined ? r.floorY : C.FLOOR_Y;
    const t = r.t !== undefined ? r.t : 0;

    // Merge preset if specified
    if (r.preset) {
      const pre = getPresetRecipe(r.preset, fy);
      if (pre) {
        r = Object.assign({}, pre, r);
      }
    }

    // Detect if this is a pure deep-space scene (stars + dark sky + no terrestrial structures)
    const isDeepSpace = Boolean(
      r.sky && r.sky.stars && !r.wall && !r.horizon && !r.structures &&
      (r.ground === false || r.space === true)
    );

    g.save();

    // Layer 1: Sky / Space / Backdrop
    if (r.sky) {
      sky(g, Object.assign({ floorY: (r.ground === false || isDeepSpace) ? C.H : fy, t: t }, r.sky));
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

    // Layer 5: Custom Declarative Background Parts (with Ocean Cliff Bug Sanitizer!)
    if (Array.isArray(r.parts) && window.CHAR && typeof window.CHAR.renderParts === 'function') {
      const sanitizedParts = r.parts.map((pt) => {
        if (!pt) return pt;
        // Fix for the half-screen blue water block bug (e.g., x: 0, w: 540 blue rect in ocean shots):
        // Stretch partial-width ocean water rectangles across the full 1080px width with a wave top!
        const isBlueWaterRect =
          pt.type === 'rect' &&
          typeof pt.fill === 'string' &&
          /^#(0284C7|0369A1|0EA5E9|1D4ED8|2563EB|3B82F6|1E40AF|1E3A8A)/i.test(pt.fill.trim()) &&
          (pt.x !== undefined && pt.x <= 50) &&
          (pt.w !== undefined && pt.w >= 350 && pt.w < 950) &&
          (pt.h !== undefined && pt.h >= 240);
        if (isBlueWaterRect) {
          drawOceanBand(g, pt.y || 760, fy, pt.fill, t);
          return null;
        }
        return pt;
      }).filter(Boolean);

      if (sanitizedParts.length > 0) {
        window.CHAR.renderParts(g, sanitizedParts, t);
      }
    }

    if (typeof r.drawBack === 'function') {
      r.drawBack(g, fy, t);
    }

    // Optional Overhead Light Cone
    if (r.lightCone) {
      lightCone(g, Object.assign({ floorY: fy }, typeof r.lightCone === 'object' ? r.lightCone : {}));
    }

    // Layer 6: Ground / Floor / Road / Water / Subterranean Strata
    if (r.ground !== false && r.ground && !isDeepSpace) {
      ground(g, Object.assign({ y: fy, t: t }, typeof r.ground === 'string' ? { color: r.ground } : r.ground));
    }

    // Layer 7: Ambient Particles / Weather
    if (r.particles) {
      particles(g, t, r.particles);
    }

    g.restore();
  }

  /**
   * Helper: Draws a seamless full-width animated ocean water band (fixes half-cliff water bugs)
   */
  function drawOceanBand(g, topY, botY, color, t) {
    const baseCol = color || '#0284C7';
    g.save();
    const grd = g.createLinearGradient(0, topY, 0, botY);
    grd.addColorStop(0, baseCol);
    grd.addColorStop(1, C.shadeColor(baseCol, -25));
    g.fillStyle = grd;

    g.beginPath();
    g.moveTo(-40, botY + 20);
    g.lineTo(-40, topY);
    for (let x = -40; x <= C.W + 40; x += 90) {
      const wy = topY + Math.sin((x * 0.018) + (t || 0) * 2.2) * 14;
      g.quadraticCurveTo(x + 45, wy - 14, x + 90, topY);
    }
    g.lineTo(C.W + 40, botY + 20);
    g.closePath();
    g.fill();

    // Foam highlight + crisp ink outline along the wave crest
    C.inkStyle(g, 3.8, C.PAL.ink);
    g.beginPath();
    g.moveTo(-40, topY);
    for (let x = -40; x <= C.W + 40; x += 90) {
      const wy = topY + Math.sin((x * 0.018) + (t || 0) * 2.2) * 14;
      g.quadraticCurveTo(x + 45, wy - 14, x + 90, topY);
    }
    g.stroke();

    // Subtle secondary wave lines inside the water
    g.strokeStyle = 'rgba(255,255,255,0.22)';
    g.lineWidth = 2.5;
    for (let row = 1; row <= 3; row++) {
      const ry = topY + row * ((botY - topY) / 4);
      if (ry >= botY - 20) break;
      for (let wx = 60 + (row % 2) * 80; wx < C.W - 80; wx += 220) {
        const shift = Math.sin((t || 0) * 1.8 + row + wx) * 12;
        g.beginPath();
        g.moveTo(wx + shift, ry);
        g.quadraticCurveTo(wx + 45 + shift, ry - 10, wx + 90 + shift, ry);
        g.stroke();
      }
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
      const base = o.color || o.topColor || '#E0F2FE';
      const grd = g.createLinearGradient(0, 0, 0, fy);
      grd.addColorStop(0, C.shadeColor(base, -6));
      grd.addColorStop(1, base);
      g.fillStyle = grd;
    }
    g.fillRect(0, 0, C.W, fy);

    // Stars (Twinkling + soft nebula glow in deep space)
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
      const cCol = cel.color || (o.moon ? '#F8FAFC' : '#FACC15');

      // Soft outer atmospheric glow
      const glow = g.createRadialGradient(cx, cy, cr * 0.6, cx, cy, cr * 2.1);
      glow.addColorStop(0, C.rgba ? C.rgba(cCol, 0.26) : 'rgba(250, 204, 21, 0.22)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(cx, cy, cr * 2.1, 0, Math.PI * 2);
      g.fill();

      C.circle(g, cx, cy, cr, { fill: cCol, shade: true, lw: 3.5 });
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
   * Supports: 'hills' | 'peaks' | 'skyline' | 'stepped' | 'tankFarm' | 'waves' | 'craters' | 'stalactites' | 'poly'
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

      if (type === 'waves' || type === 'ocean' || type === 'water') {
        const topY = l.topY !== undefined ? l.topY : base - (l.amp || 220);
        drawOceanBand(g, topY, base, col || '#0284C7', t);
      } else if (type === 'hills' || type === 'dunes') {
        const amp = l.amp || 180;
        const grd = g.createLinearGradient(0, base - amp * 1.2, 0, base);
        grd.addColorStop(0, C.shadeColor(col, 8));
        grd.addColorStop(1, C.shadeColor(col, -10));
        g.fillStyle = grd;
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
          const bw = step * 0.82;
          const bh = (l.minH || 280) + rand() * ((l.maxH || 560) - (l.minH || 280));
          const bx = i * step + (step - bw) / 2;
          const bCol = i % 2 === 0 ? col : C.shadeColor(col, -8);
          C.roundRect(g, bx, base - bh, bw, bh, 4, { fill: bCol, lw: 3.5 });

          if (l.windows !== false) {
            for (let wx = bx + 20; wx < bx + bw - 28; wx += 44) {
              for (let wy = base - bh + 32; wy < base - 50; wy += 60) {
                const lit = ((wx + wy + i) % 3) !== 0;
                C.roundRect(g, wx, wy, 24, 34, 3, {
                  fill: lit ? (l.windowColor || '#FEF08A') : C.shadeColor(bCol, -18),
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
      } else if (type === 'tankFarm' || type === 'starbase' || type === 'spaceport') {
        // Gleaming cylindrical Starbase cryogenic tank farm + domes (replaces Mayan stepped blocks!)
        const spots = l.positions || [150, 265, 680, 795, 910];
        spots.forEach((tx, idx) => {
          const tw = l.tankW || 86;
          const th = (l.tankH || 210) + (idx % 2) * 35;
          const tCol = l.color || '#E2E8F0';
          // Dome top
          C.circle(g, tx, base - th, tw / 2, { fill: C.shadeColor(tCol, 8), lw: 3.2 });
          // Cylinder body
          C.roundRect(g, tx - tw / 2, base - th, tw, th, 6, { fill: tCol, lw: 3.2 });
          // Vertical shading stripe
          g.fillStyle = 'rgba(255,255,255,0.35)';
          g.fillRect(tx - tw * 0.28, base - th + 6, tw * 0.18, th - 12);
          // Horizontal pipe ring
          C.line(g, tx - tw / 2, base - th * 0.45, tx + tw / 2, base - th * 0.45, { lw: 2.5 });
        });
      } else if (type === 'stepped') {
        // Upgraded industrial/architectural stepped silhouette (cleanly grounded, no weird floating misalignment)
        const spots = l.positions || [210, 520, 810];
        spots.forEach((sx, idx) => {
          const tiers = l.tiers || (idx === 1 ? 4 : 3);
          const baseW = l.baseW || 190;
          const tierH = l.tierH || 48;
          for (let j = 0; j < tiers; j++) {
            const tw = baseW - j * (baseW / (tiers + 1.5));
            const ty = base - (j + 1) * tierH;
            C.roundRect(g, sx - tw / 2, ty, tw, tierH + 2, 3, {
              fill: j % 2 === 0 ? col : C.shadeColor(col, 6),
              lw: 3.2
            });
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
   * Upgraded with Paper Billions soft edge vignette & office stripe patterns.
   */
  function wall(g, opts) {
    const o = opts || {};
    const fy = o.floorY !== undefined ? o.floorY : C.FLOOR_Y;
    const col = o.color || '#DFD9CD';
    const pat = o.pattern || 'plain';

    g.save();
    // Soft vertical gradient on wall
    const wGrd = g.createLinearGradient(0, 0, 0, fy);
    wGrd.addColorStop(0, C.shadeColor(col, -6));
    wGrd.addColorStop(0.5, col);
    wGrd.addColorStop(1, C.shadeColor(col, -8));
    g.fillStyle = wGrd;
    g.fillRect(0, 0, C.W, fy);

    const lineCol = o.patternColor || 'rgba(0,0,0,0.12)';

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
    } else if (pat === 'officeStripe' || pat === 'stripe') {
      // Paper Billions Google Breakroom / Tech Office horizontal wall stripe
      const sy = o.stripeY || (fy - 390);
      const sh = o.stripeH || 36;
      g.fillStyle = o.stripeColor || '#3B82F6';
      g.fillRect(0, sy, C.W, sh);
      C.line(g, 0, sy, C.W, sy, { lw: 3 });
      C.line(g, 0, sy + sh, C.W, sy + sh, { lw: 3 });
      if (o.accentStripe) {
        g.fillStyle = o.accentStripe;
        g.fillRect(0, sy + sh, C.W, 14);
        C.line(g, 0, sy + sh + 14, C.W, sy + sh + 14, { lw: 2.5 });
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

    // Soft Paper Billions radial room spotlight
    const rGrd = g.createRadialGradient(C.SAFE.cx, fy - 480, 60, C.SAFE.cx, fy - 420, 760);
    rGrd.addColorStop(0, 'rgba(255,255,255,0.18)');
    rGrd.addColorStop(1, 'rgba(0,0,0,0.08)');
    g.fillStyle = rGrd;
    g.fillRect(0, 0, C.W, fy);

    if (o.baseboard !== false && pat !== 'bio') {
      C.roundRect(g, -10, fy - 22, C.W + 20, 22, 0, {
        fill: o.baseboardColor || C.shadeColor(col, -28),
        lw: 3.5
      });
    }
    g.restore();
  }

  /**
   * 6. ARCHITECTURAL & MIDGROUND STRUCTURE PLACER (`ENV.structures`)
   * Includes Paper Billions interior details: 'shelf', 'clock', 'serverRack',
   * 'vaultDoor', 'whiteboard', 'poster', 'lamp', 'counter', 'plant', 'cryoTank'
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
      } else if (type === 'shelf' || type === 'bookshelf') {
        // Paper Billions Floating Wall Shelf with Books, Mugs & Lava Lamp
        const y = s.y || 620;
        const w = s.w || 240;
        C.roundRect(g, x - w / 2, y, w, 18, 4, { fill: s.color || '#A16207', lw: 3.5, shadow: true });
        // Books on left
        C.roundRect(g, x - w * 0.38, y - 54, 22, 54, 2, { fill: '#EF4444', lw: 2.8 });
        C.roundRect(g, x - w * 0.38 + 24, y - 62, 24, 62, 2, { fill: '#3B82F6', lw: 2.8 });
        C.roundRect(g, x - w * 0.38 + 50, y - 48, 20, 48, 2, { fill: '#FACC15', lw: 2.8 });
        // Coffee mug in middle
        C.roundRect(g, x + 10, y - 34, 28, 34, 4, { fill: '#F8FAFC', lw: 2.8 });
        // Lava lamp or small plant on right
        C.roundRect(g, x + w * 0.26, y - 68, 28, 68, 12, { fill: '#FB923C', lw: 2.8 });
        C.roundRect(g, x + w * 0.26 - 4, y - 16, 36, 16, 3, { fill: '#475569', lw: 2.8 });
      } else if (type === 'clock') {
        const y = s.y || 460;
        const r = s.r || 42;
        C.circle(g, x, y, r + 5, { fill: '#334155', lw: 3.5, shadow: true });
        C.circle(g, x, y, r, { fill: '#F8FAFC', lw: 3 });
        C.line(g, x, y, x, y - r * 0.58, { lw: 3.5, color: C.PAL.ink });
        C.line(g, x, y, x + r * 0.45, y + r * 0.15, { lw: 3, color: '#EF4444' });
        C.circle(g, x, y, 4, { fill: C.PAL.ink, stroke: false });
      } else if (type === 'whiteboard' || type === 'poster' || type === 'frame') {
        const y = s.y || 660;
        const w = s.w || 280, h = s.h || 200;
        const bg = s.dark ? '#0F172A' : (s.fill || '#F8FAFC');
        C.roundRect(g, x - w / 2, y - h / 2, w, h, 8, { fill: bg, lw: 4, shadow: true });
        // Chart squiggle & sticky note inside board
        const lineCol = s.dark ? '#38BDF8' : '#3B82F6';
        C.line(g, x - w * 0.35, y + h * 0.2, x - w * 0.1, y - h * 0.05, { lw: 4, color: lineCol });
        C.line(g, x - w * 0.1, y - h * 0.05, x + w * 0.15, y + h * 0.1, { lw: 4, color: lineCol });
        C.line(g, x + w * 0.15, y + h * 0.1, x + w * 0.35, y - h * 0.25, { lw: 4, color: '#22C55E' });
        C.roundRect(g, x - w * 0.38, y - h * 0.36, 46, 46, 2, { fill: '#FEF08A', lw: 2.5 });
      } else if (type === 'serverRack') {
        // Paper Billions Data Center Server Rack with Blinking LEDs
        const w = s.w || 170, h = s.h || 500;
        const topY = (s.y || fy) - h;
        C.roundRect(g, x - w / 2, topY, w, h, 8, { fill: '#1E293B', lw: 4, shadow: true });
        for (let sy = topY + 24; sy < topY + h - 36; sy += 58) {
          C.roundRect(g, x - w * 0.4, sy, w * 0.8, 42, 4, { fill: '#0F172A', lw: 2.5 });
          const blink = Math.sin((t || 0) * 6 + sy + x) > 0;
          C.circle(g, x - w * 0.28, sy + 21, 5, { fill: blink ? '#22C55E' : '#15803D', stroke: false });
          C.circle(g, x - w * 0.14, sy + 21, 5, { fill: '#38BDF8', stroke: false });
          C.line(g, x + 4, sy + 21, x + w * 0.3, sy + 21, { lw: 3, color: '#334155' });
        }
      } else if (type === 'vaultDoor') {
        // Paper Billions Circular Steel Vault Door
        const r = s.r || 210;
        const cy = (s.y || fy) - r - 10;
        C.circle(g, x, cy, r + 22, { fill: '#64748B', lw: 4.5, shadow: true });
        C.circle(g, x, cy, r, { fill: '#94A3B8', shade: true, lw: 4 });
        C.circle(g, x, cy, r * 0.38, { fill: '#475569', lw: 3.5 });
        for (let a = 0; a < 6; a++) {
          const ang = (a * Math.PI) / 3 + (t || 0) * 0.15;
          C.line(g, x, cy, x + Math.cos(ang) * r * 0.34, cy + Math.sin(ang) * r * 0.34, { lw: 5, color: '#F8FAFC' });
        }
        C.circle(g, x, cy, 18, { fill: '#FACC15', lw: 3 });
      } else if (type === 'lamp' || type === 'ceilingLight') {
        const ly = s.y || 250;
        if (s.lightCone !== false) {
          lightCone(g, { x: x, topY: ly + 10, floorY: fy, color: s.coneColor });
        }
        C.line(g, x, 0, x, ly - 18, { lw: 4, color: C.PAL.ink });
        C.roundRect(g, x - 48, ly - 20, 96, 32, 16, { fill: s.color || '#334155', lw: 3.5 });
        C.circle(g, x, ly + 14, 14, { fill: '#FEF08A', lw: 2.5 });
      } else if (type === 'counter' || type === 'desk') {
        const w = s.w || 320, h = s.h || 185;
        const by = s.y || fy;
        C.roundRect(g, x - w / 2, by - h, w, h, 4, { fill: s.color || '#94A3B8', lw: 3.8, shadow: true });
        C.roundRect(g, x - w / 2 - 10, by - h - 16, w + 20, 20, 4, { fill: s.topColor || '#F8FAFC', lw: 3.8 });
      } else if (type === 'plant') {
        const by = s.y || fy;
        C.roundRect(g, x - 28, by - 64, 56, 64, 6, { fill: '#B45309', lw: 3.5 });
        C.circle(g, x - 20, by - 95, 28, { fill: '#16A34A', lw: 3 });
        C.circle(g, x + 18, by - 90, 26, { fill: '#22C55E', lw: 3 });
        C.circle(g, x, by - 115, 32, { fill: '#15803D', lw: 3 });
      } else if (type === 'cryoTank') {
        const w = s.w || 96, h = s.h || 250;
        const by = s.y || fy;
        C.circle(g, x, by - h, w / 2, { fill: '#F8FAFC', lw: 3.5 });
        C.roundRect(g, x - w / 2, by - h, w, h, 6, { fill: '#E2E8F0', lw: 3.5 });
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
   * Upgraded with Paper Billions outdoor trees, lit night buildings & glass reflections.
   * 9:16 Safe-Zone Defaults: `x = 500, y = 680, w = 320, h = 340`.
   */
  function drawWindow(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : C.SAFE.cx;
    const y = o.y !== undefined ? o.y : 680;
    const w = o.w || 320;
    const h = o.h || 340;
    const shape = o.shape || 'rect';
    const isNight = o.view === 'night' || o.view === 'space';
    const skyCol = o.skyColor || (isNight ? '#0F172A' : '#BAE6FD');

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

    // Night stars or Moon inside window
    if (isNight) {
      C.circle(g, left + w * 0.76, top + h * 0.24, 18, { fill: '#FEF08A', lw: 2.5 });
    } else {
      // Soft cloud puff
      C.roundRect(g, left + 35, top + 40, 85, 24, 12, { fill: '#FFFFFF', lw: 2 });
    }

    if (o.buildings) {
      const bCol = isNight ? '#1E293B' : '#94A3B8';
      [[left + 18, top + 120, 68, h], [left + 96, top + 72, 88, h], [left + 196, top + 132, 74, h]].forEach((b) => {
        C.roundRect(g, b[0], b[1], b[2], b[3], 2, { fill: bCol, lw: 2.5 });
        if (isNight) {
          C.roundRect(g, b[0] + 14, b[1] + 20, 14, 18, 2, { fill: '#FEF08A', lw: 1.5 });
          C.roundRect(g, b[0] + 38, b[1] + 50, 14, 18, 2, { fill: '#FEF08A', lw: 1.5 });
        }
      });
    } else if (o.trees !== false && !isNight) {
      // Paper Billions green outdoor foliage silhouette at bottom of window
      C.circle(g, left + w * 0.25, top + h - 10, 58, { fill: '#22C55E', lw: 2.8 });
      C.circle(g, left + w * 0.72, top + h - 5, 66, { fill: '#16A34A', lw: 2.8 });
    }

    // Diagonal glass reflection streaks
    g.strokeStyle = 'rgba(255,255,255,0.28)';
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(left + 28, top + h - 24);
    g.lineTo(left + w - 40, top + 28);
    g.stroke();

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
   * 8. PROCEDURAL GROUND / FLOOR / WATER / STRATA BUILDER (`ENV.ground`)
   * Default `y = 1320` down to `1920` (600px vertical ground/strata section).
   */
  function ground(g, opts) {
    const o = opts || {};
    const fy = o.y !== undefined ? o.y : C.FLOOR_Y;
    const col = o.color || '#8C7A6B';
    const style = o.style || 'solid';
    const t = o.t || 0;

    g.save();
    if (style === 'water' || style === 'ocean') {
      drawOceanBand(g, fy, C.H, col || '#0284C7', t);
    } else if (style === 'seafloor' || style === 'underwater') {
      const fGrd = g.createLinearGradient(0, fy, 0, C.H);
      fGrd.addColorStop(0, o.color || '#D97706');
      fGrd.addColorStop(1, C.shadeColor(o.color || '#D97706', -22));
      g.fillStyle = fGrd;
      g.beginPath();
      g.moveTo(-20, fy);
      g.quadraticCurveTo(320, fy - 18, 640, fy + 10);
      g.quadraticCurveTo(880, fy + 24, C.W + 20, fy - 6);
      g.lineTo(C.W + 20, C.H + 20);
      g.lineTo(-20, C.H + 20);
      g.closePath();
      g.fill();
      C.inkStyle(g, 3.8, C.PAL.ink);
      g.stroke();
    } else if (style === 'road') {
      g.fillStyle = o.sidewalkColor || '#CBD5E1';
      g.fillRect(0, fy, C.W, 70);
      C.line(g, 0, fy, C.W, fy, { lw: 4 });
      g.fillStyle = col || '#475569';
      g.fillRect(0, fy + 70, C.W, C.H - fy - 70);
      C.line(g, 0, fy + 70, C.W, fy + 70, { lw: 4 });
      C.line(g, 0, fy + 180, C.W, fy + 180, { lw: 5, color: o.stripeColor || '#FACC15', dash: [48, 36] });
    } else if (style === 'launchPad' || style === 'tarmac') {
      const fGrd = g.createLinearGradient(0, fy, 0, C.H);
      fGrd.addColorStop(0, col || '#475569');
      fGrd.addColorStop(1, C.shadeColor(col || '#475569', -20));
      g.fillStyle = fGrd;
      g.fillRect(0, fy, C.W, C.H - fy);
      C.line(g, 0, fy, C.W, fy, { lw: 4 });
      // Yellow hazard apron stripe
      g.fillStyle = '#FACC15';
      g.fillRect(0, fy + 4, C.W, 14);
      C.line(g, 0, fy + 18, C.W, fy + 18, { lw: 3 });
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
      const fGrd = g.createLinearGradient(0, fy, 0, C.H);
      fGrd.addColorStop(0, col);
      fGrd.addColorStop(1, C.shadeColor(col, -16));
      g.fillStyle = fGrd;
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
      const fGrd = g.createLinearGradient(0, fy, 0, C.H);
      fGrd.addColorStop(0, col);
      fGrd.addColorStop(1, C.shadeColor(col, -16));
      g.fillStyle = fGrd;
      g.fillRect(0, fy, C.W, C.H - fy);
      C.line(g, 0, fy, C.W, fy, { lw: 4 });

      if (style === 'planks' || style === 'tiles' || style === 'cobblestone') {
        for (let y = fy + 50; y < C.H; y += 55) {
          C.line(g, 0, y, C.W, y, { lw: 2, color: 'rgba(0,0,0,0.14)' });
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
    lightCone,
    ocean: drawOceanBand,
    room: create,
    exterior: create,
    weather: particles
  };
})();