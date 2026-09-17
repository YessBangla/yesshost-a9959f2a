import { jsPDF } from "jspdf";

export type PdfLine = {
  domain: string;
  years: number;
  unitPrice: number;
  total: number;
};

export type PdfTotals = {
  subtotal: number;
  discount: number;
  fees: number;
  vat: number;
  total: number;
};

export type InvoicePdfInput = {
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string | null;
  paid: boolean;
  paidAt?: string | null;
  paymentMethod?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  lines: PdfLine[];
  totals: PdfTotals;
};

const COMPANY = {
  name: "Yess Host",
  site: "yesshost.com",
  address: "Uttara, Dhaka-1230, Bangladesh",
  phone: "+8801805464343",
  email: "support@yesshost.com",
};

const money = (n: number) => `BDT ${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const asDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** Builds an A4 invoice / receipt PDF for a domain renewal invoice. */
export function buildInvoicePdf(input: InvoicePdfInput): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const right = 547;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(COMPANY.name, left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text([COMPANY.site, COMPANY.address, COMPANY.phone, COMPANY.email], left, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(input.paid ? "PAYMENT RECEIPT" : "INVOICE", right, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    [
      `Invoice no: ${input.invoiceNumber}`,
      `Issue date: ${asDate(input.createdAt)}`,
      input.paid ? `Paid on: ${asDate(input.paidAt)}` : `Due date: ${asDate(input.dueDate)}`,
      input.paid ? `Method: ${input.paymentMethod || "-"}` : "Status: Unpaid",
    ],
    right,
    y + 18,
    { align: "right" },
  );

  y += 96;
  doc.setDrawColor(210);
  doc.line(left, y, right, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Billed to", left, y);
  doc.setFont("helvetica", "normal");
  doc.text([input.customerName || "Customer", input.customerEmail || ""].filter(Boolean), left, y + 14);

  y += 56;
  doc.setFillColor(243, 245, 249);
  doc.rect(left, y - 14, right - left, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Description", left + 8, y);
  doc.text("Term", 330, y, { align: "right" });
  doc.text("Unit / yr", 430, y, { align: "right" });
  doc.text("Amount", right - 8, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  y += 24;
  for (const line of input.lines) {
    doc.text(`Domain renewal — ${line.domain}`, left + 8, y);
    doc.text(`${line.years} year${line.years > 1 ? "s" : ""}`, 330, y, { align: "right" });
    doc.text(money(line.unitPrice), 430, y, { align: "right" });
    doc.text(money(line.total), right - 8, y, { align: "right" });
    y += 20;
  }

  y += 6;
  doc.line(330, y, right, y);
  y += 20;

  const rows: [string, string][] = [
    ["Subtotal", money(input.totals.subtotal)],
    ...(input.totals.discount ? ([["Term discount", `- ${money(input.totals.discount)}`]] as [string, string][]) : []),
    ...(input.totals.fees ? ([["ICANN fee", money(input.totals.fees)]] as [string, string][]) : []),
    ["VAT (15%)", money(input.totals.vat)],
  ];
  for (const [label, value] of rows) {
    doc.text(label, 430, y, { align: "right" });
    doc.text(value, right - 8, y, { align: "right" });
    y += 18;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", 430, y + 6, { align: "right" });
  doc.text(money(input.totals.total), right - 8, y + 6, { align: "right" });

  y += 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(input.paid ? 22 : 180, input.paid ? 130 : 90, input.paid ? 70 : 20);
  doc.text(input.paid ? "PAID — thank you for your payment." : "PAYMENT PENDING", left, y);
  doc.setTextColor(120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "This document is computer generated and valid without a signature. Prices include 15% VAT where applicable.",
    left,
    806,
  );

  return doc;
}

export function downloadInvoicePdf(input: InvoicePdfInput) {
  const doc = buildInvoicePdf(input);
  doc.save(`${input.paid ? "receipt" : "invoice"}-${input.invoiceNumber}.pdf`);
}
