import { describe, expect, it } from "vitest";
import { formatAmount, formatPrice, formatPriceBDT, toBnDigits, toEnDigits } from "@/lib/formatPrice";
import { csvDate, toCsv } from "@/lib/export-csv";

describe("price formatting", () => {
  it("converts digits both ways", () => {
    expect(toBnDigits("1,190")).toBe("১,১৯০");
    expect(toEnDigits("১,১৯০")).toBe("1,190");
  });

  it("normalises whichever numerals the data uses", () => {
    expect(formatPrice("৯৯০", "en")).toBe("990");
    expect(formatPrice("990", "bn")).toBe("৯৯০");
  });

  it("groups thousands and prefixes the taka sign", () => {
    expect(formatAmount(1190, "en")).toBe("1,190");
    expect(formatAmount(1190, "bn")).toBe("১,১৯০");
    expect(formatPriceBDT(280, "en")).toBe("৳280");
  });
});

describe("csv export", () => {
  it("quotes separators and escapes quotes", () => {
    expect(toCsv(["a", "b"], [["x,y", 'he said "hi"']])).toBe('a,b\n"x,y","he said ""hi"""');
  });

  it("neutralises spreadsheet formula injection", () => {
    expect(toCsv(["a"], [["=1+1"]])).toBe("a\n'=1+1");
  });

  it("formats dates as ISO days and tolerates blanks", () => {
    expect(csvDate("2026-09-19T18:24:55Z")).toBe("2026-09-19");
    expect(csvDate(null)).toBe("");
  });
});
