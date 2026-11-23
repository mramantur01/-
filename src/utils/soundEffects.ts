// Subtle synthesized Uber-style notification chimes via Web Audio API (no external audio assets)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq: number, startOffset: number, duration: number, volume = 0.08) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startOffset + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startOffset + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration + 0.02);
}

export function playRideChime(type: 'matched' | 'arrived' | 'completed') {
  try {
    if (type === 'matched') {
      // Crisp 2-note ascending Uber chime
      playTone(587.33, 0, 0.16, 0.07); // D5
      playTone(880.0, 0.12, 0.24, 0.08); // A5
    } else if (type === 'arrived') {
      // Warm 3-note arrival chime
      playTone(523.25, 0, 0.14, 0.07); // C5
      playTone(659.25, 0.12, 0.14, 0.07); // E5
      playTone(783.99, 0.24, 0.28, 0.08); // G5
    } else if (type === 'completed') {
      // Soft completion chord
      playTone(659.25, 0, 0.18, 0.06); // E5
      playTone(987.77, 0.14, 0.3, 0.07); // B5
    }
  } catch {
    // Ignore autoplay or Web Audio restrictions gracefully
  }
}
