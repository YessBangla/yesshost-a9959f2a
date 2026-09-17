/**
 * Central error reporting & debug log collection.
 *
 * - Every captured problem gets a short, human-readable error code (e.g. YH-API-3F92).
 * - Friendly bilingual messages are derived from the error kind / HTTP status.
 * - Entries are kept in memory and mirrored to localStorage so the user can
 *   copy them or view them on the Troubleshoot page after a reload.
 */

export type ErrorArea = "auth" | "billing" | "domain" | "api" | "render" | "network" | "unknown";

export interface DebugLogEntry {
  id: string;
  code: string;
  area: ErrorArea;
  at: string;
  message: string;
  status?: number | null;
  context?: string;
  detail?: string;
}

const STORAGE_KEY = "yh_debug_logs";
const MAX_ENTRIES = 100;

let entries: DebugLogEntry[] = load();
const listeners = new Set<(e: DebugLogEntry[]) => void>();

function load(): DebugLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* storage full or unavailable — in-memory log still works */
  }
  listeners.forEach((fn) => fn(entries));
}

const AREA_PREFIX: Record<ErrorArea, string> = {
  auth: "AUTH",
  billing: "BILL",
  domain: "DNS",
  api: "API",
  render: "UI",
  network: "NET",
  unknown: "GEN",
};

/** Deterministic short hash so the same failure always shows the same code. */
export function errorCode(area: ErrorArea, message: string, status?: number | null): string {
  const seed = `${area}|${status ?? ""}|${message}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hex = h.toString(16).toUpperCase().padStart(8, "0");
  return `YH-${AREA_PREFIX[area] || "GEN"}-${hex.slice(-4)}`;
}

export function friendlyMessage(
  area: ErrorArea,
  bn: boolean,
  status?: number | null,
  message?: string,
): string {
  const m = (message || "").toLowerCase();

  if (status === 401 || status === 403 || m.includes("jwt") || m.includes("not authorized")) {
    return bn
      ? "আপনার সেশনের মেয়াদ শেষ হয়েছে বা অনুমতি নেই। আবার লগইন করে চেষ্টা করুন।"
      : "Your session expired or you don't have permission. Please sign in again.";
  }
  if (status === 404) {
    return bn ? "তথ্যটি খুঁজে পাওয়া যায়নি।" : "We couldn't find what you were looking for.";
  }
  if (status === 429) {
    return bn ? "খুব বেশি অনুরোধ হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" : "Too many requests. Please try again shortly.";
  }
  if (status && status >= 500) {
    return bn
      ? "সার্ভারে সাময়িক সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
      : "The server had a temporary problem. Please try again in a moment.";
  }
  if (area === "network" || m.includes("failed to fetch") || m.includes("networkerror")) {
    return bn
      ? "ইন্টারনেট সংযোগে সমস্যা হচ্ছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
      : "We couldn't reach the server. Check your internet connection and try again.";
  }
  if (area === "billing") {
    return bn
      ? "বিলিং তথ্য দেখাতে সমস্যা হয়েছে। পেজটি রিফ্রেশ করুন।"
      : "We couldn't show your billing information. Please refresh the page.";
  }
  if (area === "domain") {
    return bn ? "ডোমেইন পরীক্ষা করা যায়নি। আবার চেষ্টা করুন।" : "The domain check could not be completed. Please try again.";
  }
  if (area === "render") {
    return bn
      ? "পেজটি দেখাতে সমস্যা হয়েছে। রিফ্রেশ করলে সাধারণত ঠিক হয়ে যায়।"
      : "This page could not be displayed. Refreshing usually fixes it.";
  }
  return bn
    ? "অপ্রত্যাশিত একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"
    : "Something unexpected happened. Please try again.";
}

export function reportError(input: {
  area: ErrorArea;
  message: string;
  status?: number | null;
  context?: string;
  detail?: string;
}): DebugLogEntry {
  const code = errorCode(input.area, input.message, input.status);
  const entry: DebugLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code,
    area: input.area,
    at: new Date().toISOString(),
    message: input.message,
    status: input.status ?? null,
    context: input.context,
    detail: input.detail,
  };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  persist();
  return entry;
}

/** Log a failed Supabase / REST call. Returns the entry (with its code) or null when there was no error. */
export function logApiError(
  context: string,
  error: unknown,
  opts?: { area?: ErrorArea; status?: number | null },
): DebugLogEntry | null {
  if (!error) return null;
  const anyErr = error as { message?: string; status?: number; code?: string; details?: string; hint?: string };
  const message = anyErr?.message || String(error);
  return reportError({
    area: opts?.area ?? "api",
    message,
    status: opts?.status ?? anyErr?.status ?? null,
    context,
    detail: [anyErr?.code, anyErr?.details, anyErr?.hint].filter(Boolean).join(" | ") || undefined,
  });
}

export function getDebugLogs(): DebugLogEntry[] {
  return entries;
}

export function clearDebugLogs() {
  entries = [];
  persist();
}

export function subscribeDebugLogs(fn: (e: DebugLogEntry[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function formatLogsForCopy(list: DebugLogEntry[] = entries): string {
  const head = [
    `Yess Host debug log`,
    `generated: ${new Date().toISOString()}`,
    typeof window !== "undefined" ? `url: ${window.location.href}` : "",
    typeof navigator !== "undefined" ? `agent: ${navigator.userAgent}` : "",
    "",
  ].filter(Boolean);
  const body = list.map(
    (e) =>
      `[${e.at}] ${e.code} (${e.area}${e.status ? ` ${e.status}` : ""}) ${e.context ? `${e.context}: ` : ""}${e.message}${e.detail ? ` — ${e.detail}` : ""}`,
  );
  return [...head, ...body].join("\n");
}

let installed = false;
/** Capture uncaught errors and unhandled promise rejections once, at app start. */
export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (ev) => {
    if (!ev?.message) return;
    reportError({
      area: "unknown",
      message: ev.message,
      context: ev.filename ? `${ev.filename}:${ev.lineno}` : "window.error",
    });
  });
  window.addEventListener("unhandledrejection", (ev) => {
    const reason = ev?.reason;
    const message = reason?.message || String(reason ?? "Unhandled rejection");
    reportError({
      area: message.toLowerCase().includes("fetch") ? "network" : "unknown",
      message,
      context: "unhandledrejection",
    });
  });
}
