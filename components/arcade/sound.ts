/* Tiny WebAudio square-wave blips. Created lazily on first user gesture; silent if unsupported. */
type Kind = 'move' | 'open' | 'back' | 'deny' | 'on' | 'off';

const NOTES: Record<Kind, [number, number][]> = {
  move: [[520, 0.03]],
  open: [[660, 0.05], [880, 0.07]],
  back: [[440, 0.05], [330, 0.06]],
  deny: [[160, 0.09]],
  on: [[392, 0.09], [523, 0.09], [659, 0.09], [1046, 0.18]],
  off: [[523, 0.07], [330, 0.07], [196, 0.14]],
};

let ac: AudioContext | null = null;

export const audio = {
  play(kind: Kind, enabled: boolean) {
    if (!enabled || typeof window === 'undefined') return;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ac = ac ?? new Ctor();
      if (ac.state === 'suspended') void ac.resume();
      let t = ac.currentTime;
      for (const [f, d] of NOTES[kind]) {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'square';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.045, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(ac.destination);
        o.start(t);
        o.stop(t + d + 0.01);
        t += d;
      }
    } catch { /* audio unavailable */ }
  },
};
