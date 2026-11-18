/**
 * MODULE 02: CAMERA, VERTICAL COMIC SPLITS & UI SAFE-ZONE GUIDE (engine/02_camera.js)
 * 9:16 Vertical (1080x1920) 2D/2.5D camera pan/zoom/focus, viewport-safe bounds tracking,
 * screen shake, Paper Billions radial & cone spotlights, edge vignette,
 * floor-anchored 2-Row / 3-Row / 2-Col Comic Split-Screens, and Shorts/Reels UI Safe-Zone overlay.
 */
(function () {
  const C = window.CORE;

  /**
   * Begins a camera transform on the 1080x1920 vertical canvas and registers
   * the active viewport with CORE so stamps/callouts/badges never clip off-screen.
   */
  function begin(g, cam) {
    const c = cam || {};
    const zoom = c.zoom !== undefined ? c.zoom : (c.z !== undefined ? c.z : 1.0);
    const fx = c.focusX !== undefined ? c.focusX : 540;
    const fy = c.focusY !== undefined ? c.focusY : 960;
    const panX = c.x || 0;
    const panY = c.y || 0;

    // Support `rot` in either degrees (e.g. -2.5) or radians
    let rot = c.rot || 0;
    if (Math.abs(rot) > 0.35) rot = (rot * Math.PI) / 180;

    // Support `shake` as either a number (amp) or `{ x, y }` from C.shake(...)
    let shk = { x: 0, y: 0 };
    if (c.shake) {
      if (typeof c.shake === 'object') {
        shk = { x: c.shake.x || 0, y: c.shake.y || 0 };
      } else if (typeof c.shake === 'number') {
        shk = C.shake(c.t || 0, c.shake, 30, c.seed || 1);
      }
    }

    if (typeof C._setCam === 'function') {
      C._setCam({
        zoom,
        fx: fx + panX,
        fy: fy + panY,
        rot
      });
    }

    g.save();
    g.translate(540 + shk.x, 960 + shk.y);
    if (rot) g.rotate(rot);
    g.scale(zoom, zoom);
    g.translate(-fx - panX, -fy - panY);
  }

  /**
   * Ends the camera transform and applies optional studio lighting,
   * cone spotlight, vignette, and paper grain in 1080x1920 screen space.
   */
  function end(g, opts) {
    g.restore();
    if (typeof C._setCam === 'function') C._setCam(null);

    const o = opts || {};
    if (o.spotlight) {
      spotlight(g, typeof o.spotlight === 'object' ? o.spotlight : {});
    }
    if (o.vignette !== false) {
      vignette(g, o.vignette !== undefined ? o.vignette : 0.28);
    }
    if (o.grain !== false) {
      paperGrain(g, o.t || 0, typeof o.grain === 'number' ? o.grain : 0.018);
    }
  }

  /**
   * Draws either a soft radial studio glow OR a Paper Billions overhead cone spotlight
   * centered on the 9:16 Safe Action Box (default x=500, y=860).
   */
  function spotlight(g, opts) {
    const o = opts || {};
    const x = o.x !== undefined ? o.x : C.SAFE.cx;
    const y = o.y !== undefined ? o.y : 860;

    g.save();
    if (o.cone) {
      const topX = o.topX !== undefined ? o.topX : x;
      const topY = o.topY !== undefined ? o.topY : -40;
      const topW = o.topW !== undefined ? o.topW : 96;
      const botW = o.botW !== undefined ? o.botW : 660;
      const botY = o.botY !== undefined ? o.botY : C.FLOOR_Y + 60;

      const beamGrd = g.createLinearGradient(topX, topY, x, botY);
      beamGrd.addColorStop(0, 'rgba(255, 248, 210, 0.30)');
      beamGrd.addColorStop(1, 'rgba(255, 248, 210, 0.02)');
      g.fillStyle = beamGrd;
      g.beginPath();
      g.moveTo(topX - topW / 2, topY);
      g.lineTo(topX + topW / 2, topY);
      g.lineTo(x + botW / 2, botY);
      g.lineTo(x - botW / 2, botY);
      g.closePath();
      g.fill();
    } else {
      const r = o.r || 780;
      const grd = g.createRadialGradient(x, y, r * 0.05, x, y, r);
      grd.addColorStop(0, o.color || 'rgba(255, 253, 245, 0.16)');
      grd.addColorStop(1, 'rgba(255, 253, 245, 0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, C.W, C.H);
    }
    g.restore();
  }

  /**
   * Soft dark radial vignette around the 1080x1920 frame edges.
   */
  function vignette(g, intensity) {
    const a = C.clamp(intensity !== undefined ? intensity : 0.28, 0, 0.9);
    if (a <= 0.01) return;
    g.save();
    const grd = g.createRadialGradient(540, 880, 400, 540, 960, 1180);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(10,12,16,' + a + ')');
    g.fillStyle = grd;
    g.fillRect(0, 0, C.W, C.H);
    g.restore();
  }

  /**
   * Subtle animated editorial paper texture overlay.
   */
  function paperGrain(g, t, alpha) {
    const a = alpha || 0.018;
    if (a <= 0.002) return;
    const rand = C.rng(Math.floor((t || 0) * 12) + 101);
    g.save();
    g.fillStyle = 'rgba(20, 20, 20, ' + a + ')';
    for (let i = 0; i < 80; i++) {
      const gx = rand() * C.W;
      const gy = rand() * C.H;
      g.fillRect(gx, gy, 2, 2);
    }
    g.restore();
  }

  /**
   * 9:16 VERTICAL-FIRST COMIC SPLIT-SCREEN ENGINE ('2row' | '3row' | '2col' | '3col' | 'grid4')
   * Upgraded with Floor-Line Anchoring:
   * - World `y = C.FLOOR_Y (1320)` is mapped directly onto each panel's floor line (`fy`)
   *   so characters, rockets, and launch towers stand on the panel floor instead of floating
   *   or getting decapitated at the top border!
   * - Tuned default scales (`0.52` for `'2row'`, `0.38` for `'3row'`, `0.45` for `'2col'`)
   *   ensure full vertical and horizontal clearance inside every panel.
   */
  function split(g, lt, opts) {
    const o = opts || {};
    const panels = o.panels || [];
    const defaultLayout = panels.length === 3 ? '3row' : '2row';
    const layout = o.layout || defaultLayout;
    const borderLw = o.borderLw !== undefined ? o.borderLw : 6;
    const borderCol = o.borderColor || C.PAL.ink;

    // Safe vertical bounds so bottom title (y: 1450..1920) & top bar (y: 0..200) don't hide panels
    const topY = o.fullBleed ? 0 : 200;
    const botY = o.fullBleed ? C.H : 1420;
    const availH = botY - topY;

    let rects = [];
    if (layout === '2row') {
      const ph = availH / 2;
      rects = [
        { x: 0, y: topY, w: C.W, h: ph },
        { x: 0, y: topY + ph, w: C.W, h: ph }
      ];
    } else if (layout === '3row') {
      const ph = availH / 3;
      rects = [
        { x: 0, y: topY, w: C.W, h: ph },
        { x: 0, y: topY + ph, w: C.W, h: ph },
        { x: 0, y: topY + ph * 2, w: C.W, h: ph }
      ];
    } else if (layout === '2col') {
      // Narrow right column boundary (x: 0..880) so right UI buttons don't cover Col 2
      const totW = o.fullBleed ? C.W : 880;
      const pw = totW / 2;
      rects = [
        { x: 0, y: topY, w: pw, h: availH },
        { x: pw, y: topY, w: pw, h: availH }
      ];
    } else if (layout === '3col') {
      const totW = o.fullBleed ? C.W : 900;
      const pw = totW / 3;
      rects = [
        { x: 0, y: topY, w: pw, h: availH },
        { x: pw, y: topY, w: pw, h: availH },
        { x: pw * 2, y: topY, w: pw, h: availH }
      ];
    } else if (layout === 'grid4') {
      const totW = o.fullBleed ? C.W : 880;
      const pw = totW / 2;
      const ph = availH / 2;
      rects = [
        { x: 0, y: topY, w: pw, h: ph },
        { x: pw, y: topY, w: pw, h: ph },
        { x: 0, y: topY + ph, w: pw, h: ph },
        { x: pw, y: topY + ph, w: pw, h: ph }
      ];
    }

    // Backdrop fill for full 1080x1920 frame (including top header & bottom caption zone)
    g.save();
    g.fillStyle = o.backdrop || '#141824';
    g.fillRect(0, 0, C.W, C.H);

    // Subtle studio floor texture below botY so bottom caption zone looks intentional
    if (!o.fullBleed) {
      g.fillStyle = '#0F131D';
      g.fillRect(0, botY, C.W, C.H - botY);
      C.line(g, 0, topY, C.W, topY, { lw: borderLw, color: borderCol });
      C.line(g, 0, botY, C.W, botY, { lw: borderLw, color: borderCol });
    }

    rects.forEach((r, idx) => {
      const p = panels[idx];
      if (!p) return;

      const t0 = p.t0 || 0;
      if (lt < t0) return;

      const enterP = C.seg(lt, t0, t0 + (p.enterDur || 0.22), C.ease.outCubic);
      const slideY = p.slide === false ? 0 : (1 - enterP) * 44;

      g.save();
      g.beginPath();
      g.rect(r.x, r.y, r.w, r.h);
      g.clip();

      g.translate(0, slideY);
      g.globalAlpha = enterP;

      const fy = r.y + r.h * 0.82;

      // Panel background + internal floor line
      if (p.bg !== false) {
        const bgCol = p.bg || C.PAL.studioWall;
        const grd = g.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
        grd.addColorStop(0, C.shadeColor(bgCol, 4));
        grd.addColorStop(1, C.shadeColor(bgCol, -6));
        g.fillStyle = grd;
        g.fillRect(r.x, r.y, r.w, r.h);

        if (p.floor !== false) {
          g.fillStyle = p.floorColor || C.PAL.studioFloor;
          g.beginPath();
          g.moveTo(r.x, fy);
          g.quadraticCurveTo(r.x + r.w / 2, fy - 10, r.x + r.w, fy);
          g.lineTo(r.x + r.w, r.y + r.h);
          g.lineTo(r.x, r.y + r.h);
          g.closePath();
          g.fill();

          C.line(g, r.x, fy, r.x + r.w, fy, { lw: 3.5, color: C.PAL.ink });
        }
      }

      // Safe horizontal center inside panel (shifted left of right-side UI buttons if full width)
      const panelSafeCx = r.w > 900 ? 485 : r.x + r.w / 2;

      // Draw panel content with world FLOOR_Y (1320) anchored to panel floor `fy`
      if (typeof p.draw === 'function') {
        g.save();
        if (typeof C._setSplit === 'function') C._setSplit(true);
        const defaultScale =
          layout === '3row' ? 0.38 :
          layout === '2row' ? 0.52 :
          layout === '2col' ? 0.45 :
          layout === 'grid4' ? 0.40 : 0.46;
        const s = p.scale !== undefined ? p.scale : defaultScale;
        const refX = p.refX !== undefined ? p.refX : C.SAFE.cx;
        const refY = p.refY !== undefined ? p.refY : C.FLOOR_Y;
        const targetY = p.refY !== undefined ? (r.y + r.h * 0.54) : fy;

        g.translate(panelSafeCx, targetY);
        g.scale(s, s);
        g.translate(-refX, -refY);
        p.draw(g, r.w, r.h);
        if (typeof C._setSplit === 'function') C._setSplit(false);
        g.restore();
      }

      // Top label pill inside panel (drawn last so it always sits cleanly on top)
      if (p.title) {
        g.save();
        let titleSize = 25;
        g.font = '800 ' + titleSize + 'px "Nunito", sans-serif';
        const maxTitleW = Math.min(r.w - 36, r.w > 900 ? 720 : r.w - 28);
        let tw = g.measureText(p.title).width + 36;
        if (tw > maxTitleW && tw > 0) {
          titleSize = Math.max(17, Math.floor(titleSize * (maxTitleW / tw)));
          g.font = '800 ' + titleSize + 'px "Nunito", sans-serif';
          tw = g.measureText(p.title).width + 32;
        }
        const bx = panelSafeCx - tw / 2;
        const by = r.y + 16;
        C.roundRect(g, bx, by, tw, 42, 12, {
          fill: p.titleBg || '#FFFFFF',
          stroke: C.PAL.ink,
          lw: 3.5,
          shadow: true
        });
        g.fillStyle = p.titleColor || C.PAL.ink;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(p.title, panelSafeCx, by + 22);
        g.restore();
      }

      g.restore();

      // Crisp black divider border around panel
      g.save();
      g.strokeStyle = borderCol;
      g.lineWidth = borderLw;
      g.strokeRect(r.x, r.y, r.w, r.h);
      g.restore();
    });

    g.restore();
    vignette(g, 0.24);
  }

  /**
   * INTERACTIVE YOUTUBE SHORTS / INSTAGRAM REELS UI SAFE-ZONE OVERLAY (`CAM.safeZoneOverlay`)
   */
  function safeZoneOverlay(g, show) {
    if (!show) return;
    g.save();

    // 1. Top Status & Search Bar Dead Zone (y: 0..220)
    g.fillStyle = 'rgba(220, 38, 38, 0.22)';
    g.fillRect(0, 0, C.W, 220);
    g.font = '700 20px "Space Mono", monospace';
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.textAlign = 'center';
    g.fillText('TOP UI DEAD ZONE (STATUS / SEARCH BAR: y 0..220)', 540, 125);

    // 2. Right-Side Like / Comment / Share Button Column (x: 880..1080, y: 820..1700)
    g.fillStyle = 'rgba(220, 38, 38, 0.26)';
    g.fillRect(880, 820, 200, 880);
    const icons = ['LIKE', 'DISLIKE', 'COMMENTS', 'SHARE', 'REMIX', 'AUDIO'];
    icons.forEach((lbl, i) => {
      const iy = 900 + i * 135;
      C.circle(g, 980, iy, 34, { fill: 'rgba(15,23,42,0.65)', stroke: 'rgba(255,255,255,0.6)', lw: 2 });
      g.font = '700 15px "Space Mono", monospace';
      g.fillStyle = '#FFFFFF';
      g.textAlign = 'center';
      g.fillText(lbl, 980, iy + 52);
    });

    // 3. Bottom Title, @Handle & Caption Dead Zone (y: 1450..1920)
    g.fillStyle = 'rgba(220, 38, 38, 0.28)';
    g.fillRect(0, 1450, C.W, 470);
    g.textAlign = 'left';
    g.font = '800 26px "Nunito", sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillText('@YourChannelHandle  [Subscribe]', 60, 1525);
    g.font = '700 23px "Nunito", sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.fillText('Video Title & Captions sit here (y: 1450..1920) — Keep animations above!', 60, 1575);
    g.fillText('#shorts #infotainment #viral — Original Sound Ticker', 60, 1620);

    // 4. Golden Safe Action Box (C.SAFE: x 90..860, y 240..1340)
    g.strokeStyle = '#4ADE80';
    g.lineWidth = 3.5;
    g.setLineDash([14, 10]);
    g.strokeRect(C.SAFE.left, C.SAFE.top, C.SAFE.w, C.SAFE.h);
    g.setLineDash([]);

    // Raised Studio Floor Line (FLOOR_Y = 1320)
    C.line(g, C.SAFE.left, C.FLOOR_Y, C.SAFE.right, C.FLOOR_Y, {
      lw: 2.5,
      color: '#FACC15',
      dash: [8, 8]
    });

    // Optical Safe Center Crosshair (x=500, y=820)
    C.line(g, C.SAFE.cx - 18, C.SAFE.cy, C.SAFE.cx + 18, C.SAFE.cy, { lw: 2, color: '#4ADE80' });
    C.line(g, C.SAFE.cx, C.SAFE.cy - 18, C.SAFE.cx, C.SAFE.cy + 18, { lw: 2, color: '#4ADE80' });

    g.font = '700 18px "Space Mono", monospace';
    g.fillStyle = '#4ADE80';
    g.textAlign = 'left';
    g.fillText('C.SAFE ACTION BOX (x: 90..860, y: 240..1340 | cx: 500, floorY: 1320)', C.SAFE.left + 12, C.SAFE.top + 28);

    g.restore();
  }

  /**
   * Shot End Transitions ('fadeBlack', 'wipeLeft', 'wipeUp', 'iris')
   */
  function transition(g, lt, duration, type) {
    if (!type || type === 'cut') return;
    const dur = 0.18;
    if (lt < duration - dur) return;
    const p = C.seg(lt, duration - dur, duration, C.ease.inOutQuad);

    g.save();
    if (type === 'fadeBlack') {
      g.fillStyle = 'rgba(0,0,0,' + p + ')';
      g.fillRect(0, 0, C.W, C.H);
    } else if (type === 'wipeLeft') {
      g.fillStyle = '#07080A';
      g.fillRect(C.W * (1 - p), 0, C.W * p, C.H);
    } else if (type === 'wipeUp') {
      g.fillStyle = '#07080A';
      g.fillRect(0, C.H * (1 - p), C.W, C.H * p);
    } else if (type === 'iris') {
      const maxR = 1200;
      const r = Math.max(1, maxR * (1 - p));
      g.fillStyle = '#07080A';
      g.beginPath();
      g.rect(0, 0, C.W, C.H);
      g.arc(C.SAFE.cx, C.SAFE.cy, r, 0, Math.PI * 2, true);
      g.fill();
    }
    g.restore();
  }

  window.CAM = {
    begin,
    end,
    spotlight,
    vignette,
    paperGrain,
    split,
    safeZoneOverlay,
    transition
  };
})();