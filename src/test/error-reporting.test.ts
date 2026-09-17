import { describe, it, expect, beforeEach } from "vitest";
import {
  errorCode, friendlyMessage, reportError, logApiError,
  getDebugLogs, clearDebugLogs, formatLogsForCopy,
} from "@/lib/errorReporting";

describe("errorReporting", () => {
  beforeEach(() => clearDebugLogs());

  it("produces a stable, prefixed error code", () => {
    const a = errorCode("billing", "invoice fetch failed", 500);
    const b = errorCode("billing", "invoice fetch failed", 500);
    expect(a).toBe(b);
    expect(a).toMatch(/^YH-BILL-[0-9A-F]{4}$/);
  });

  it("gives different codes for different failures", () => {
    expect(errorCode("api", "a", 500)).not.toBe(errorCode("api", "b", 500));
  });

  it("maps HTTP status to a user friendly message in both languages", () => {
    expect(friendlyMessage("api", false, 401)).toMatch(/sign in/i);
    expect(friendlyMessage("api", true, 401)).toContain("লগইন");
    expect(friendlyMessage("api", false, 503)).toMatch(/server/i);
    expect(friendlyMessage("network", false, null, "Failed to fetch")).toMatch(/connection/i);
  });

  it("stores reported errors newest first and caps the list", () => {
    reportError({ area: "billing", message: "first" });
    reportError({ area: "domain", message: "second" });
    const logs = getDebugLogs();
    expect(logs[0].message).toBe("second");
    expect(logs).toHaveLength(2);
  });

  it("logApiError captures status and detail, and ignores null errors", () => {
    expect(logApiError("ctx", null)).toBeNull();
    const entry = logApiError("invoices.select", { message: "permission denied", status: 403, code: "42501" });
    expect(entry?.status).toBe(403);
    expect(entry?.area).toBe("api");
    expect(entry?.detail).toContain("42501");
  });

  it("formats logs as copyable text", () => {
    reportError({ area: "domain", message: "dns timeout", context: "domain-diagnose" });
    const text = formatLogsForCopy();
    expect(text).toContain("dns timeout");
    expect(text).toContain("domain-diagnose");
  });
});
