type SoundName = 'click' | 'success' | 'error' | 'levelUp' | 'unlock' | 'flip';

let soundEnabled = true;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  gainValue = 0.15,
): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = gainValue;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration / 1000);
}

function playSequence(notes: { freq: number; start: number; dur: number }[], type: OscillatorType = 'square'): void {
  const ctx = getAudioContext();
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = note.freq;
    gain.gain.value = 0.12;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.start / 1000 + note.dur / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + note.start / 1000);
    osc.stop(ctx.currentTime + note.start / 1000 + note.dur / 1000);
  }
}

function playNoise(duration: number): void {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * (duration / 1000);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.08;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration / 1000);
}

function playSweep(startFreq: number, endFreq: number, duration: number): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = startFreq;
  osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration / 1000);
  gain.gain.value = 0.12;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration / 1000);
}

const SOUND_MAP: Record<SoundName, () => void> = {
  click: () => playTone(800, 50),
  success: () =>
    playSequence([
      { freq: 523, start: 0, dur: 100 },
      { freq: 659, start: 100, dur: 100 },
      { freq: 784, start: 200, dur: 100 },
    ]),
  error: () =>
    playSequence([
      { freq: 400, start: 0, dur: 100 },
      { freq: 200, start: 100, dur: 100 },
    ]),
  levelUp: () =>
    playSequence([
      { freq: 523, start: 0, dur: 100 },
      { freq: 659, start: 100, dur: 100 },
      { freq: 784, start: 200, dur: 100 },
      { freq: 1047, start: 300, dur: 200 },
    ]),
  unlock: () => playSweep(440, 880, 400),
  flip: () => playNoise(100),
};

export function playSound(name: SoundName): void {
  if (!soundEnabled) return;
  try {
    SOUND_MAP[name]();
  } catch {
    // Audio context not available
  }
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('robobuilder-sound', enabled ? '1' : '0');
  }
}

export function isSoundEnabled(): boolean {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('robobuilder-sound');
    if (stored !== null) {
      soundEnabled = stored === '1';
    }
  }
  return soundEnabled;
}
