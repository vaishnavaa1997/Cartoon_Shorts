// ============================================================================
// render_bgm.js — Fast Chunked Headless Situational Master BGM Renderer (48kHz WAV)
// Location: C:\Users\vaish\Videos\Video_Studio\Cartoon_Shorts\render_bgm.js
// ============================================================================
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

function writeWavHeader(fd, totalPcmBytes, sampleRate = 48000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + totalPcmBytes, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM
  header.writeUInt16LE(1, 20);  // Linear PCM
  header.writeUInt16LE(2, 22);  // 2 Channels (Stereo)
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 4, 28); // ByteRate
  header.writeUInt16LE(4, 32);  // BlockAlign
  header.writeUInt16LE(16, 34); // 16-bit
  header.write('data', 36);
  header.writeUInt32LE(totalPcmBytes, 40);
  fs.writeSync(fd, header, 0, 44, 0);
}

async function installChunkRenderer(page) {
  await page.evaluate(() => {
    const safeNum = (val, fallback = 0) => {
      const n = Number(val);
      return Number.isFinite(n) ? n : fallback;
    };

    function normAutomationPt(p) {
      if (Array.isArray(p)) {
        return [safeNum(p[0], 0), safeNum(p[1], 0.18)];
      }
      if (p && typeof p === 'object') {
        const rawT = p.time !== undefined ? p.time : (p.t !== undefined ? p.t : p.start_time);
        const rawV = p.volume !== undefined ? p.volume : (p.gain !== undefined ? p.gain : (p.vol !== undefined ? p.vol : p.v));
        return [safeNum(rawT, 0), safeNum(rawV, 0.18)];
      }
      return [0, 0.18];
    }

    function evalAutomationAt(pts, t) {
      if (!pts || !pts.length) return 0.18;
      if (t <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) {
        if (t <= pts[i][0]) {
          const p0 = pts[i - 1];
          const p1 = pts[i];
          const span = Math.max(1e-6, p1[0] - p0[0]);
          const u = (t - p0[0]) / span;
          return p0[1] + (p1[1] - p0[1]) * u;
        }
      }
      return pts[pts.length - 1][1];
    }

    window.__renderWindowedPcmB64 = async function (winStart, winEnd, preRoll, kitOpts, muteSfxAmb) {
      const sr = 48000;
      const ctxStart = Math.max(0, safeNum(winStart, 0) - safeNum(preRoll, 0));
      const actualPreRoll = winStart - ctxStart;
      const totalWinDur = Math.max(0.1, actualPreRoll + (winEnd - winStart));
      const origFn = window.scoreBGM || window.scoreSound;

      const windowedFn = (k) => {
        const origBgmScore = k.bgmScore;

        const proxyK = Object.assign({}, k, {
          bgmScore: function (score) {
            if (!score || !origBgmScore) return;
            const winCues = [];
            if (Array.isArray(score.cues)) {
              score.cues.forEach((c) => {
                if (!c) return;
                const t0 = safeNum(c.start_time !== undefined ? c.start_time : c.start, 0);
                const t1 = safeNum(c.end_time !== undefined ? c.end_time : c.end, t0 + 10);
                if (t1 <= ctxStart || t0 > winEnd + 0.25) return;

                const bpm = Math.max(20, safeNum(c.bpm, 118));
                const bar = (60 / bpm) * 4;
                let adjT0 = t0;
                if (adjT0 < ctxStart) {
                  const skipBars = Math.ceil((ctxStart - adjT0) / bar);
                  adjT0 += skipBars * bar;
                }
                const adjT1 = Math.min(t1, winEnd + 0.25);
                if (adjT1 > adjT0) {
                  winCues.push(Object.assign({}, c, { start_time: adjT0, end_time: adjT1, bpm }));
                }
              });
            }

            let winPts = [];
            if (Array.isArray(score.volume_automation) && score.volume_automation.length > 0) {
              const pts = score.volume_automation.map(normAutomationPt).sort((a, b) => a[0] - b[0]);
              const startVol = evalAutomationAt(pts, ctxStart);
              winPts.push([ctxStart, startVol]);
              for (let i = 0; i < pts.length; i++) {
                if (pts[i][0] > ctxStart + 0.001 && pts[i][0] <= winEnd + 1.0) {
                  winPts.push(pts[i]);
                }
              }
            }

            origBgmScore({ cues: winCues, volume_automation: winPts });
          },
        });

        if (muteSfxAmb) {
          proxyK.play = () => {};
          proxyK.bed = () => {};
        }

        origFn(proxyK);
      };

      const opts = Object.assign({}, kitOpts, { start: ctxStart, timeOffset: ctxStart });
      const res = await window.SOUND.renderOffline(windowedFn, totalWinDur, sr, opts);

      const skipSamples = Math.round(actualPreRoll * sr) * 2;
      const keepSamples = Math.round((winEnd - winStart) * sr) * 2;
      const inter = res.inter;
      const pcm16 = new Int16Array(keepSamples);

      for (let i = 0; i < keepSamples; i++) {
        const raw = inter[skipSamples + i];
        const s = Math.max(-1, Math.min(1, Number.isFinite(raw) ? raw : 0));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      const step = 32768;
      for (let i = 0; i < bytes.length; i += step) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
      }
      return btoa(binary);
    };
  });
}

async function renderPageInChunks(page, fd, totalDur, kitOpts, muteSfxAmb = false) {
  await installChunkRenderer(page);
  const CHUNK_SEC = 30.0;
  const PRE_ROLL = 2.5;
  const numChunks = Math.ceil(totalDur / CHUNK_SEC);
  let bytesWritten = 0;

  for (let c = 0; c < numChunks; c++) {
    const winStart = c * CHUNK_SEC;
    const winEnd = Math.min(totalDur, (c + 1) * CHUNK_SEC);
    process.stdout.write(
      `  -> Chunk ${c + 1}/${numChunks} (${winStart.toFixed(1)}s - ${winEnd.toFixed(1)}s)... `
    );
    const t0 = Date.now();
    const b64 = await page.evaluate(
      (ws, we, pr, opts, mute) => window.__renderWindowedPcmB64(ws, we, pr, opts, mute),
      winStart,
      winEnd,
      c === 0 ? 0 : PRE_ROLL,
      kitOpts,
      muteSfxAmb
    );
    const buf = Buffer.from(b64, 'base64');
    fs.writeSync(fd, buf);
    bytesWritten += buf.length;
    console.log(`done (${((Date.now() - t0) / 1000).toFixed(2)}s)`);
  }
  return bytesWritten;
}

async function main() {
  const project = process.argv[2];
  const reqMixMode = process.argv[3] || 'bgmOnly';

  if (!project) {
    console.error('Usage: node render_bgm.js <project_name> [bgmOnly|bgmFull]');
    process.exit(1);
  }

  const isFull = reqMixMode === 'bgmFull' || reqMixMode === 'full';
  const kitDir = __dirname;
  let projDir = path.join(kitDir, 'Projects', project);
  if (!fs.existsSync(projDir) && fs.existsSync(path.join(kitDir, 'projects', project))) {
    projDir = path.join(kitDir, 'projects', project);
  } else if (!fs.existsSync(projDir) && fs.existsSync(path.resolve(project))) {
    projDir = path.resolve(project);
  }

  const buildDir = path.join(projDir, 'build');
  const outWavPath = path.join(buildDir, 'bgm_master.wav');
  const tempWavPath = path.join(buildDir, '_rendering_bgm_master.wav');

  if (!fs.existsSync(projDir)) {
    console.error(`[ERROR] Project folder not found: ${projDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  try {
    if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size < 1024) {
      fs.unlinkSync(outWavPath);
    }
    if (fs.existsSync(tempWavPath)) {
      fs.unlinkSync(tempWavPath);
    }
  } catch (e) {}

  const bgmHtmlPath = path.join(projDir, 'bgm_master.html');
  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 0,
    args: [
      '--allow-file-access-from-files',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--js-flags=--max-old-space-size=4096',
    ],
  });

  let fd = null;
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(0);
    const sr = 48000;
    let totalBytes = 0;
    let totalDur = 0;

    fd = fs.openSync(tempWavPath, 'w');
    fs.writeSync(fd, Buffer.alloc(44));

    if (fs.existsSync(bgmHtmlPath)) {
      console.log(`[Shorts BGM] Found bgm_master.html — rendering in fast 30s studio chunks...`);
      await page.goto(pathToFileURL(bgmHtmlPath).href, { waitUntil: 'networkidle0', timeout: 0 });
      totalDur = await page.evaluate(
        () => Number(window.DURATION) || Number(window.BGM_SCORE && window.BGM_SCORE.total_duration) || 20.0
      );
      const mode = isFull ? 'bgmFull' : 'bgmOnly';
      totalBytes += await renderPageInChunks(page, fd, totalDur, { mixMode: mode }, false);
    } else {
      throw new Error(`bgm_master.html not found in ${projDir}`);
    }

    writeWavHeader(fd, totalBytes, sr);
    fs.closeSync(fd);
    fd = null;

    if (fs.existsSync(outWavPath)) fs.unlinkSync(outWavPath);
    fs.renameSync(tempWavPath, outWavPath);

    console.log(
      `\n[SUCCESS] Rendered ${totalDur.toFixed(2)}s Situational Shorts BGM (${(totalBytes / (1024 * 1024)).toFixed(2)} MB) -> ${outWavPath}`
    );
  } catch (err) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (e) {}
    }
    try {
      if (fs.existsSync(tempWavPath)) fs.unlinkSync(tempWavPath);
    } catch (e) {}
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});