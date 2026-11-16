#!/usr/bin/env node
/**
 * CARTOON ENGINE STUDIO (9:16 VERTICAL SHORTS & REELS) — CRASH-PROOF AUTOMATED LOCAL RENDERER
 * Location: C:\Users\vaish\Videos\Video_Studio\Cartoon_Shorts\render_shots.js
 * Renders native 1080x1920 (9:16) @ 60fps MP4s.
 * Supports external ../../engine.js, 10-shot batch files (shots_XX_YY.html), and standalone shot files (shot_XX.html).
 *
 * Usage Examples:
 *   1. Render ALL shots across all shots_*.html / shot_*.html files + merge master (auto-skips already rendered shots):
 *      node render_shots.js my_short --merge
 *      (or: render_all.bat my_short)
 *
 *   2. Force re-render ALL shots even if build/shot_XX.mp4 already exists:
 *      node render_shots.js my_short --merge --force
 *
 *   3. Re-render ONLY Shot 14 (prefers standalone shot_14.html if newer, else shots_XX_YY.html):
 *      node render_shots.js my_short -shot 14
 *
 *   4. Render only one specific HTML file (batch or single shot):
 *      node render_shots.js my_short -batch shots_11_20.html
 *
 *   5. Render with SFX Only (no BGM) or without vo.wav:
 *      node render_shots.js my_short -mix sfxOnly
 *      node render_shots.js my_short -no-vo
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const puppeteer = require('puppeteer');

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const MAX_SHOT_RETRIES = 3;

// ---------- 1. Parse Command-Line Arguments ----------
const args = process.argv.slice(2);
if (!args.length || args[0].startsWith('-')) {
  console.log('Usage: node render_shots.js <project_name> [-shot N] [-batch file.html] [-mix vo|full|sfxOnly] [-no-vo] [--merge] [--force]');
  process.exit(1);
}

let rawTarget = args[0];
const getFlagVal = (flag, def = null) => {
  const idx = args.findIndex((a) => a === flag || a === '-' + flag || a === '--' + flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
};
const hasFlag = (flag) => args.some((a) => a === flag || a === '-' + flag || a === '--' + flag);

const targetShotNum = getFlagVal('shot') ? Number(getFlagVal('shot')) : null;
let targetBatchFile = getFlagVal('batch');
const mixMode = getFlagVal('mix', 'sfxOnly'); // Default to 'sfxOnly' for clean per-shot SFX batches
const disableVo = hasFlag('no-vo');
const doMerge = hasFlag('merge');
const forceRender = hasFlag('force');

// Support passing a direct HTML path as arg[0] (e.g., Projects\my_short\shots_01_10.html)
if (/\.html$/i.test(rawTarget)) {
  targetBatchFile = path.basename(rawTarget);
  rawTarget = path.dirname(rawTarget);
}

const projectName = path.basename(rawTarget);

// Natural numeric comparator so shots_11_20.html comes BEFORE shots_101_110.html
const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

// Resolve Kit & Project Directories (supports both 'Projects' and 'projects')
const kitDir = __dirname;
const engineJsPath = path.join(kitDir, 'engine.js');
let projectDir = path.join(kitDir, 'Projects', rawTarget);
if (!fs.existsSync(projectDir) && fs.existsSync(path.join(kitDir, 'projects', rawTarget))) {
  projectDir = path.join(kitDir, 'projects', rawTarget);
} else if (!fs.existsSync(projectDir) && fs.existsSync(path.resolve(rawTarget))) {
  projectDir = path.resolve(rawTarget);
}

if (!fs.existsSync(projectDir)) {
  console.error('[ERROR] Project folder not found:', projectDir);
  process.exit(1);
}

if (!fs.existsSync(engineJsPath)) {
  console.warn('[WARN] engine.js not found at:', engineJsPath);
  console.warn('       Make sure engine.js is saved in your root Cartoon_Shorts folder so <script src="../../engine.js"> loads!');
}

const buildDir = path.join(projectDir, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Clean up any leftover temp files from a previous interrupted run
try {
  for (const f of fs.readdirSync(buildDir)) {
    if (f.startsWith('_rendering_shot_') || f.startsWith('_temp_sfx_')) {
      try { fs.unlinkSync(path.join(buildDir, f)); } catch (e) {}
    }
  }
} catch (e) {}

// Locate vo.wav (checks project root or project/story/vo.wav)
let voPath = null;
if (!disableVo) {
  const candidates = [
    path.join(projectDir, 'vo.wav'),
    path.join(projectDir, 'story', 'vo.wav'),
    path.join(projectDir, 'vo.mp3'),
  ];
  voPath = candidates.find((p) => fs.existsSync(p)) || null;
}

// Locate Batch HTML files (shots_XX_YY.html) AND Standalone Single-Shot HTML files (shot_XX.html)
let htmlFiles = [];
if (targetBatchFile) {
  const cleanName = targetBatchFile.endsWith('.html') ? targetBatchFile : targetBatchFile + '.html';
  const explicitPath = path.join(projectDir, cleanName);
  if (!fs.existsSync(explicitPath)) {
    console.error('[ERROR] Specified file not found:', explicitPath);
    process.exit(1);
  }
  htmlFiles = [explicitPath];
} else if (targetShotNum !== 999999) {
  const allDirFiles = fs.readdirSync(projectDir);
  const batches = allDirFiles
    .filter((f) => /^shots_.*\.html$/i.test(f) || /^animation\.html$/i.test(f))
    .sort(naturalSort)
    .map((f) => path.join(projectDir, f));

  const singles = allDirFiles
    .filter((f) => /^shot_\d+\.html$/i.test(f))
    .sort(naturalSort)
    .map((f) => path.join(projectDir, f));

  htmlFiles = [...batches, ...singles];
}

if (!htmlFiles.length && !doMerge) {
  console.error('[ERROR] No shots_XX_YY.html or shot_XX.html files found in:', projectDir);
  process.exit(1);
}

// ---------- 2. Helper: Write 16-bit Stereo WAV from Float32 Interleaved Array ----------
function writeWavFile(filePath, interleaved, sampleRate = 48000) {
  const buf = Buffer.alloc(44 + interleaved.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + interleaved.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // Stereo
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(interleaved.length * 2, 40);
  let off = 44;
  for (let i = 0; i < interleaved.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    buf.writeInt16LE(s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), off);
  }
  fs.writeFileSync(filePath, buf);
}

// Check if a shot MP4 is already rendered, valid, and NOT truncated by a crash
function isShotAlreadyRendered(shotNum, expectedDur = null) {
  const padNum = String(shotNum).padStart(2, '0');
  const outMp4 = path.join(buildDir, `shot_${padNum}.mp4`);
  if (!fs.existsSync(outMp4)) return false;
  try {
    const stat = fs.statSync(outMp4);
    if (stat.size <= 15360) return false; // Reject tiny/empty files (<15KB)

    if (expectedDur && expectedDur > 0.2) {
      const out = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outMp4}"`,
        { stdio: ['ignore', 'pipe', 'ignore'] }
      )
        .toString()
        .trim();
      const actualDur = parseFloat(out);
      if (!Number.isFinite(actualDur) || Math.abs(actualDur - expectedDur) > 0.35) {
        console.warn(`  [RE-QUEUE] build/shot_${padNum}.mp4 looks incomplete (${actualDur.toFixed(2)}s vs expected ${expectedDur.toFixed(2)}s). Will re-render.`);
        return false;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Fast Regex Pre-Scan of HTML files to extract shot numbers & durations without launching Chrome
function quickScanHtmlShots(htmlPath) {
  const src = fs.readFileSync(htmlPath, 'utf8');
  const shots = [];
  const regex = /shot_number\s*:\s*(\d+)[\s\S]*?start\s*:\s*([\d.]+)[\s\S]*?end\s*:\s*([\d.]+)/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    const sNum = Number(m[1]);
    const start = Number(m[2]);
    const end = Number(m[3]);
    if (Number.isFinite(sNum) && Number.isFinite(start) && Number.isFinite(end) && end > start) {
      if (!shots.some((x) => x.shot_number === sNum)) {
        shots.push({ shot_number: sNum, start, end, duration: end - start });
      }
    }
  }
  return shots;
}

// Launch a fresh, memory-optimized Puppeteer Browser (1080x1920 9:16 Viewport)
async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    protocolTimeout: 0,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu-sandbox',
      '--allow-file-access-from-files',
      '--disable-web-security',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--js-flags=--max-old-space-size=8192',
    ],
  });
}

// Prepare Page for Deterministic 1080x1920 (9:16) Rendering
async function setupRenderPage(browser, htmlPath) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  page.setDefaultTimeout(0);

  page.on('pageerror', (err) => {
    console.error('\n[Browser JS Error]:', err.message);
  });

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 0 });

  const hasEngine = await page.evaluate(
    () => (typeof window.CORE !== 'undefined' || typeof window.C !== 'undefined' || typeof window.DK !== 'undefined') && typeof window.SOUND !== 'undefined'
  );
  if (!hasEngine) {
    throw new Error(`${path.basename(htmlPath)} failed to load ../../engine.js! Check ${engineJsPath}`);
  }

  await page.evaluate(async (w, h) => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    if (window.MAP && typeof window.MAP.preloadAll === 'function' && window.SHOTS) {
      await window.MAP.preloadAll(window.SHOTS);
    }
    if (window.E) { window.E.W = w; window.E.H = h; }
    if (window.CORE) { window.CORE.W = w; window.CORE.H = h; }
    // Ensure UI Safe-Zone preview overlay is never baked into rendered video
    if (window.CAM && typeof window.CAM.safeZoneOverlay === 'function') {
      window.CAM.safeZoneOverlay = function () {};
    }
    const ctrl = document.getElementById('controls');
    const wrap = document.getElementById('stage-wrap');
    const stage = document.getElementById('stage');
    if (ctrl) ctrl.style.display = 'none';
    if (wrap) {
      wrap.style.padding = '0';
      wrap.style.margin = '0';
    }
    if (stage) {
      stage.width = w;
      stage.height = h;
      stage.style.width = w + 'px';
      stage.style.height = h + 'px';
      stage.style.maxWidth = 'none';
      stage.style.maxHeight = 'none';
    }
  }, WIDTH, HEIGHT);

  return page;
}

// ---------- 3. Render a Single Shot via Puppeteer -> FFmpeg Pipe (Atomic Write) ----------
async function renderShot(page, shot, batchStart, batchSfxWavPath, sourceFileName) {
  const padNum = String(shot.shot_number).padStart(2, '0');
  const tempMp4 = path.join(buildDir, `_rendering_shot_${padNum}.mp4`);
  const outMp4 = path.join(buildDir, `shot_${padNum}.mp4`);
  const shotStartGlobal = Number(shot.start);
  const shotEndGlobal = Number(shot.end);
  const shotDur = Math.max(0.1, shotEndGlobal - shotStartGlobal);
  const shotStartLocal = Math.max(0, shotStartGlobal - batchStart);
  const totalFrames = Math.max(1, Math.round(shotDur * FPS));

  try {
    if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4);
  } catch (e) {}

  console.log(`\n[Shorts 9:16 Render] Shot ${padNum} (from ${sourceFileName}): "${shot.title || ''}" (${shotStartGlobal.toFixed(2)}s - ${shotEndGlobal.toFixed(2)}s | ${totalFrames} frames @ ${FPS}fps)`);

  const ffArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', '-', // Input 0: piped 1080x1920 JPEG frames from Puppeteer
    '-ss', shotStartLocal.toFixed(4),
    '-t', shotDur.toFixed(4),
    '-i', batchSfxWavPath, // Input 1: Offline Web Audio SFX WAV sliced to this shot
  ];

  if (voPath) {
    ffArgs.push(
      '-ss', shotStartGlobal.toFixed(4),
      '-t', shotDur.toFixed(4),
      '-i', voPath, // Input 2: Global vo.wav sliced to this shot
      '-filter_complex', '[1:a][2:a]amix=inputs=2:duration=first:dropout_transition=0,volume=2.0[aout]',
      '-map', '0:v:0',
      '-map', '[aout]'
    );
  } else {
    ffArgs.push('-map', '0:v:0', '-map', '1:a:0');
  }

  ffArgs.push(
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    tempMp4
  );

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', (d) => { ffErr += d.toString(); });

  const stageHandle = await page.$('#stage');
  const t0 = Date.now();

  try {
    for (let f = 0; f < totalFrames; f++) {
      const localT = shotStartLocal + f / FPS;
      await page.evaluate((t) => window.seek(t), localT);
      const jpegBuf = await stageHandle.screenshot({ type: 'jpeg', quality: 96 });
      const canWrite = ff.stdin.write(jpegBuf);
      if (!canWrite) {
        await new Promise((res) => ff.stdin.once('drain', res));
      }
      if ((f + 1) % 30 === 0 || f === totalFrames - 1) {
        const pct = (((f + 1) / totalFrames) * 100).toFixed(0);
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        process.stdout.write(`\r  -> Frame ${f + 1}/${totalFrames} (${pct}%) [${elapsed}s]`);
      }
    }
    ff.stdin.end();
  } catch (err) {
    try { ff.kill('SIGKILL'); } catch (e) {}
    try { if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4); } catch (e) {}
    throw err;
  }

  await new Promise((resolve, reject) => {
    ff.on('close', (code) => {
      if (code === 0 && fs.existsSync(tempMp4)) {
        try {
          if (fs.existsSync(outMp4)) fs.unlinkSync(outMp4);
          fs.renameSync(tempMp4, outMp4);
          console.log(`\n  [OK] Saved: build/shot_${padNum}.mp4`);
          resolve();
        } catch (renameErr) {
          reject(renameErr);
        }
      } else {
        try { if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4); } catch (e) {}
        console.error(`\n  [FFmpeg Error] Exit code ${code}:\n`, ffErr.slice(-600));
        reject(new Error('FFmpeg failed'));
      }
    });
  });
}

// ---------- 4. Concatenate All build/shot_XX.mp4 (+ bgm_master.wav if present) ----------
function mergeAllShots() {
  const shotMp4s = fs
    .readdirSync(buildDir)
    .filter((f) => /^shot_\d+\.mp4$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    });

  if (!shotMp4s.length) {
    console.error('[Merge] No build/shot_XX.mp4 files found to merge.');
    return;
  }

  const listFile = path.join(buildDir, 'concat_list.txt');
  const listContent = shotMp4s.map((f) => `file '${f}'`).join('\n');
  fs.writeFileSync(listFile, listContent, 'utf8');

  const finalOut = path.join(buildDir, 'final_episode_master.mp4');
  const bgmWav = path.join(buildDir, 'bgm_master.wav');

  // If bgm_master.html exists in project folder but bgm_master.wav hasn't been rendered yet, auto-render it!
  const bgmHtml = path.join(projectDir, 'bgm_master.html');
  const renderBgmScript = path.join(kitDir, 'render_bgm.js');
  if (!fs.existsSync(bgmWav) && fs.existsSync(bgmHtml) && fs.existsSync(renderBgmScript)) {
    console.log('\n[Merge] Auto-rendering build/bgm_master.wav via render_bgm.js...');
    try {
      execSync(`node "${renderBgmScript}" "${projectName}" bgmOnly`, { stdio: 'inherit' });
    } catch (e) {}
  }

  if (fs.existsSync(bgmWav)) {
    const tempStitched = path.join(buildDir, '_temp_stitched_sfx.mp4');
    console.log(`\n[Merge] Stitching ${shotMp4s.length} 9:16 shots + mixing build/bgm_master.wav...`);
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${tempStitched}"`, { stdio: 'inherit' });
    execSync(
      `ffmpeg -y -i "${tempStitched}" -i "${bgmWav}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0,volume=2.0[aout]" -map 0:v:0 -map "[aout]" -c:v copy -c:a aac -b:a 256k "${finalOut}"`,
      { stdio: 'inherit' });
    try { fs.unlinkSync(tempStitched); } catch (e) {}
  } else {
    console.log(`\n[Merge] Concatenating ${shotMp4s.length} rendered 9:16 shots into build/final_episode_master.mp4...`);
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${finalOut}"`, { stdio: 'inherit' });
  }

  console.log(`\n[SUCCESS] Final 9:16 YouTube Short / Instagram Reel Master saved at: ${finalOut}`);
}

// ---------- 5. Main Execution Pipeline ----------
(async () => {
  if (htmlFiles.length > 0 && targetShotNum !== 999999) {
    const shotOwnerMap = new Map();

    // Fast pre-scan of HTML files on disk
    for (const htmlPath of htmlFiles) {
      const mtimeMs = fs.statSync(htmlPath).mtimeMs;
      let scannedShots = quickScanHtmlShots(htmlPath);

      if (!scannedShots.length) {
        const tmpBrowser = await launchBrowser();
        try {
          const tmpPage = await setupRenderPage(tmpBrowser, htmlPath);
          scannedShots = await tmpPage.evaluate(() =>
            (window.SHOTS || []).map((s) => ({
              shot_number: Number(s.shot_number),
              start: Number(s.start),
              end: Number(s.end),
              duration: Number(s.end) - Number(s.start),
            }))
          );
        } finally {
          await tmpBrowser.close();
        }
      }

      for (const sObj of scannedShots) {
        const sNum = sObj.shot_number;
        if (targetShotNum !== null && sNum !== targetShotNum) continue;
        const prev = shotOwnerMap.get(sNum);
        const isStandalone = /^shot_\d+\.html$/i.test(path.basename(htmlPath));
        if (!prev || mtimeMs >= prev.mtimeMs || isStandalone) {
          shotOwnerMap.set(sNum, { htmlPath, mtimeMs, duration: sObj.duration });
        }
      }
    }

    if (targetShotNum !== null && !shotOwnerMap.has(targetShotNum)) {
      console.error(`[ERROR] Shot ${targetShotNum} was not found in any HTML file in ${projectDir}`);
      process.exit(1);
    }

    const skipExisting = !forceRender && targetShotNum === null && !targetBatchFile;

    for (const htmlPath of htmlFiles) {
      const ownedShots = [...shotOwnerMap.entries()]
        .filter(([, info]) => info.htmlPath === htmlPath)
        .map(([sNum, info]) => ({ sNum, duration: info.duration }))
        .sort((a, b) => a.sNum - b.sNum);

      if (!ownedShots.length) continue;

      const pendingShotNums = skipExisting
        ? ownedShots
            .filter(({ sNum, duration }) => {
              if (isShotAlreadyRendered(sNum, duration)) {
                const pad = String(sNum).padStart(2, '0');
                console.log(`[SKIP] Shot ${pad} already rendered (build/shot_${pad}.mp4)`);
                return false;
              }
              return true;
            })
            .map((x) => x.sNum)
        : ownedShots.map((x) => x.sNum);

      if (!pendingShotNums.length) continue;

      let browser = await launchBrowser();
      let page = null;
      const tempWav = path.join(buildDir, `_temp_sfx_${path.basename(htmlPath, '.html')}.wav`);

      try {
        page = await setupRenderPage(browser, htmlPath);

        const meta = await page.evaluate(() => ({
          batchStart: window.BATCH_START || 0,
          duration: window.DURATION || 10,
          shots: (window.SHOTS || []).map((s) => ({
            shot_number: Number(s.shot_number),
            title: s.title || '',
            start: Number(s.start),
            end: Number(s.end),
          })),
        }));

        const shotsToRender = meta.shots.filter((s) => pendingShotNums.includes(s.shot_number));
        if (!shotsToRender.length) {
          await browser.close();
          continue;
        }

        console.log(`\n========================================================`);
        console.log(`Loaded File: ${path.basename(htmlPath)} (Start: ${meta.batchStart}s, Duration: ${meta.duration.toFixed(2)}s)`);
        console.log(`Synthesizing Offline Web Audio SFX (mixMode: "${mixMode}")...`);

        const audioData = await page.evaluate(async (mMode, dur) => {
          const res = await window.SOUND.renderOffline(window.scoreSound, dur, 48000, { mixMode: mMode });
          return { sr: res.sr, samples: Array.from(res.inter) };
        }, mixMode, meta.duration);

        writeWavFile(tempWav, Float32Array.from(audioData.samples), audioData.sr);

        for (const shot of shotsToRender) {
          let attempt = 0;
          while (attempt < MAX_SHOT_RETRIES) {
            try {
              attempt++;
              await renderShot(page, shot, meta.batchStart, tempWav, path.basename(htmlPath));
              break;
            } catch (shotErr) {
              console.warn(`\n  [WARN] Shot ${shot.shot_number} interrupted on attempt ${attempt}/${MAX_SHOT_RETRIES}: ${shotErr.message}`);
              if (attempt >= MAX_SHOT_RETRIES) {
                throw shotErr;
              }
              console.log(`  [RECOVERY] Restarting fresh Chromium instance for Shot ${shot.shot_number}...`);
              try { await browser.close(); } catch (e) {}
              browser = await launchBrowser();
              page = await setupRenderPage(browser, htmlPath);
            }
          }
        }
      } finally {
        try { if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav); } catch (e) {}
        try { await browser.close(); } catch (e) {}
      }
    }
  }

  if (doMerge) {
    mergeAllShots();
  }
})();