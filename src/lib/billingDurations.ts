export interface BillingDuration {
  key: string;
  months: number;
  labelBn: string;
  labelEn: string;
  shortBn: string;
  shortEn: string;
  discount: number; // percentage discount from monthly
}

export const BILLING_DURATIONS: BillingDuration[] = [
  { key: "1m", months: 1, labelBn: "১ মাস", labelEn: "1 Month", shortBn: "১মা", shortEn: "1M", discount: 0 },
  { key: "2m", months: 2, labelBn: "২ মাস", labelEn: "2 Months", shortBn: "২মা", shortEn: "2M", discount: 0 },
  { key: "3m", months: 3, labelBn: "৩ মাস", labelEn: "3 Months", shortBn: "৩মা", shortEn: "3M", discount: 0 },
  { key: "6m", months: 6, labelBn: "৬ মাস", labelEn: "6 Months", shortBn: "৬মা", shortEn: "6M", discount: 5 },
  { key: "1y", months: 12, labelBn: "১ বছর", labelEn: "1 Year", shortBn: "১বছর", shortEn: "1Y", discount: 10 },
  { key: "2y", months: 24, labelBn: "২ বছর", labelEn: "2 Years", shortBn: "২বছর", shortEn: "2Y", discount: 15 },
  { key: "3y", months: 36, labelBn: "৩ বছর", labelEn: "3 Years", shortBn: "৩বছর", shortEn: "3Y", discount: 20 },
  { key: "4y", months: 48, labelBn: "৪ বছর", labelEn: "4 Years", shortBn: "৪বছর", shortEn: "4Y", discount: 22 },
  { key: "5y", months: 60, labelBn: "৫ বছর", labelEn: "5 Years", shortBn: "৫বছর", shortEn: "5Y", discount: 25 },
  { key: "10y", months: 120, labelBn: "১০ বছর", labelEn: "10 Years", shortBn: "১০বছর", shortEn: "10Y", discount: 30 },
];

/**
 * Calculate total price for a given duration based on monthly price.
 * If annual_price_bdt is provided, uses that as the yearly rate base.
 */
export function calcDurationPrice(
  monthlyPriceBdt: string,
  annualPriceBdt: string | null,
  duration: BillingDuration
): number {
  // Parse Bengali or English numerals
  const parseNum = (s: string) => {
    const cleaned = s.replace(/[৳,\s]/g, "").replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
    return parseFloat(cleaned) || 0;
  };

  const monthly = parseNum(monthlyPriceBdt);
  
  if (duration.months === 1) return monthly;
  
  // If we have an annual price and duration >= 12 months, derive monthly from annual
  if (annualPriceBdt && duration.months >= 12) {
    const annual = parseNum(annualPriceBdt);
    const annualMonthly = annual / 12;
    // Apply additional discount for multi-year beyond 1 year
    if (duration.months === 12) return annual;
    const extraDiscount = (duration.discount - 10) / 100; // discount beyond 1yr base
    const effectiveMonthly = annualMonthly * (1 - Math.max(0, extraDiscount));
    return Math.round(effectiveMonthly * duration.months);
  }
  
  // For sub-annual: monthly * months * (1 - discount%)
  const total = monthly * duration.months * (1 - duration.discount / 100);
  return Math.round(total);
}

/** Format number to Bengali numerals string */
export function toBengaliNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
}
