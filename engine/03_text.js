/**
 * MODULE 03: SAFE-ZONE TEXT, BLACK PUNCHLINE SCREENS, BUBBLES & STAMPS (engine/03_text.js)
 * 9:16 Vertical (1080x1920) Typography Engine with camera-aware C.SAFE clamping,
 * rotated-bounds stamp protection, and high-contrast Paper Billions callout pills:
 *  1. TEXT.blackScreen    -> Pure black screen with handwritten brush-script kinetic text
 *  2. TEXT.speechBubble   -> Safe-zone clamped comic speech, thought, and shout bubbles
 *  3. TEXT.subtitle       -> Floating dialogue subtitles at y=1380 (above bottom title zone)
 *  4. TEXT.stamp          -> Rotated-safe slamming rubber stamps ("NO", "BANNED", "LOSS")
 *  5. TEXT.highlightQuote -> Document/News quote card (w=720) with animated yellow highlighter
 *  6. TEXT.callout / badge-> Measured safe-clamped arrows & Top Hook Banners (y=300)
 */
(function () {
  const C = window.CORE;

  /**
   * 1. BLACK KINETIC TEXT SCREEN (Paper Billions Handwritten Brush Style)
   * Centered in Safe Zone (x=500, y=820) with subtle warm vignette & word-by-word reveal.
   */
  function blackScreen(g, lt, opts) {
    const o = opts || {};
    const bg = o.bg || '#06070B';
    const rawText = String(o.text || '');
    let size = o.size || 74;
    const t0 = o.t0 !== undefined ? o.t0 : 0.05;
    const dur = o.dur !== undefined ? o.dur : 0.65;
    const fontName = o.font || '"Caveat", "Kalam", cursive';
    const centerX = o.x !== undefined ? C.clamp(o.x, 380, 520) : C.SAFE.cx;
    const centerY = o.y !== undefined ? C.clamp(o.y, 420, 1180) : C.SAFE.cy;
    const maxSafeW = o.maxW || 720;

    g.save();
    // Always draw black screen in clean 1080x1920 screen coordinates
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = bg;
    g.fillRect(0, 0, C.W, C.H);

    // Subtle Paper Billions warm center glow on black screen
    const glow = g.createRadialGradient(centerX, centerY, 40, centerX, centerY, 720);
    glow.addColorStop(0, 'rgba(255, 250, 240, 0.05)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, C.W, C.H);

    // Parse lines and color tokens: "{red:word here}"
    const lines = rawText.split('\n');
    const parsedLines = [];
    let totalWords = 0;

    const colorMap = {
      red: '#F87171',
      green: '#4ADE80',
      yellow: '#FACC15',
      blue: '#60A5FA',
      orange: '#FB923C',
      white: '#F8FAFC'
    };

    lines.forEach((lineStr) => {
      const words = [];
      const regex = /\{([a-zA-Z#0-9]+):([^}]+)\}|(\S+)/g;
      let m;
      while ((m = regex.exec(lineStr)) !== null) {
        if (m[1]) {
          const col = colorMap[m[1].toLowerCase()] || m[1];
          const subWords = m[2].trim().split(/\s+/);
          subWords.forEach((sw) => {
            words.push({ text: sw, color: col });
            totalWords++;
          });
        } else if (m[3]) {
          words.push({ text: m[3], color: o.color || '#F8FAFC' });
          totalWords++;
        }
      }
      parsedLines.push(words);
    });

    // Auto-fit font size so the longest line never overflows the 9:16 Safe Box
    g.font = '700 ' + size + 'px ' + fontName;
    let maxMeasuredW = 0;
    parsedLines.forEach((lineWords) => {
      const str = lineWords.map((w) => w.text).join(' ');
      const mw = g.measureText(str).width;
      if (mw > maxMeasuredW) maxMeasuredW = mw;
    });
    if (maxMeasuredW > maxSafeW && maxMeasuredW > 0) {
      size = Math.max(40, Math.floor(size * (maxSafeW / maxMeasuredW)));
      g.font = '700 ' + size + 'px ' + fontName;
    }

    const p = C.prog(lt, t0, t0 + dur);
    const visibleWords = o.instant ? totalWords : Math.floor(p * totalWords + 0.99);

    g.textBaseline = 'middle';
    const lineH = size * 1.25;
    const startY = centerY - ((parsedLines.length - 1) * lineH) / 2;

    let wordCounter = 0;
    let lastLineW = 0;
    let lastLineY = startY;

    parsedLines.forEach((lineWords, lineIdx) => {
      const fullLineStr = lineWords.map((w) => w.text).join(' ');
      const fullW = g.measureText(fullLineStr).width;
      let curX = centerX - fullW / 2;
      const curY = startY + lineIdx * lineH;
      lastLineW = fullW;
      lastLineY = curY;

      lineWords.forEach((wObj) => {
        wordCounter++;
        if (wordCounter <= visibleWords) {
          const wordStartT = t0 + ((wordCounter - 1) / Math.max(1, totalWords)) * dur;
          const wp = o.instant ? 1 : C.seg(lt, wordStartT, wordStartT + 0.16, C.ease.outBack);

          g.save();
          const wWidth = g.measureText(wObj.text + ' ').width;
          g.translate(curX + wWidth / 2, curY + (1 - wp) * 12);
          g.scale(0.88 + 0.12 * wp, 0.88 + 0.12 * wp);
          g.globalAlpha = C.clamp(wp, 0, 1);
          g.fillStyle = wObj.color;
          g.textAlign = 'center';
          g.fillText(wObj.text, 0, 0);
          g.restore();

          curX += wWidth;
        }
      });
    });

    // Optional hand-drawn underline scribble
    if (o.underline && p > 0.65) {
      const up = C.seg(lt, t0 + dur * 0.65, t0 + dur + 0.22, C.ease.outCubic);
      const uw = Math.min(lastLineW * 0.92, 660) * up;
      const ux = centerX - lastLineW * 0.46;
      const uy = lastLineY + size * 0.52;
      g.strokeStyle = o.underlineColor || '#FACC15';
      g.lineWidth = 4.5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(ux, uy);
      g.quadraticCurveTo(ux + uw * 0.5, uy - 8, ux + uw, uy + 3);
      g.stroke();
    }

    // Optional smaller subtitle below
    if (o.sub && lt > t0 + dur * 0.68) {
      const sp = C.seg(lt, t0 + dur * 0.68, t0 + dur + 0.25, C.ease.outCubic);
      g.save();
      g.globalAlpha = sp;
      g.font = '600 ' + Math.round(size * 0.46) + 'px ' + fontName;
      g.fillStyle = o.subColor || '#94A3B8';
      g.textAlign = 'center';
      g.fillText(o.sub, centerX, lastLineY + lineH * 0.95);
      g.restore();
    }

    g.restore();
  }

  /**
   * 2. SPEECH, THOUGHT & SHOUT BUBBLES (Oversimplified / Paper Billions Comic Style)
   * Auto-Clamped inside visible C.SAFE.
   */
  function speechBubble(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 || 0;
    if (lt < t0) return;

    const sc = C.pop(lt, t0, o.dur || 0.22);
    if (sc <= 0.01) return;

    const kind = o.kind || 'speech';
    let fontSize = o.size || 29;
    const rawLines = String(o.text || '').split('\n');

    g.save();
    g.font = (o.italic ? 'italic ' : '') + '800 ' + fontSize + 'px "Nunito", sans-serif';

    // Auto-wrap any overly long single line so bubble stays compact on 9:16
    const lines = [];
    const maxTextW = o.maxW || 520;
    rawLines.forEach((rl) => {
      if (g.measureText(rl).width <= maxTextW || rl.indexOf(' ') === -1) {
        lines.push(rl);
      } else {
        const words = rl.split(' ');
        let cur = '';
        words.forEach((w) => {
          const test = cur ? cur + ' ' + w : w;
          if (g.measureText(test).width > maxTextW && cur) {
            lines.push(cur);
            cur = w;
          } else {
            cur = test;
          }
        });
        if (cur) lines.push(cur);
      }
    });

    let maxW = 0;
    lines.forEach((l) => {
      const w = g.measureText(l).width;
      if (w > maxW) maxW = w;
    });

    const padX = o.padX || 28;
    const padY = o.padY || 18;
    const bw = Math.min(C.SAFE.w - 30, Math.max(o.minW || 140, maxW + padX * 2));
    const lineH = fontSize * 1.28;
    const bh = lines.length * lineH + padY * 2;

    // Clamp bubble center inside visible C.SAFE
    const x = C.safeX(o.x !== undefined ? o.x : C.SAFE.cx, bw / 2 + 12);
    const y = C.safeY(o.y !== undefined ? o.y : 620, bh / 2 + 12);

    const tailX = o.tailX !== undefined ? C.clamp(o.tailX, x - bw * 0.45, x + bw * 0.45) : x - 18;
    const tailY = o.tailY !== undefined ? o.tailY : y + bh / 2 + 52;

    g.translate(x, y);
    g.scale(sc, sc);
    g.translate(-x, -y);

    const bx = x - bw / 2;
    const by = y - bh / 2;

    g.fillStyle = o.fill || '#FFFFFF';
    g.strokeStyle = o.stroke || C.PAL.ink;
    g.lineWidth = 3.5;
    g.lineJoin = 'round';

    if (kind === 'thought') {
      C.circle(g, C.lerp(x, tailX, 0.55), C.lerp(y + bh / 2, tailY, 0.45), 11, { fill: o.fill || '#FFFFFF' });
      C.circle(g, C.lerp(x, tailX, 0.82), C.lerp(y + bh / 2, tailY, 0.82), 6, { fill: o.fill || '#FFFFFF' });
    } else if (o.tail !== false) {
      const baseX = C.clamp(tailX, bx + 26, bx + bw - 26);
      const baseY = tailY >= y ? by + bh - 4 : by + 4;
      g.beginPath();
      g.moveTo(baseX - 16, baseY);
      g.lineTo(tailX, tailY);
      g.lineTo(baseX + 16, baseY);
      g.closePath();
      g.fill();
      g.stroke();
    }

    C.roundRect(g, bx, by, bw, bh, kind === 'thought' ? 32 : 18, {
      fill: o.fill || '#FFFFFF',
      stroke: o.stroke || C.PAL.ink,
      lw: 3.5,
      grad: false,
      shadow: true
    });

    if (kind !== 'thought' && o.tail !== false) {
      const baseX = C.clamp(tailX, bx + 26, bx + bw - 26);
      const baseY = tailY >= y ? by + bh - 3 : by + 3;
      g.fillStyle = o.fill || '#FFFFFF';
      g.fillRect(baseX - 14, baseY - 4, 28, 8);
    }

    g.fillStyle = o.color || C.PAL.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const textStartY = y - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => {
      g.fillText(l, x, textStartY + i * lineH);
    });

    g.restore();
  }

  /**
   * 3. FLOATING HANDWRITTEN SUBTITLE / DIALOGUE CAPTION
   * Default y = 1380 (Right below the 1320 floor line, safely above the 1450+ YouTube Title overlay!)
   */
  function subtitle(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 || 0;
    if (lt < t0) return;
    if (o.t1 && lt > o.t1) return;

    const p = C.seg(lt, t0, t0 + 0.18, C.ease.outCubic);
    let size = o.size || 46;
    const text = String(o.text || '');

    g.save();
    g.font = '700 ' + size + 'px "Caveat", "Kalam", cursive';
    let tw = g.measureText(text).width;
    if (tw > 700 && tw > 0) {
      size = Math.max(30, Math.floor(size * (700 / tw)));
      g.font = '700 ' + size + 'px "Caveat", "Kalam", cursive';
      tw = g.measureText(text).width;
    }

    const x = C.safeX(o.x !== undefined ? o.x : C.SAFE.cx, tw / 2 + 16);
    const y = C.clamp(o.y !== undefined ? o.y : 1380, 280, 1410);

    g.globalAlpha = p;
    g.translate(x, y + (1 - p) * 12);
    g.textAlign = o.align || 'center';
    g.textBaseline = 'middle';

    g.lineWidth = 7;
    g.strokeStyle = o.outline || 'rgba(15, 18, 24, 0.88)';
    g.lineJoin = 'round';
    g.strokeText(text, 0, 0);

    g.fillStyle = o.color || '#FFFFFF';
    g.fillText(text, 0, 0);
    g.restore();
  }

  /**
   * 4. SLAMMING RUBBER STAMP ("NO", "BANNED", "CAUGHT MID-AIR!", "APPROVED")
   * Upgraded with Rotated Bounding-Box Clamping & Camera-Zoom Awareness so stamps
   * NEVER clip on the left or right edge of the canvas!
   */
  function stamp(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 !== undefined ? o.t0 : 0.35;
    if (lt < t0) return;

    const dt = lt - t0;
    const slamP = C.seg(lt, t0, t0 + 0.16, C.ease.outBack);
    const scale = C.lerp(1.85, 1.0, C.clamp(dt / 0.13, 0, 1));

    const angle = (o.angle !== undefined ? o.angle : -10) * (Math.PI / 180);
    const col = o.color || C.PAL.red;
    const text = String(o.text || 'APPROVED').toUpperCase();
    let size = o.size || 56;

    // Determine available safe width inside current camera viewport
    const safeB = C.getSafeBoundsX ? C.getSafeBoundsX() : { minX: C.SAFE.left, maxX: C.SAFE.right };
    const availW = Math.min(560, (safeB.maxX - safeB.minX) * 0.84);

    g.save();
    g.font = '900 ' + size + 'px "Fredoka", "Nunito", sans-serif';
    let tw = g.measureText(text).width;
    if (tw > availW - 56 && tw > 0) {
      size = Math.max(28, Math.floor(size * ((availW - 56) / tw)));
      g.font = '900 ' + size + 'px "Fredoka", "Nunito", sans-serif';
      tw = g.measureText(text).width;
    }

    const w = Math.max(o.w || 0, tw + 52);
    const h = o.h || size + 32;

    // Compute rotated half-extents so tilted stamps never cross SAFE.left or SAFE.right
    const cosA = Math.abs(Math.cos(angle));
    const sinA = Math.abs(Math.sin(angle));
    const rotHalfW = (w * cosA + h * sinA) / 2 + 14;
    const rotHalfH = (w * sinA + h * cosA) / 2 + 14;

    const x = C.safeX(o.x !== undefined ? o.x : C.SAFE.cx, rotHalfW);
    const y = C.safeY(o.y !== undefined ? o.y : 760, rotHalfH);

    // Dust puff particles on impact
    if (dt > 0.05 && dt < 0.48) {
      const puffP = C.prog(dt, 0.05, 0.48);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const dist = 70 + puffP * 95;
        const px = x + Math.cos(a) * dist;
        const py = y + Math.sin(a) * dist * 0.65;
        const pr = (1 - puffP) * 14;
        g.fillStyle = 'rgba(220, 215, 205, ' + (1 - puffP) * 0.65 + ')';
        g.beginPath();
        g.arc(px, py, pr, 0, Math.PI * 2);
        g.fill();
      }
    }

    g.translate(x, y);
    g.rotate(angle);
    g.scale(scale, scale);
    g.globalAlpha = C.clamp(slamP, 0, 1);

    C.roundRect(g, -w / 2, -h / 2, w, h, 10, {
      fill: o.fill || 'rgba(255, 250, 245, 0.95)',
      stroke: col,
      grad: false,
      lw: 6,
      shadow: true
    });

    C.roundRect(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 6, {
      fill: false,
      stroke: col,
      lw: 2.5
    });

    g.fillStyle = col;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 2);

    g.restore();
  }

  /**
   * 5. HIGHLIGHTER QUOTE (Newspaper / Legal Document / Report Quote Card)
   */
  function highlightQuote(g, lt, opts) {
    const o = opts || {};
    const w = Math.min(C.SAFE.w - 30, o.w || 700);
    const h = o.h || 250;
    const x = C.safeX(o.x !== undefined ? o.x : 485, w / 2 + 10);
    const y = C.safeY(o.y !== undefined ? o.y : 780, h / 2 + 10);
    const t0 = o.t0 || 0.15;
    const hp = C.seg(lt, t0, t0 + (o.dur || 0.55), C.ease.outCubic);

    g.save();
    C.roundRect(g, x - w / 2, y - h / 2, w, h, 10, {
      fill: o.paperColor || '#FAF7F0',
      stroke: C.PAL.ink,
      lw: 3.5,
      shadow: true
    });

    if (o.source) {
      g.font = '700 19px "Space Mono", monospace';
      g.fillStyle = '#64748B';
      g.textAlign = 'left';
      g.fillText(o.source.toUpperCase(), x - w / 2 + 32, y - h / 2 + 38);
      C.line(g, x - w / 2 + 32, y - h / 2 + 52, x + w / 2 - 32, y - h / 2 + 52, {
        lw: 1.5,
        color: '#CBD5E1'
      });
    }

    const lines = String(o.text || '').split('\n');
    let fontSize = o.size || 28;
    g.font = 'italic 700 ' + fontSize + 'px "Merriweather", Georgia, serif';

    const maxLineSpace = w - 76;
    lines.forEach((l) => {
      const mw = g.measureText(l).width;
      if (mw > maxLineSpace && mw > 0) {
        fontSize = Math.max(18, Math.floor(fontSize * (maxLineSpace / mw)));
        g.font = 'italic 700 ' + fontSize + 'px "Merriweather", Georgia, serif';
      }
    });

    g.textAlign = 'left';
    g.textBaseline = 'middle';

    const lineH = fontSize * 1.45;
    const startY = y + (o.source ? 16 : 0) - ((lines.length - 1) * lineH) / 2;
    const leftX = x - w / 2 + 38;

    lines.forEach((l, idx) => {
      const ly = startY + idx * lineH;
      const lw = g.measureText(l).width;

      const lineP = C.clamp(hp * lines.length - idx, 0, 1);
      if (lineP > 0) {
        g.fillStyle = o.highlightColor || C.PAL.highlighter;
        g.fillRect(leftX - 6, ly - fontSize * 0.58, (lw + 12) * lineP, fontSize * 1.15);
      }

      g.fillStyle = C.PAL.ink;
      g.fillText(l, leftX, ly);
    });

    g.restore();
  }

  /**
   * 6. HAND-DRAWN CALLOUT ARROW & LABEL (Measured Safe-Zone Clamping + High-Contrast Backing)
   * Fixes left/right edge clipping (00:28, 00:31), overlapping rocket text (00:02),
   * and invisible dark text on space/blueprint backgrounds (00:51, 01:04).
   */
  function callout(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 || 0;
    if (lt < t0) return;

    const p = C.seg(lt, t0, t0 + 0.30, C.ease.outCubic);
    const rawFrom = o.from || [360, 560];
    const to = o.to || [500, 740];

    const mainText = String(o.text || '');
    const subText = String(o.sub || '');
    let size = o.size || 36;

    g.save();
    g.globalAlpha = p;

    // 1. Measure both lines FIRST and auto-fit within 480px max width
    const maxAllowedW = o.maxW || 460;
    g.font = '800 ' + size + 'px "Caveat", "Kalam", cursive';
    let mainW = g.measureText(mainText).width;
    if (mainW > maxAllowedW && mainW > 0) {
      size = Math.max(24, Math.floor(size * (maxAllowedW / mainW)));
      g.font = '800 ' + size + 'px "Caveat", "Kalam", cursive';
      mainW = g.measureText(mainText).width;
    }

    const subSize = Math.round(size * 0.60);
    g.font = '800 ' + subSize + 'px "Nunito", sans-serif';
    const subW = subText ? g.measureText(subText).width : 0;

    const cardW = Math.max(mainW, subW) + 32;
    const cardH = (subText ? size + subSize + 24 : size + 18);

    // 2. Clamp card center inside camera-aware C.SAFE so it NEVER clips off-screen
    const fx = C.safeX(rawFrom[0], cardW / 2 + 12);
    const fy = C.safeY(rawFrom[1], cardH / 2 + 16);

    // Detect if background behind callout/arrow is dark
    const darkBg = C.isCanvasDarkAt ? C.isCanvasDarkAt(g, to[0], to[1]) : false;
    let arrowCol = o.color || (darkBg ? '#FACC15' : C.PAL.ink);
    if ((arrowCol === C.PAL.ink || arrowCol === '#18181B') && darkBg) {
      arrowCol = '#FACC15';
    }

    // 3. Draw curved arrow from card edge toward target `to`
    const arrowStartY = to[1] >= fy ? fy + cardH / 2 - 2 : fy - cardH / 2 + 2;
    C.arrow(g, fx, arrowStartY, to[0], to[1], {
      p: p,
      color: arrowCol,
      lw: 4.0,
      curve: o.curve !== false,
      curveY: o.curveY !== undefined ? o.curveY : -26
    });

    // 4. Draw clean Paper Billions high-contrast label card so text is 100% legible over any prop/sky
    if (mainText || subText) {
      C.roundRect(g, fx - cardW / 2, fy - cardH / 2, cardW, cardH, 12, {
        fill: o.bg || 'rgba(255, 252, 245, 0.95)',
        stroke: C.PAL.ink,
        lw: 3.2,
        grad: false,
        shadow: true
      });

      const textCol = (o.color && o.color !== '#FFFFFF' && o.color !== '#F8FAFC') ? o.color : C.PAL.ink;
      g.font = '800 ' + size + 'px "Caveat", "Kalam", cursive';
      g.fillStyle = textCol;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(mainText, fx, subText ? fy - subSize * 0.52 : fy + 1);

      if (subText) {
        g.font = '800 ' + subSize + 'px "Nunito", sans-serif';
        g.fillStyle = o.subColor || '#475569';
        g.fillText(subText, fx, fy + size * 0.44);
      }
    }

    g.restore();
  }

  /**
   * 7. CLEAN PILL BADGE / TOP HOOK BANNER / CHAPTER HEADER
   * Default position: x = 500, y = 300 (Top of Safe Zone, below y=220 status bar)
   */
  function badge(g, lt, opts) {
    const o = opts || {};
    const t0 = o.t0 || 0;
    if (lt < t0) return;

    const sc = C.pop(lt, t0, 0.24);
    let size = o.size || 28;
    const text = String(o.text || '');

    const safeB = C.getSafeBoundsX ? C.getSafeBoundsX() : { minX: C.SAFE.left, maxX: C.SAFE.right };
    const maxAllowedW = Math.min(640, (safeB.maxX - safeB.minX) * 0.88);

    g.save();
    g.font = '800 ' + size + 'px "Nunito", sans-serif';
    let tw = g.measureText(text).width;
    if (tw > maxAllowedW - 44 && tw > 0) {
      size = Math.max(18, Math.floor(size * ((maxAllowedW - 44) / tw)));
      g.font = '800 ' + size + 'px "Nunito", sans-serif';
      tw = g.measureText(text).width;
    }

    const w = Math.max(o.w || 0, tw + 44);
    const h = o.h || size + 26;
    const x = C.safeX(o.x !== undefined ? o.x : C.SAFE.cx, w / 2 + 10);
    const y = C.safeY(o.y !== undefined ? o.y : 300, h / 2 + 10);

    g.translate(x, y);
    g.scale(sc, sc);

    C.roundRect(g, -w / 2, -h / 2, w, h, o.rad !== undefined ? o.rad : h / 2, {
      fill: o.fill || '#FFFFFF',
      stroke: o.stroke || C.PAL.ink,
      lw: 3.5,
      grad: false,
      shadow: true
    });

    g.fillStyle = o.color || C.PAL.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 2);
    g.restore();
  }

  window.TEXT = {
    blackScreen,
    speechBubble,
    subtitle,
    stamp,
    highlightQuote,
    callout,
    badge
  };
})();