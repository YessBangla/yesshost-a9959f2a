/**
 * Shared (client + server safe) domain pricing math and input validation.
 * The UI uses it to show an itemised quote instantly; the server re-computes
 * the exact same numbers before creating an invoice or a transfer ticket.
 */

export const TERMS = [1, 2, 3, 5] as const;
export type Term = (typeof TERMS)[number];

export const VAT_RATE = 0.15; // Bangladesh VAT
export const ICANN_FEE_BDT = 25; // per year, gTLDs only

const GTLDS = [".com", ".net", ".org", ".info", ".biz", ".name", ".pro"];

export function isTerm(years: unknown): years is Term {
  return typeof years === "number" && (TERMS as readonly number[]).includes(years);
}

export function termDiscountRate(years: number): number {
  if (years >= 5) return 0.12;
  if (years >= 3) return 0.08;
  if (years >= 2) return 0.05;
  return 0;
}

export function hasIcannFee(domain: string): boolean {
  const name = domain.toLowerCase().trim();
  return GTLDS.some((g) => name.endsWith(g));
}

export type PriceLine = {
  domain: string;
  years: number;
  unitPrice: number;
  subtotal: number;
  discountRate: number;
  discount: number;
  icannFee: number;
  vat: number;
  total: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildPriceLine(domain: string, unitPrice: number, years: number): PriceLine {
  const subtotal = round2(unitPrice * years);
  const discountRate = termDiscountRate(years);
  const discount = round2(subtotal * discountRate);
  const icannFee = hasIcannFee(domain) ? round2(ICANN_FEE_BDT * years) : 0;
  const taxable = subtotal - discount + icannFee;
  const vat = round2(taxable * VAT_RATE);
  return {
    domain,
    years,
    unitPrice,
    subtotal,
    discountRate,
    discount,
    icannFee,
    vat,
    total: round2(taxable + vat),
  };
}

export type PriceTotals = {
  subtotal: number;
  discount: number;
  fees: number;
  vat: number;
  total: number;
};

export function sumPriceLines(lines: PriceLine[]): PriceTotals {
  return lines.reduce<PriceTotals>(
    (acc, l) => ({
      subtotal: round2(acc.subtotal + l.subtotal),
      discount: round2(acc.discount + l.discount),
      fees: round2(acc.fees + l.icannFee),
      vat: round2(acc.vat + l.vat),
      total: round2(acc.total + l.total),
    }),
    { subtotal: 0, discount: 0, fees: 0, vat: 0, total: 0 },
  );
}

/* ------------------------------ validation ------------------------------ */

export type ValidationCode =
  | "domain_required"
  | "domain_invalid"
  | "domain_no_tld"
  | "domain_has_protocol"
  | "epp_required"
  | "epp_short"
  | "epp_invalid"
  | "ack_required"
  | "no_selection"
  | "term_invalid"
  | "price_unknown"
  | "note_too_long"
  | "note_too_short"
  | "not_owner";

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.[a-z]{2,24}$/;

export function normaliseDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

export function validateDomainName(raw: string): ValidationCode | null {
  const value = (raw ?? "").trim();
  if (!value) return "domain_required";
  if (/^https?:\/\//i.test(value) || value.includes("/")) return "domain_has_protocol";
  const name = normaliseDomain(value);
  if (!name.includes(".")) return "domain_no_tld";
  if (!DOMAIN_RE.test(name)) return "domain_invalid";
  return null;
}

export function validateEppCode(raw: string): ValidationCode | null {
  const value = (raw ?? "").trim();
  if (!value) return "epp_required";
  if (value.length < 6) return "epp_short";
  if (!/^[\w\-!@#$%^*()+=.]{6,64}$/.test(value)) return "epp_invalid";
  return null;
}

export function validateNote(raw: string): ValidationCode | null {
  return (raw ?? "").length > 1000 ? "note_too_long" : null;
}

const MESSAGES: Record<ValidationCode, { en: string; bn: string }> = {
  domain_required: { en: "Enter the domain name you want to transfer.", bn: "যে ডোমেইন ট্রান্সফার করতে চান সেটি লিখুন।" },
  domain_invalid: { en: "That doesn't look like a valid domain (example: mysite.com).", bn: "ডোমেইন নামটি সঠিক নয় (উদাহরণ: mysite.com)।" },
  domain_no_tld: { en: "Include the extension too, e.g. mysite.com", bn: "এক্সটেনশনসহ লিখুন, যেমন mysite.com" },
  domain_has_protocol: { en: "Remove http:// and any trailing path — just the domain.", bn: "http:// বা কোনো পাথ বাদ দিন — শুধু ডোমেইন লিখুন।" },
  epp_required: { en: "The EPP / Auth code from your current registrar is required.", bn: "বর্তমান রেজিস্ট্রার থেকে পাওয়া EPP / Auth কোড দিতে হবে।" },
  epp_short: { en: "EPP codes are at least 6 characters — please re-check.", bn: "EPP কোড অন্তত ৬ অক্ষরের হয় — আবার দেখুন।" },
  epp_invalid: { en: "The EPP code contains characters we can't accept.", bn: "EPP কোডে অগ্রহণযোগ্য অক্ষর রয়েছে।" },
  ack_required: { en: "Please confirm the transfer checklist before submitting.", bn: "জমা দেওয়ার আগে ট্রান্সফার চেকলিস্টটি নিশ্চিত করুন।" },
  no_selection: { en: "Select at least one domain to renew.", bn: "রিনিউ করতে অন্তত একটি ডোমেইন নির্বাচন করুন।" },
  term_invalid: { en: "Choose a renewal term of 1, 2, 3 or 5 years.", bn: "১, ২, ৩ বা ৫ বছরের মেয়াদ বেছে নিন।" },
  price_unknown: { en: "We don't have a live price for this extension — our team will quote it.", bn: "এই এক্সটেনশনের দাম এখনই পাওয়া যায়নি — আমাদের টিম দাম জানাবে।" },
  note_too_long: { en: "Please keep the note under 1000 characters.", bn: "নোটটি ১০০০ অক্ষরের মধ্যে রাখুন।" },
  note_too_short: { en: "Write at least 10 characters so support can help.", bn: "সাপোর্ট টিম যেন বুঝতে পারে — অন্তত ১০ অক্ষর লিখুন।" },
  not_owner: { en: "One of the selected domains is not on your account.", bn: "নির্বাচিত একটি ডোমেইন আপনার অ্যাকাউন্টে নেই।" },
};

export function validationMessage(code: ValidationCode, bn: boolean): string {
  const m = MESSAGES[code];
  return bn ? m.bn : m.en;
}

/* --------------------------- numeral handling --------------------------- */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Parses prices that may be stored with Bengali numerals and separators. */
export function parseNumeric(value: unknown): number | null {
  const ascii = String(value ?? "").replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  const n = Number(ascii.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
