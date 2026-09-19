/** Support SLA helpers: response targets per priority and breach state. */

export const SLA_MINUTES: Record<string, number> = {
  urgent: 60,
  high: 240,
  medium: 720,
  low: 1440,
};

export function slaMinutes(priority: string) {
  return SLA_MINUTES[priority] ?? 1440;
}

export function minutesBetween(fromIso: string, toIso: string) {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
}

export function formatMinutes(min: number, bn: boolean) {
  const abs = Math.abs(Math.round(min));
  if (abs < 60) return bn ? `${abs} মিনিট` : `${abs}m`;
  const hr = Math.floor(abs / 60);
  const rem = abs % 60;
  if (hr < 24) return bn ? `${hr} ঘন্টা ${rem} মিনিট` : `${hr}h ${rem}m`;
  const day = Math.floor(hr / 24);
  return bn ? `${day} দিন ${hr % 24} ঘন্টা` : `${day}d ${hr % 24}h`;
}

export type SlaState = {
  /** minutes remaining before the response target (negative = breached) */
  remaining: number;
  breached: boolean;
  /** true when the first staff reply already happened */
  answered: boolean;
  /** minutes taken for the first response, when answered */
  responseMinutes: number | null;
  label: string;
  tone: "success" | "warning" | "danger";
};

export function ticketSla(
  ticket: { created_at: string; priority: string; first_response_at?: string | null; status: string },
  bn: boolean,
  now: number = Date.now(),
): SlaState {
  const target = slaMinutes(ticket.priority);
  if (ticket.first_response_at) {
    const took = minutesBetween(ticket.created_at, ticket.first_response_at);
    const breached = took > target;
    return {
      remaining: target - took,
      breached,
      answered: true,
      responseMinutes: took,
      label: `${bn ? "প্রথম উত্তর" : "First reply"} ${formatMinutes(took, bn)}`,
      tone: breached ? "danger" : "success",
    };
  }
  if (["resolved", "closed"].includes(ticket.status)) {
    return {
      remaining: 0,
      breached: false,
      answered: false,
      responseMinutes: null,
      label: bn ? "উত্তর ছাড়া বন্ধ" : "Closed without reply",
      tone: "warning",
    };
  }
  const elapsed = Math.round((now - new Date(ticket.created_at).getTime()) / 60000);
  const remaining = target - elapsed;
  return {
    remaining,
    breached: remaining < 0,
    answered: false,
    responseMinutes: null,
    label:
      remaining < 0
        ? `${bn ? "SLA অতিক্রম" : "SLA breached"} ${formatMinutes(remaining, bn)}`
        : `${bn ? "বাকি" : "Due in"} ${formatMinutes(remaining, bn)}`,
    tone: remaining < 0 ? "danger" : remaining < target * 0.25 ? "warning" : "success",
  };
}

export const slaToneClass: Record<SlaState["tone"], string> = {
  success: "bg-green-500/10 text-green-600",
  warning: "bg-orange-500/10 text-orange-600",
  danger: "bg-red-500/10 text-red-600",
};
