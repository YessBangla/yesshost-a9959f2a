/** Shared helpers for showing exact message times and reply delays. */

export function formatStamp(iso: string, bn: boolean) {
  const d = new Date(iso);
  return d.toLocaleString(bn ? "bn-BD" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatClock(iso: string, bn: boolean) {
  return new Date(iso).toLocaleTimeString(bn ? "bn-BD" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Human readable gap between two timestamps, e.g. "+12m" / "+২ ঘন্টা". */
export function formatGap(fromIso: string | null | undefined, toIso: string, bn: boolean): string | null {
  if (!fromIso) return null;
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return bn ? `+${sec} সেকেন্ড` : `+${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return bn ? `+${min} মিনিট` : `+${min}m`;
  const hr = Math.floor(min / 60);
  const rem = min % 60;
  if (hr < 24) return bn ? `+${hr} ঘন্টা ${rem} মিনিট` : `+${hr}h ${rem}m`;
  const day = Math.floor(hr / 24);
  return bn ? `+${day} দিন ${hr % 24} ঘন্টা` : `+${day}d ${hr % 24}h`;
}

/** Slow replies (over 15 minutes) get highlighted so SLA misses stand out. */
export function isSlowGap(fromIso: string | null | undefined, toIso: string, thresholdMinutes = 15) {
  if (!fromIso) return false;
  return new Date(toIso).getTime() - new Date(fromIso).getTime() > thresholdMinutes * 60 * 1000;
}
