/**
 * Converts numerals between Bengali and English based on language setting.
 * Prices in the DB/static data are stored as Bengali numerals (৯৯০, ১,১৯০).
 * This utility ensures they display correctly per language.
 */

const bnDigits = "০১২৩৪৫৬৭৮৯";
const enDigits = "0123456789";

/** Convert any digit string to Bengali numerals */
export const toBnDigits = (str: string): string =>
  String(str).replace(/[0-9]/g, (d) => bnDigits[Number(d)]);

/** Convert any digit string to English numerals */
export const toEnDigits = (str: string): string =>
  String(str).replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)));

/** 
 * Format a price string for display based on language.
 * Handles both Bengali and English numeral inputs.
 * @param price - Price string (e.g. "৯৯০" or "990" or "১,১৯০")
 * @param lang - "bn" or "en"
 * @returns Formatted price string with correct numerals
 */
export const formatPrice = (price: string | number, lang: string): string => {
  const str = String(price);
  if (lang === "bn") {
    return toBnDigits(str);
  }
  return toEnDigits(str);
};

/**
 * Format a number as localized price with commas.
 * @param amount - Numeric amount
 * @param lang - "bn" or "en"  
 * @returns Formatted string like "1,190" or "১,১৯০"
 */
export const formatAmount = (amount: number, lang: string): string => {
  const formatted = amount.toLocaleString("en-IN");
  if (lang === "bn") {
    return toBnDigits(formatted);
  }
  return formatted;
};

/**
 * Format price with ৳ symbol.
 */
export const formatPriceBDT = (price: string | number, lang: string): string => {
  return `৳${formatPrice(price, lang)}`;
};
