/**
 * Web Audio API Synthesizer for Budget Reminders Ringing Bell Sound
 */
export function playBellChimeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Helper to synthesize standard clear brass chime tone
    const playChimeTone = (frequency: number, startTime: number, duration: number, volume: number = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);

      // Bell envelope: sharp attack, smooth exponential decay
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Multi-harmonic ringing chime sequence (Ding-Dong / Bell Alert)
    // 1. First chime (E5 = 659.25Hz)
    playChimeTone(659.25, now, 0.7, 0.3);
    playChimeTone(1318.51, now, 0.5, 0.1); // Harmonic 2nd

    // 2. Second higher chime (A5 = 880.00Hz)
    playChimeTone(880.00, now + 0.2, 1.1, 0.35);
    playChimeTone(1760.00, now + 0.2, 0.8, 0.12); // High harmonic resonance

    // 3. Final ring emphasis (C#6 = 1108.73Hz)
    playChimeTone(1108.73, now + 0.45, 1.3, 0.4);
  } catch (err) {
    console.warn('AudioContext playback error:', err);
  }
}
