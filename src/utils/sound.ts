export type SoundCue = 'hover' | 'select' | 'start' | 'hit' | 'paddle' | 'lost' | 'win' | 'gameover' | 'swim' | 'score' | 'hockeyHit' | 'hockeyWall' | 'goal' | 'raceCountdown' | 'raceImpact' | 'raceFinish' | 'viperPulse' | 'viperCoil' | 'viperFan' | 'viperRocket' | 'viperCannon' | 'viperEnemy' | 'viperBlast' | 'viperThrow' | 'viperEngine' | 'viperBoss';
let context: AudioContext | undefined;
let music: { bus: GainNode; filter: BiquadFilterNode } | undefined;
let musicTimer: number | undefined;
let muted = true;
try { muted = localStorage.getItem('insertcoin:muted') !== 'false'; } catch { /* use quiet default */ }
export const sound = {
  get muted() { return muted; },
  setMuted(value: boolean) {
    muted = value;
    try { localStorage.setItem('insertcoin:muted', String(value)); } catch { /* optional persistence */ }
    if (value) sound.stopMusic();
  },
  startMusic() {
    if (muted || music) return;
    try {
      context ??= new AudioContext(); void context.resume();
      const ctx = context;
      const bus = ctx.createGain(); bus.gain.value = 0.0001;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 3600; filter.Q.value = 0.4;
      bus.connect(filter); filter.connect(ctx.destination);
      bus.gain.setTargetAtTime(0.09, ctx.currentTime, 1.6); // Fade the night drive in, quietly.

      // Late-night synthwave in the "Nightcall" mould: 88 BPM, Fm - Db - Ab - Eb,
      // deep four-on-the-floor kick, offbeat gated chord stabs, steady 8th bass,
      // claps on 2 and 4 and a sparse, haunting lead.
      const beat = 60 / 88, bar = beat * 4;
      const progression = [
        { bass: 43.65, tones: [174.61, 207.65, 261.63], lead: [349.23, 311.13] }, // Fm
        { bass: 34.65, tones: [138.59, 174.61, 207.65], lead: [277.18, 261.63] }, // Db
        { bass: 51.91, tones: [155.56, 207.65, 261.63], lead: [311.13, 261.63] }, // Ab
        { bass: 38.89, tones: [155.56, 196.00, 233.08], lead: [233.08, 207.65] }, // Eb
      ];
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const nd = noiseBuffer.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const hit = (t: number, freq: number, decay: number, level: number, type: OscillatorType, glide = 1) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, t);
        if (glide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * glide, t + decay);
        g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + decay + 0.02);
      };
      const noise = (t: number, decay: number, level: number, hpFreq: number) => {
        const src = ctx.createBufferSource(); src.buffer = noiseBuffer;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpFreq;
        const g = ctx.createGain(); g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        src.connect(hp); hp.connect(g); g.connect(bus); src.start(t); src.stop(t + decay + 0.02);
      };
      let barIndex = 0;
      const scheduleBar = () => {
        if (!music) return;
        const start = ctx.currentTime + 0.06;
        const chord = progression[barIndex % progression.length];

        // Warm sustained pad under everything, breathing across the bar.
        const pad = ctx.createGain(); pad.gain.value = 0.0001; pad.connect(bus);
        pad.gain.linearRampToValueAtTime(0.05, start + beat);
        pad.gain.linearRampToValueAtTime(0.028, start + bar * 0.8);
        pad.gain.linearRampToValueAtTime(0.0001, start + bar);
        for (const tone of chord.tones) for (const det of [-0.5, 0.5]) {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(tone / 2 + det, start);
          osc.connect(pad); osc.start(start); osc.stop(start + bar + 0.05);
        }

        // The signature offbeat stab: short gated chord on every "and".
        for (let s = 0; s < 4; s++) {
          const t = start + s * beat + beat / 2;
          const stab = ctx.createGain(); stab.gain.value = 0.0001; stab.connect(bus);
          stab.gain.linearRampToValueAtTime(0.075, t + 0.012);
          stab.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.42);
          for (const tone of chord.tones) for (const det of [-0.6, 0.6]) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(tone + det, t);
            osc.connect(stab); osc.start(t); osc.stop(t + beat * 0.5);
          }
        }

        // Steady 8th-note sub bass, dropping an octave-up ghost at the bar's end.
        for (let s = 0; s < 8; s++) {
          const t = start + s * (beat / 2);
          hit(t, chord.bass * (s === 7 ? 2 : 1), beat / 2 * 0.85, 0.4, 'sawtooth');
        }

        for (let b = 0; b < 4; b++) {
          const t = start + b * beat;
          hit(t, 118, 0.3, 0.95, 'sine', 0.3);          // deep kick
          if (b % 2 === 1) noise(t, 0.19, 0.26, 1200);  // clap on 2 and 4
          if (b === 3) noise(t + beat / 2, 0.3, 0.07, 5000); // open hat lift
        }

        // Sparse two-note lead phrase, long and breathy, with a delay tap.
        chord.lead.forEach((freq, i) => {
          const t = start + (i === 0 ? beat * 0.5 : beat * 2.5);
          const voice = ctx.createGain(); voice.gain.value = 0.0001; voice.connect(bus);
          voice.gain.linearRampToValueAtTime(0.055, t + 0.12);
          voice.gain.linearRampToValueAtTime(0.04, t + beat);
          voice.gain.exponentialRampToValueAtTime(0.0001, t + beat * 1.7);
          for (const det of [-0.7, 0.7]) {
            const osc = ctx.createOscillator();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(freq + det, t);
            osc.connect(voice); osc.start(t); osc.stop(t + beat * 1.8);
          }
          hit(t + beat * 0.75, freq, beat * 0.6, 0.018, 'triangle'); // delay tap
        });

        barIndex++;
        musicTimer = window.setTimeout(scheduleBar, bar * 1000);
      };
      music = { bus, filter };
      scheduleBar();
    } catch { /* Background music is progressive enhancement. */ }
  },
  stopMusic() {
    if (musicTimer !== undefined) { window.clearTimeout(musicTimer); musicTimer = undefined; }
    if (music) {
      try {
        const now = context?.currentTime ?? 0;
        music.bus.gain.setTargetAtTime(0, now, 0.3);
        const dead = music;
        window.setTimeout(() => { try { dead.bus.disconnect(); dead.filter.disconnect(); } catch { /* already gone */ } }, 1500);
      } catch { /* ignore */ }
      music = undefined;
    }
  },
  play(cue: SoundCue) {
    if (muted) return;
    try {
      context ??= new AudioContext();
      void context.resume();
      const oscillator = context.createOscillator(), gain = context.createGain();
      const frequencies = { hover: 240, select: 660, start: 880, hit: 540, paddle: 320, lost: 140, win: 1040, gameover: 110, swim: 410, score: 920, hockeyHit: 460, hockeyWall: 220, goal: 760, raceCountdown: 580, raceImpact: 90, raceFinish: 720, viperPulse: 470, viperCoil: 285, viperFan: 640, viperRocket: 170, viperCannon: 125, viperEnemy: 345, viperBlast: 65, viperThrow: 780, viperEngine: 82, viperBoss: 195 };
      oscillator.type = 'square'; oscillator.frequency.setValueAtTime(frequencies[cue], context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequencies[cue] * 0.65, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.16);
    } catch { /* Audio is progressive enhancement. */ }
  },
};
