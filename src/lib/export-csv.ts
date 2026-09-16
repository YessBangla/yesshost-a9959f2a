/**
 * Small CSV export helper shared by every dashboard table.
 * Values are escaped so commas, quotes and newlines survive Excel / Sheets.
 */
const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export function toCsv(headers: string[], rows: (unknown[])[]): string {
  return [headers, ...rows].map(r => r.map(escapeCell).join(",")).join("\n");
}

export function downloadCsv(filename: string, headers: string[], rows: (unknown[])[]) {
  // BOM keeps Bengali text readable in Excel
  const blob = new Blob(["\uFEFF" + toCsv(headers, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const csvDate = (v?: string | null) =>
  v ? new Date(v).toISOString().slice(0, 10) : "";
