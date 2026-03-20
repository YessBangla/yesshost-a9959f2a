import { useRef, useCallback, useEffect } from "react";

/** Generates a repeating ringtone using Web Audio API — no external files needed. */
export function useRingtone() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef(false);

  const playTone = useCallback((freq: number, duration: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const startRingtone = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    ctxRef.current = new AudioContext();

    const ring = () => {
      playTone(440, 0.15);
      setTimeout(() => playTone(520, 0.15), 180);
    };

    ring();
    intervalRef.current = setInterval(ring, 2000);
  }, [playTone]);

  const stopRingtone = useCallback(() => {
    playingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    ctxRef.current?.close();
    ctxRef.current = null;
  }, []);

  useEffect(() => () => stopRingtone(), [stopRingtone]);

  return { startRingtone, stopRingtone };
}
