/**
 * MODULE 10: UNIVERSAL CARTOON FOLEY SFX, AMBIENCE & HIGH-TEMPO SHORTS MUSIC ENGINE (engine/10_sound.js)
 * Native 9:16 Shorts & Reels Edition — Tuned for 0.7s-1.8s Hook Cuts & Variable 1.0s-4.0s Shots.
 * - In Shot Batches (shots_XX_YY.html): Renders Action-Synced SFX + Ambient Beds ONLY (mixMode: 'sfxOnly').
 * - In Master Music (bgm_master.html): Renders High-Tempo Situational Music ONLY (mixMode: 'bgmOnly' | 'bgmFull').
 * 100% compatible with Studio Player and headless Puppeteer/FFmpeg render_shots.js & render_bgm.js.
 */
(function () {
  const C = window.CORE || { clamp: (v, a, b) => Math.max(a, Math.min(b, v)), rng: () => Math.random };

  // --- 1. Musical Scales (Semitone offsets from root) ---
  const SCALES = {
    dorian:            [0, 2, 3, 5, 7, 9, 10],
    aeolian:           [0, 2, 3, 5, 7, 8, 10],
    harmonicMinor:     [0, 2, 3, 5, 7, 8, 11],
    phrygianDominant:  [0, 1, 4, 5, 7, 8, 10],
    lydian:            [0, 2, 4, 6, 7, 9, 11],
    mixolydian:        [0, 2, 4, 5, 7, 9, 10],
    ionian:            [0, 2, 4, 5, 7, 9, 11],
    pentatonicMinor:   [0, 3, 5, 7, 10],
    pentatonicMajor:   [0, 2, 4, 7, 9],
    blues:             [0, 3, 5, 6, 7, 10],
    hirajoshi:         [0, 2, 3, 7, 8],
    carnatic:          [0, 1, 4, 5, 7, 8, 11],
    wholeTone:         [0, 2, 4, 6, 8, 10]
  };

  // --- 2. Chord Progressions (Scale degree indices) ---
  const PROGRESSIONS = {
    editorialQuirky:   [0, 3, 4, 3],   // Smart Nonsense / OverSimplified bounce
    investigative:     [0, 5, 3, 4],   // Cleo Abram / Veritasium curious groove
    tickingSurvival:   [0, 1, 0, 4],   // Tense ticking thriller
    cinematicMinor:    [0, 5, 2, 6],   // Emotional / dramatic
    cosmicLydian:      [0, 1, 0, 1],   // Kurzgesagt space / wonder float
    heroicTriumph:     [0, 4, 5, 3],   // Uplifting climax payoff
    royalGrandeur:     [0, 3, 6, 4],   // Historical / empire
    darkDread:         [0, 1, 4, 0],   // Crisis / danger
    heistGroove:       [0, 2, 3, 4]    // Clever scheme / smuggling
  };

  const NOTE_OFFSETS = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
    'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
  };

  function parseRootMidi(keyStr) {
    if (!keyStr) return 50; // D3 default
    const m = String(keyStr).trim().match(/^([A-G][#b]?)/i);
    const semi = m && NOTE_OFFSETS[m[1]] !== undefined ? NOTE_OFFSETS[m[1]] : 2;
    return 48 + semi;
  }

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  // Deterministic noise buffer generator
  function createNoiseBuffer(ctx, dur, seed) {
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * (dur || 2.0)));
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    const rand = C.rng(seed || 101);
    for (let i = 0; i < len; i++) {
      data[i] = rand() * 2 - 1;
    }
    return buf;
  }

  /**
   * Analyzes a BGM cue object and fills in smart high-tempo defaults for Shorts/Reels
   * (Used by both `bgm_master.html` UI and the synthesizer).
   */
  function analyzeCueDNA(cue) {
    const c = cue || {};
    const sit = String(c.situation || c.mood || 'editorial').toLowerCase();

    let scaleName = c.scale || 'dorian';
    let progName = c.progression || 'editorialQuirky';
    let leadVoice = c.lead || 'pizzicato';
    let padVoice = c.pad || 'warmPad';
    let bassVoice = c.bass || 'uprightBass';
    let percStyle = c.perc || 'editorial';
    let bpm = c.bpm || 120; // Snappier default BPM for Shorts & Reels

    if (sit.includes('tension') || sit.includes('suspense') || sit.includes('mystery') || sit.includes('dark')) {
      scaleName = c.scale || 'harmonicMinor';
      progName = c.progression || 'tickingSurvival';
      leadVoice = c.lead || 'feltPiano';
      bassVoice = c.bass || 'subPulse';
      percStyle = c.perc || 'ticking';
      bpm = c.bpm || 124;
    } else if (sit.includes('danger') || sit.includes('crisis') || sit.includes('panic') || sit.includes('crash') || sit.includes('war') || sit.includes('catastrophe')) {
      scaleName = c.scale || 'phrygianDominant';
      progName = c.progression || 'darkDread';
      leadVoice = c.lead || 'synthPluck';
      bassVoice = c.bass || 'subPulse';
      percStyle = c.perc || 'ticking';
      bpm = c.bpm || 128;
    } else if (sit.includes('space') || sit.includes('cosmic') || sit.includes('awe') || sit.includes('wonder') || sit.includes('discovery')) {
      scaleName = c.scale || 'lydian';
      progName = c.progression || 'cosmicLydian';
      leadVoice = c.lead || 'marimba';
      padVoice = c.pad || 'glassPad';
      percStyle = c.perc || 'softShaker';
      bpm = c.bpm || 112;
    } else if (sit.includes('history') || sit.includes('empire') || sit.includes('ancient') || sit.includes('temple') || sit.includes('royal') || sit.includes('civilization')) {
      scaleName = c.scale || 'aeolian';
      progName = c.progression || 'royalGrandeur';
      leadVoice = c.lead || 'cello';
      percStyle = c.perc || 'march';
      bpm = c.bpm || 116;
    } else if (sit.includes('heist') || sit.includes('smuggl') || sit.includes('scheme') || sit.includes('investigative')) {
      scaleName = c.scale || 'dorian';
      progName = c.progression || 'heistGroove';
      leadVoice = c.lead || 'pizzicato';
      bassVoice = c.bass || 'uprightBass';
      percStyle = c.perc || 'editorial';
      bpm = c.bpm || 122;
    } else if (sit.includes('comedy') || sit.includes('ironic') || sit.includes('awkward') || sit.includes('silly') || sit.includes('cartoon')) {
      scaleName = c.scale || 'mixolydian';
      progName = c.progression || 'editorialQuirky';
      leadVoice = c.lead || 'pizzicato';
      bassVoice = c.bass || 'uprightBass';
      percStyle = c.perc || 'editorial';
      bpm = c.bpm || 124;
    } else if (sit.includes('sad') || sit.includes('tragic') || sit.includes('emotional') || sit.includes('melancholy')) {
      scaleName = c.scale || 'aeolian';
      progName = c.progression || 'cinematicMinor';
      leadVoice = c.lead || 'feltPiano';
      padVoice = c.pad || 'warmPad';
      percStyle = c.perc || 'softShaker';
      bpm = c.bpm || 96;
    } else if (sit.includes('triumph') || sit.includes('inspiring') || sit.includes('climax') || sit.includes('victory') || sit.includes('epic')) {
      scaleName = c.scale || 'ionian';
      progName = c.progression || 'heroicTriumph';
      leadVoice = c.lead || 'marimba';
      padVoice = c.pad || 'warmPad';
      percStyle = c.perc || 'editorial';
      bpm = c.bpm || 124;
    }

    return {
      scaleName,
      progName,
      leadVoice,
      padVoice,
      bassVoice,
      percStyle,
      bpm,
      key: c.key || 'D Minor',
      tension: c.tension !== undefined ? c.tension : 0.45,
      valence: c.valence !== undefined ? c.valence : 0.15
    };
  }

  /**
   * Builds the Scheduling Kernel `k` passed to `s.sfx(k, bt0)` and `scoreBGM(k)`.
   */
  function createKernel(ctx, dest, opts) {
    const o = opts || {};
    const mixMode = o.mixMode || 'sfxOnly'; // 'sfxOnly' | 'bgmOnly' | 'bgmFull'
    const timeOffset = o.timeOffset || 0;
    const maxDuration = o.duration || 600;

    // Master Buses
    const sfxBus = ctx.createGain();
    const bedBus = ctx.createGain();
    const bgmBus = ctx.createGain();

    sfxBus.gain.value = mixMode.startsWith('bgm') ? 0.0 : 0.88;
    bedBus.gain.value = mixMode.startsWith('bgm') ? 0.0 : 0.24;
    bgmBus.gain.value = mixMode === 'sfxOnly' ? 0.0 : 1.0;

    sfxBus.connect(dest);
    bedBus.connect(dest);
    bgmBus.connect(dest);

    const sharedNoise = createNoiseBuffer(ctx, 3.0, 777);

    function toCtxTime(t) {
      return t - timeOffset;
    }

    function makeEnv(gainParam, t0, attack, hold, release, peak) {
      const pk = Math.max(0.0001, peak || 0.3);
      const start = Math.max(0, t0);
      gainParam.setValueAtTime(0.0001, start);
      gainParam.linearRampToValueAtTime(pk, start + Math.max(0.002, attack));
      if (hold > 0) {
        gainParam.setValueAtTime(pk, start + attack + hold);
      }
      gainParam.exponentialRampToValueAtTime(0.0001, start + attack + hold + Math.max(0.01, release));
    }

    function playTone(bus, freq0, freq1, t0, dur, type, gain, filterFreq) {
      const ct = toCtxTime(t0);
      if (ct + dur < 0 || ct > maxDuration) return;
      const start = Math.max(0, ct);

      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(Math.max(20, freq0), start);
      if (freq1 && freq1 !== freq0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq1), start + dur);
      }

      makeEnv(g.gain, start, Math.min(0.008, dur * 0.14), dur * 0.25, dur * 0.6, gain || 0.25);

      if (filterFreq) {
        const flt = ctx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(filterFreq, start);
        osc.connect(flt);
        flt.connect(g);
      } else {
        osc.connect(g);
      }

      g.connect(bus);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    }

    function playNoise(bus, t0, dur, filterType, freq0, freq1, Q, gain, attack) {
      const ct = toCtxTime(t0);
      if (ct + dur < 0 || ct > maxDuration) return;
      const start = Math.max(0, ct);

      const src = ctx.createBufferSource();
      src.buffer = sharedNoise;
      src.loop = true;

      const flt = ctx.createBiquadFilter();
      flt.type = filterType || 'bandpass';
      flt.Q.value = Q || 1.5;
      flt.frequency.setValueAtTime(Math.max(40, freq0 || 800), start);
      if (freq1 && freq1 !== freq0) {
        flt.frequency.exponentialRampToValueAtTime(Math.max(40, freq1), start + dur);
      }

      const g = ctx.createGain();
      const att = attack !== undefined ? attack : Math.min(0.008, dur * 0.14);
      makeEnv(g.gain, start, att, dur * 0.2, Math.max(0.015, dur - att), gain || 0.25);

      src.connect(flt);
      flt.connect(g);
      g.connect(bus);

      src.start(start, (Math.abs(Math.sin(t0 * 37)) * 1.5) % 2.0);
      src.stop(start + dur + 0.03);
    }

    /**
     * 1. ACTION-SYNCED CARTOON & EDITORIAL FOLEY SFX (`k.play(nameOrRecipe, t, opts)`)
     */
    function play(nameOrRecipe, t, opts) {
      if (mixMode.startsWith('bgm')) return;
      const o = opts || {};
      const vol = (o.gain !== undefined ? o.gain : 0.48) * (o.volume !== undefined ? o.volume : 1.0);
      const t0 = t || 0;

      if (typeof nameOrRecipe === 'object' && nameOrRecipe !== null) {
        const r = nameOrRecipe;
        if (r.type === 'noise' || r.type === 'whoosh') {
          playNoise(sfxBus, t0, r.dur || 0.2, 'bandpass', r.freq || 420, r.endFreq || 1400, r.Q || 2, vol);
        } else {
          playTone(sfxBus, r.freq || 220, r.endFreq || r.freq || 110, t0, r.dur || 0.18, r.wave || 'triangle', vol);
        }
        return;
      }

      const n = String(nameOrRecipe || 'pop').toLowerCase();

      // --- A. EDITORIAL PAPER, STAMPS, TEXT & COMIC SPLITS ---
      if (n.includes('stamp') || n === 'thud' || n === 'impact' || n === 'gavelbang') {
        playTone(sfxBus, 150, 36, t0, 0.20, 'sine', vol * 1.2);
        playTone(sfxBus, 290, 62, t0, 0.08, 'triangle', vol * 0.75);
        playNoise(sfxBus, t0, 0.10, 'bandpass', 1450, 420, 1.2, vol * 0.68, 0.002);
      } else if (n.includes('flip') || n.includes('page') || n.includes('calendar') || n.includes('card')) {
        playNoise(sfxBus, t0, 0.08, 'bandpass', 1850, 4300, 2.2, vol * 0.62, 0.003);
        playTone(sfxBus, 620, 1250, t0 + 0.01, 0.04, 'sine', vol * 0.22);
      } else if (n.includes('tear') || n.includes('rip')) {
        playNoise(sfxBus, t0, 0.22, 'bandpass', 2400, 900, 3.0, vol * 0.65, 0.008);
      } else if (n.includes('highlight') || n.includes('marker') || n.includes('swipe')) {
        playNoise(sfxBus, t0, o.dur || 0.24, 'bandpass', 1650, 2300, 3.5, vol * 0.42, 0.02);
      } else if (n.includes('write') || n.includes('pen') || n.includes('scratch') || n.includes('scribble')) {
        for (let i = 0; i < 4; i++) {
          playNoise(sfxBus, t0 + i * 0.055, 0.04, 'bandpass', 2600 + (i % 2) * 600, 3200, 4.0, vol * 0.36, 0.002);
        }
      } else if (n.includes('type') || n.includes('key') || n === 'tick' || n === 'click') {
        playNoise(sfxBus, t0, 0.022, 'highpass', 2300, 2300, 1.5, vol * 0.52, 0.001);
        playTone(sfxBus, 1450, 460, t0, 0.02, 'triangle', vol * 0.38);
      } else if (n.includes('split') || n.includes('panel') || n.includes('slide')) {
        playNoise(sfxBus, t0, 0.14, 'bandpass', 420, 1500, 1.8, vol * 0.48, 0.015);
        playTone(sfxBus, 340, 115, t0 + 0.10, 0.055, 'triangle', vol * 0.52);

      // --- B. CHARTS, COUNTERS, MONEY & UI BADGES ---
      } else if (n.includes('counter') || n.includes('ticker')) {
        const count = o.count || 7;
        const step = (o.dur || 0.52) / count;
        for (let i = 0; i < count; i++) {
          playTone(sfxBus, 920 + i * 50, 1140 + i * 50, t0 + i * step, 0.025, 'sine', vol * 0.34);
        }
      } else if (n.includes('cash') || n.includes('chaching') || n.includes('register')) {
        playNoise(sfxBus, t0, 0.06, 'bandpass', 1200, 2400, 2.0, vol * 0.45, 0.002);
        playTone(sfxBus, 2093, 2093, t0 + 0.05, 0.20, 'sine', vol * 0.58);
        playTone(sfxBus, 2637, 2637, t0 + 0.12, 0.34, 'sine', vol * 0.68);
      } else if (n.includes('coin')) {
        playTone(sfxBus, 2400, 2400, t0, 0.11, 'sine', vol * 0.48);
        playTone(sfxBus, 3150, 3150, t0 + 0.035, 0.16, 'sine', vol * 0.48);
      } else if (n.includes('pop') || n.includes('bubble') || n.includes('badge')) {
        playTone(sfxBus, 360, 960, t0, 0.07, 'sine', vol * 0.58);
      } else if (n.includes('ding') || n.includes('chime') || n.includes('bell')) {
        playTone(sfxBus, 1568, 1568, t0, 0.40, 'sine', vol * 0.52);
        playTone(sfxBus, 3136, 3136, t0, 0.22, 'sine', vol * 0.22);
      } else if (n.includes('alarm') || n.includes('beep') || n.includes('alert')) {
        playTone(sfxBus, 880, 880, t0, 0.10, 'square', vol * 0.36, 2400);
        playTone(sfxBus, 880, 880, t0 + 0.13, 0.10, 'square', vol * 0.36, 2400);
      } else if (n.includes('crash') || n.includes('collapse') || n.includes('shatter') || n.includes('break')) {
        playTone(sfxBus, 185, 36, t0, 0.32, 'sawtooth', vol * 0.72, 620);
        playNoise(sfxBus, t0, 0.38, 'bandpass', 1800, 380, 1.0, vol * 0.78, 0.002);

      // --- C. COMEDY, SKITS & FAST WHIP TRANSITIONS ---
      } else if (n.includes('whoosh') || n.includes('swish')) {
        playNoise(sfxBus, t0, o.dur || 0.17, 'bandpass', 360, 1600, 2.2, vol * 0.58, 0.025);
      } else if (n.includes('record') || n.includes('scratch')) {
        playNoise(sfxBus, t0, 0.16, 'bandpass', 2200, 580, 4.0, vol * 0.68, 0.004);
        playTone(sfxBus, 980, 175, t0, 0.16, 'sawtooth', vol * 0.48, 1800);
      } else if (n.includes('rimshot')) {
        playNoise(sfxBus, t0, 0.055, 'bandpass', 920, 920, 1.5, vol * 0.58, 0.002);
        playTone(sfxBus, 165, 90, t0 + 0.10, 0.11, 'sine', vol * 0.68);
        playNoise(sfxBus, t0 + 0.24, 0.28, 'highpass', 3500, 3500, 1.2, vol * 0.42, 0.002);
      } else if (n.includes('trombone') || n.includes('sad') || n.includes('fail')) {
        const notes = [293.6, 277.2, 261.6, 246.9];
        notes.forEach((f, idx) => {
          playTone(sfxBus, f, idx === 3 ? f * 0.88 : f, t0 + idx * 0.22, idx === 3 ? 0.42 : 0.19, 'sawtooth', vol * 0.42, 1100);
        });
      } else if (n.includes('boing') || n.includes('spring')) {
        playTone(sfxBus, 185, 650, t0, 0.24, 'sine', vol * 0.52);
      } else if (n.includes('cricket')) {
        for (let c = 0; c < 2; c++) {
          for (let i = 0; i < 3; i++) {
            playTone(sfxBus, 4200, 4350, t0 + c * 0.30 + i * 0.032, 0.022, 'sine', vol * 0.30);
          }
        }

      // --- D. MACHINES, SCIENCE, SPACE & ERA ACTIONS ---
      } else if (n.includes('explos') || n.includes('boom') || n.includes('cannon')) {
        playTone(sfxBus, 115, 28, t0, 0.48, 'sine', vol * 1.15);
        playNoise(sfxBus, t0, 0.58, 'lowpass', 920, 140, 1.0, vol * 0.88, 0.004);
      } else if (n.includes('fire') || n.includes('flame') || n.includes('torch')) {
        playNoise(sfxBus, t0, 0.30, 'bandpass', 520, 1150, 1.4, vol * 0.52, 0.025);
      } else if (n.includes('spark') || n.includes('zap') || n.includes('laser') || n.includes('electric')) {
        playTone(sfxBus, 1650, 240, t0, 0.13, 'sawtooth', vol * 0.42, 2800);
        playNoise(sfxBus, t0, 0.08, 'highpass', 2400, 1200, 2.0, vol * 0.42, 0.002);
      } else if (n.includes('sword') || n.includes('clash') || n.includes('metal') || n.includes('anvil')) {
        playTone(sfxBus, 1850, 1820, t0, 0.22, 'triangle', vol * 0.52);
        playTone(sfxBus, 2780, 2740, t0, 0.16, 'sine', vol * 0.42);
        playNoise(sfxBus, t0, 0.055, 'highpass', 3000, 3000, 2.0, vol * 0.52, 0.001);
      } else if (n.includes('step') || n.includes('walk') || n.includes('march')) {
        const count = o.count || 4;
        const step = (o.dur || 0.75) / count;
        for (let i = 0; i < count; i++) {
          playNoise(sfxBus, t0 + i * step, 0.05, 'lowpass', 480, 220, 1.2, vol * 0.42, 0.002);
        }
      } else {
        let hash = 0;
        for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) % 1000;
        const baseFreq = 280 + (hash % 520);
        playTone(sfxBus, baseFreq, baseFreq * 1.35, t0, 0.08, 'triangle', vol * 0.46);
      }
    }

    /**
     * 2. UNIVERSAL SITUATIONAL AMBIENT BED (`k.bed(envType, t0, t1, opts)`)
     */
    function bed(envType, t0, t1, opts) {
      if (mixMode.startsWith('bgm')) return;
      const o = opts || {};
      const start = Math.max(0, toCtxTime(t0 || 0));
      const end = Math.min(maxDuration, toCtxTime(t1 !== undefined ? t1 : (t0 || 0) + 3));
      const dur = end - start;
      if (dur <= 0.04) return;

      const gainVal = o.gain !== undefined ? o.gain : 0.15;
      const kind = String(envType || 'studio').toLowerCase();

      const src = ctx.createBufferSource();
      src.buffer = sharedNoise;
      src.loop = true;

      const flt = ctx.createBiquadFilter();
      if (kind.includes('rain') || kind.includes('water') || kind.includes('ocean')) {
        flt.type = 'bandpass';
        flt.frequency.value = 650;
        flt.Q.value = 0.8;
      } else if (kind.includes('server') || kind.includes('lab') || kind.includes('space') || kind.includes('machine')) {
        flt.type = 'lowpass';
        flt.frequency.value = 180;
      } else if (kind.includes('wind') || kind.includes('nature') || kind.includes('outdoor')) {
        flt.type = 'bandpass';
        flt.frequency.value = 380;
        flt.Q.value = 1.5;
      } else {
        flt.type = 'lowpass';
        flt.frequency.value = 240;
      }

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(gainVal * 0.35, start + Math.min(0.10, dur * 0.2));
      g.gain.setValueAtTime(gainVal * 0.35, Math.max(start + 0.04, end - 0.10));
      g.gain.linearRampToValueAtTime(0.0001, end);

      src.connect(flt);
      flt.connect(g);
      g.connect(bedBus);

      src.start(start);
      src.stop(end + 0.02);
    }

    /**
     * 3. UNIVERSAL GENERATIVE MUSIC COMPOSER (`k.bgmScore(BGM_SCORE)`)
     * Composes full multi-instrument situational BGM for `bgm_master.html`.
     */
    function bgmScore(scoreObj) {
      if (mixMode === 'sfxOnly' || !scoreObj) return;
      const cues = scoreObj.cues || [];
      const auto = scoreObj.volume_automation || [];
      const baseDuck = mixMode === 'bgmFull' ? 1.0 : 0.48;

      // Apply master volume automation (supports VO ducking, swells, and 0.00 punchline drops)
      if (auto.length > 0) {
        auto.forEach((pt, idx) => {
          const rawT = Array.isArray(pt) ? pt[0] : (pt.time !== undefined ? pt.time : pt.t);
          const rawV = Array.isArray(pt) ? pt[1] : (pt.volume !== undefined ? pt.volume : pt.gain);
          const ct = toCtxTime(Number(rawT) || 0);
          const val = Math.max(0.0001, (Number(rawV) || 0) * (mixMode === 'bgmFull' ? 1.35 : 1.0));
          if (ct >= 0 && ct <= maxDuration) {
            if (idx === 0) bgmBus.gain.setValueAtTime(val, ct);
            else bgmBus.gain.linearRampToValueAtTime(val, ct);
          }
        });
      } else {
        bgmBus.gain.setValueAtTime(0.22 * baseDuck, 0);
      }

      cues.forEach((cue, cIdx) => {
        const dna = analyzeCueDNA(cue);
        const scale = SCALES[dna.scaleName] || SCALES.dorian;
        const prog = PROGRESSIONS[dna.progName] || PROGRESSIONS.editorialQuirky;
        const rootMidi = parseRootMidi(dna.key);
        const beatSec = 60 / C.clamp(dna.bpm || 120, 60, 180);
        const barSec = beatSec * 4;

        const tStart = cue.start_time !== undefined ? cue.start_time : (cue.start || 0);
        const tEnd = cue.end_time !== undefined ? cue.end_time : (cue.end || (tStart + 12));
        const rand = C.rng((cIdx + 1) * 97);

        for (let barT = tStart, barIdx = 0; barT < tEnd; barT += barSec, barIdx++) {
          const deg = prog[barIdx % prog.length] || 0;
          const chordRootSemi = scale[deg % scale.length];
          const chordThirdSemi = scale[(deg + 2) % scale.length] + (deg + 2 >= scale.length ? 12 : 0);
          const chordFifthSemi = scale[(deg + 4) % scale.length] + (deg + 4 >= scale.length ? 12 : 0);

          // 1. Warm Harmonic Pad (1 chord per bar)
          const padDur = Math.min(barSec, tEnd - barT);
          [chordRootSemi, chordThirdSemi, chordFifthSemi].forEach((semi) => {
            playTone(bgmBus, midiToFreq(rootMidi + semi), midiToFreq(rootMidi + semi), barT, padDur, 'sine', 0.065, 920);
          });

          // 2. Bassline (Walking upright bass / sub pulse on beats)
          for (let b = 0; b < 4; b++) {
            const bt = barT + b * beatSec;
            if (bt >= tEnd) break;
            const bSemi = b === 2 ? chordFifthSemi : chordRootSemi;
            const bFreq = midiToFreq(rootMidi - 12 + bSemi);
            playTone(bgmBus, bFreq, bFreq * 0.99, bt, beatSec * 0.72, 'triangle', 0.15, 390);
          }

          // 3. Lead Melody / Ostinato (Pizzicato / Marimba / Felt Piano / Pluck)
          const steps = 8; // Eighth notes
          const stepSec = barSec / steps;
          for (let s = 0; s < steps; s++) {
            const st = barT + s * stepSec;
            if (st >= tEnd) break;
            if (s === 0 || s === 2 || s === 3 || s === 5 || (s === 7 && rand() > 0.32)) {
              const noteChoices = [chordRootSemi, chordThirdSemi, chordFifthSemi, scale[(deg + 1) % scale.length] + 12];
              const pickSemi = noteChoices[(s + barIdx) % noteChoices.length];
              const mFreq = midiToFreq(rootMidi + 12 + pickSemi);
              const isShort = dna.leadVoice.includes('pizz') || dna.leadVoice.includes('marimba') || dna.leadVoice.includes('pluck');
              playTone(
                bgmBus,
                mFreq,
                mFreq,
                st,
                isShort ? stepSec * 0.55 : stepSec * 1.15,
                isShort ? 'triangle' : 'sine',
                0.125,
                1850
              );
            }
          }

          // 4. Situational Percussion Groove (Woodblock, Shaker, Ticking Clock, or Kick/Snare)
          if (dna.percStyle !== 'none') {
            for (let b = 0; b < 4; b++) {
              const bt = barT + b * beatSec;
              if (bt >= tEnd) break;
              if (dna.percStyle === 'ticking') {
                playTone(bgmBus, b % 2 === 0 ? 1150 : 880, 420, bt, 0.024, 'triangle', 0.095);
                playTone(bgmBus, 980, 420, bt + beatSec * 0.5, 0.02, 'triangle', 0.055);
              } else {
                if (b === 0 || b === 2) {
                  playTone(bgmBus, 118, 42, bt, 0.11, 'sine', 0.165);
                } else {
                  playTone(bgmBus, 800, 430, bt, 0.032, 'triangle', 0.085);
                }
                playNoise(bgmBus, bt + beatSec * 0.5, 0.032, 'highpass', 4500, 4500, 1.2, 0.042, 0.002);
              }
            }
          }
        }
      });
    }

    return {
      play,
      bed,
      bgmScore,
      situationalCue: (c) => bgmScore({ cues: [c] })
    };
  }

  /**
   * Live WebAudio playback for Studio Player (`shots_XX_YY.html` & `bgm_master.html`)
   */
  function live(scoreFn, startOffset, opts) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || typeof scoreFn !== 'function') return function () {};

    const ctx = new AudioCtx();
    const o = Object.assign({ timeOffset: startOffset || 0, duration: 900 }, opts || {});
    const k = createKernel(ctx, ctx.destination, o);
    scoreFn(k);

    return function stop() {
      try { ctx.close(); } catch (e) {}
    };
  }

  /**
   * Deterministic Offline 48kHz Audio Rendering for `render_shots.js` and `.wav` export
   */
  async function renderOffline(scoreFn, duration, sampleRate, opts) {
    const sr = sampleRate || 48000;
    const dur = Math.max(0.1, duration || 1.0);
    const totalFrames = Math.ceil(dur * sr);
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;

    const ctx = new OfflineCtx(2, totalFrames, sr);
    const o = Object.assign({ timeOffset: 0, duration: dur }, opts || {});
    const k = createKernel(ctx, ctx.destination, o);
    if (typeof scoreFn === 'function') scoreFn(k);

    const rendered = await ctx.startRendering();
    const chL = rendered.getChannelData(0);
    const chR = rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : chL;
    const inter = new Float32Array(rendered.length * 2);

    for (let i = 0; i < rendered.length; i++) {
      inter[i * 2] = C.clamp(chL[i], -1, 1);
      inter[i * 2 + 1] = C.clamp(chR[i], -1, 1);
    }

    return { inter, sr, buffer: rendered };
  }

  /**
   * Encodes stereo interleaved Float32 PCM into a standard 16-bit WAV Blob
   */
  function encodeWAV(interleaved, sampleRate) {
    const sr = sampleRate || 48000;
    const buffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(buffer);

    function writeStr(offset, str) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    let offset = 44;
    for (let i = 0; i < interleaved.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  window.SOUND = {
    analyzeCueDNA,
    live,
    renderOffline,
    encodeWAV
  };
})();