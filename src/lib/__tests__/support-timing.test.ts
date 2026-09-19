import { describe, expect, it } from "vitest";
import { formatMinutes, slaMinutes, ticketSla } from "@/lib/ticket-sla";
import { formatGap, isSlowGap } from "@/lib/time-gap";

const created = "2026-09-19T10:00:00Z";

describe("ticket SLA", () => {
  it("uses the per-priority target with a safe fallback", () => {
    expect(slaMinutes("urgent")).toBe(60);
    expect(slaMinutes("high")).toBe(240);
    expect(slaMinutes("unknown")).toBe(1440);
  });

  it("marks an answered ticket as on time or breached", () => {
    const onTime = ticketSla({ created_at: created, priority: "urgent", first_response_at: "2026-09-19T10:30:00Z", status: "open" }, false);
    expect(onTime.answered).toBe(true);
    expect(onTime.responseMinutes).toBe(30);
    expect(onTime.breached).toBe(false);

    const late = ticketSla({ created_at: created, priority: "urgent", first_response_at: "2026-09-19T12:00:00Z", status: "open" }, false);
    expect(late.breached).toBe(true);
    expect(late.tone).toBe("danger");
  });

  it("counts down on an unanswered ticket and breaches after the target", () => {
    const due = ticketSla({ created_at: created, priority: "high", status: "open" }, false, Date.parse("2026-09-19T11:00:00Z"));
    expect(due.remaining).toBe(180);
    expect(due.breached).toBe(false);

    const breached = ticketSla({ created_at: created, priority: "high", status: "open" }, false, Date.parse("2026-09-19T15:00:00Z"));
    expect(breached.breached).toBe(true);
  });

  it("flags tickets closed without any reply", () => {
    const closed = ticketSla({ created_at: created, priority: "low", status: "closed" }, false);
    expect(closed.answered).toBe(false);
    expect(closed.tone).toBe("warning");
  });

  it("formats durations in both languages", () => {
    expect(formatMinutes(45, false)).toBe("45m");
    expect(formatMinutes(90, false)).toBe("1h 30m");
    expect(formatMinutes(90, true)).toBe("১ ঘন্টা ৩০ মিনিট".replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/\d/g, (d) => d));
  });
});

describe("conversation gaps", () => {
  it("returns nothing for the first message", () => {
    expect(formatGap(null, created, false)).toBeNull();
  });

  it("describes minute and hour gaps", () => {
    expect(formatGap(created, "2026-09-19T10:12:00Z", false)).toBe("+12m");
    expect(formatGap(created, "2026-09-19T12:30:00Z", false)).toBe("+2h 30m");
  });

  it("highlights replies slower than 15 minutes", () => {
    expect(isSlowGap(created, "2026-09-19T10:10:00Z")).toBe(false);
    expect(isSlowGap(created, "2026-09-19T10:40:00Z")).toBe(true);
  });
});
