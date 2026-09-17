import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type InvoiceData = {
  id: string;
  invoice_number: string;
  description: string | null;
  amount_bdt: number;
  status: string;
  payment_method: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  service_id: string | null;
};

interface InvoiceReportProps {
  invoice: InvoiceData | null;
  open: boolean;
  onClose: () => void;
}

const InvoiceReport = ({ invoice, open, onClose }: InvoiceReportProps) => {
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const isBn = lang === "bn";
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!invoice) return null;

  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a2e; background: #fff; }
          .invoice-page { max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #0ea5e9; }
          .logo-section img { height: 40px; }
          .company-info { text-align: right; font-size: 12px; color: #64748b; line-height: 1.6; }
          .company-info strong { color: #1a1a2e; font-size: 14px; }
          .invoice-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .invoice-title h1 { font-size: 28px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; }
          .status-badge { padding: 8px 24px; border-radius: 50px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
          .status-paid { background: #dcfce7; color: #15803d; border: 2px solid #86efac; }
          .status-unpaid { background: #fef3c7; color: #b45309; border: 2px solid #fcd34d; }
          .status-overdue { background: #fee2e2; color: #dc2626; border: 2px solid #fca5a5; }
          .status-cancelled { background: #f1f5f9; color: #64748b; border: 2px solid #cbd5e1; }
          .status-refunded { background: #e0e7ff; color: #4338ca; border: 2px solid #a5b4fc; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .detail-box { padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
          .detail-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 10px; font-weight: 600; }
          .detail-box p { font-size: 13px; color: #334155; line-height: 1.8; }
          .detail-box p strong { color: #1a1a2e; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table thead th { background: #0ea5e9; color: #fff; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .items-table thead th:first-child { border-radius: 8px 0 0 0; }
          .items-table thead th:last-child { border-radius: 0 8px 0 0; text-align: right; }
          .items-table tbody td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
          .items-table tbody td:last-child { text-align: right; font-weight: 600; }
          .total-section { display: flex; justify-content: flex-end; margin-bottom: 40px; }
          .total-box { background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 20px 30px; min-width: 260px; }
          .total-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; color: #64748b; }
          .total-row.grand { border-top: 2px solid #0ea5e9; margin-top: 8px; padding-top: 12px; font-size: 20px; font-weight: 800; color: #1a1a2e; }
          .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 12px; color: #94a3b8; line-height: 1.8; }
          .footer a { color: #0ea5e9; text-decoration: none; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 120px; font-weight: 900; opacity: 0.04; color: #0ea5e9; pointer-events: none; z-index: 0; text-transform: uppercase; letter-spacing: 10px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .invoice-page { padding: 20px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handleDownloadPDF = async () => {
    const content = printRef.current;
    if (!content) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setDownloading(false);
  };

  const statusClass = isPaid ? "status-paid" : isOverdue ? "status-overdue" : invoice.status === "cancelled" ? "status-cancelled" : invoice.status === "refunded" ? "status-refunded" : "status-unpaid";
  const statusLabel = isPaid
    ? (isBn ? "পরিশোধিত" : "PAID")
    : isOverdue
    ? (isBn ? "মেয়াদোত্তীর্ণ" : "OVERDUE")
    : invoice.status === "cancelled"
    ? (isBn ? "বাতিল" : "CANCELLED")
    : invoice.status === "refunded"
    ? (isBn ? "ফেরতকৃত" : "REFUNDED")
    : (isBn ? "অপরিশোধিত" : "UNPAID");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-xs">
          <h2 className="text-lg font-bold text-foreground">
            {isBn ? "ইনভয়েস রিপোর্ট" : "Invoice Report"}
          </h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={downloading} className="gap-2">
              <Download className="w-4 h-4" />
              {downloading ? (isBn ? "ডাউনলোড হচ্ছে..." : "Downloading...") : "PDF"}
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              {isBn ? "প্রিন্ট" : "Print"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable content */}
        <div ref={printRef}>
          <div className="invoice-page" style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
            {/* Watermark */}
            <div className="watermark" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-30deg)", fontSize: 120, fontWeight: 900, opacity: 0.04, color: "#0ea5e9", pointerEvents: "none", textTransform: "uppercase", letterSpacing: 10 }}>
              {statusLabel}
            </div>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, paddingBottom: 20, borderBottom: "3px solid #0ea5e9" }}>
              <div className="logo-section">
                <img src={logoWhite} alt="Yess Host" style={{ height: 40, filter: "brightness(0) saturate(100%)" }} />
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
                  Premium Hosting Solutions
                </p>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#64748b", lineHeight: 1.8 }}>
                <strong style={{ color: "#1a1a2e", fontSize: 14 }}>Yess Host</strong><br />
                House #12, Road #5, Sector #6<br />
                Uttara, Dhaka-1230, Bangladesh<br />
                📞 +8801805464343<br />
                ✉️ support@yesshost.com<br />
                🌐 www.yesshost.com
              </div>
            </div>

            {/* Invoice title + status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", letterSpacing: -0.5 }}>
                  {isBn ? "ইনভয়েস" : "INVOICE"}
                </h1>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  #{invoice.invoice_number}
                </p>
              </div>
              <span className={statusClass} style={{
                padding: "8px 24px", borderRadius: 50, fontWeight: 700, fontSize: 14,
                textTransform: "uppercase", letterSpacing: 1,
                background: isPaid ? "#dcfce7" : isOverdue ? "#fee2e2" : invoice.status === "cancelled" ? "#f1f5f9" : invoice.status === "refunded" ? "#e0e7ff" : "#fef3c7",
                color: isPaid ? "#15803d" : isOverdue ? "#dc2626" : invoice.status === "cancelled" ? "#64748b" : invoice.status === "refunded" ? "#4338ca" : "#b45309",
                border: `2px solid ${isPaid ? "#86efac" : isOverdue ? "#fca5a5" : invoice.status === "cancelled" ? "#cbd5e1" : invoice.status === "refunded" ? "#a5b4fc" : "#fcd34d"}`
              }}>
                {statusLabel}
              </span>
            </div>

            {/* Client & Invoice details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 30 }}>
              <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>
                  {isBn ? "বিল করা হয়েছে" : "BILL TO"}
                </h3>
                <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.8 }}>
                  <strong style={{ color: "#1a1a2e" }}>{profile?.full_name || user?.email?.split("@")[0] || "Client"}</strong><br />
                  {user?.email}<br />
                  {profile?.phone && <>{profile.phone}<br /></>}
                  {profile?.address && <>{profile.address}<br /></>}
                  {profile?.city && <>{profile.city}, </>}
                  {profile?.country || "Bangladesh"}
                  {profile?.company_name && <><br />{profile.company_name}</>}
                  {profile?.vat_id && <><br />VAT: {profile.vat_id}</>}
                </p>
              </div>
              <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>
                  {isBn ? "ইনভয়েস তথ্য" : "INVOICE DETAILS"}
                </h3>
                <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.8 }}>
                  <strong>{isBn ? "ইনভয়েস নং:" : "Invoice No:"}</strong> {invoice.invoice_number}<br />
                  <strong>{isBn ? "তারিখ:" : "Issue Date:"}</strong> {formatDate(invoice.created_at)}<br />
                  <strong>{isBn ? "ডিউ তারিখ:" : "Due Date:"}</strong> {formatDate(invoice.due_date)}<br />
                  {invoice.payment_method && (
                    <><strong>{isBn ? "পেমেন্ট মেথড:" : "Payment Method:"}</strong> {invoice.payment_method}<br /></>
                  )}
                  {invoice.paid_at && (
                    <><strong>{isBn ? "পরিশোধের তারিখ:" : "Paid Date:"}</strong> {formatDate(invoice.paid_at)}</>
                  )}
                </p>
              </div>
            </div>

            {/* Items table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30 }}>
              <thead>
                <tr>
                  <th style={{ background: "#0ea5e9", color: "#fff", padding: "12px 16px", textAlign: "left", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, borderRadius: "8px 0 0 0" }}>
                    {isBn ? "বিবরণ" : "Description"}
                  </th>
                  <th style={{ background: "#0ea5e9", color: "#fff", padding: "12px 16px", textAlign: "right", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, borderRadius: "0 8px 0 0" }}>
                    {isBn ? "পরিমাণ" : "Amount"}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 14, color: "#334155" }}>
                    {invoice.description || (isBn ? "হোস্টিং সার্ভিস" : "Hosting Service")}
                  </td>
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 14, color: "#334155", textAlign: "right", fontWeight: 600 }}>
                    ৳{Number(invoice.amount_bdt).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
              <div style={{ background: "#f0f9ff", border: "2px solid #0ea5e9", borderRadius: 12, padding: "20px 30px", minWidth: 260 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 14, color: "#64748b" }}>
                  <span>{isBn ? "সাবটোটাল" : "Subtotal"}</span>
                  <span>৳{Number(invoice.amount_bdt).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 14, color: "#64748b" }}>
                  <span>{isBn ? "ট্যাক্স" : "Tax"}</span>
                  <span>৳0</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #0ea5e9", marginTop: 8, paddingTop: 12, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>
                  <span>{isBn ? "মোট" : "Total"}</span>
                  <span>৳{Number(invoice.amount_bdt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment notice */}
            {!isPaid && (
              <div style={{ padding: 16, background: isOverdue ? "#fef2f2" : "#fffbeb", borderRadius: 12, border: `1px solid ${isOverdue ? "#fecaca" : "#fed7aa"}`, marginBottom: 30, textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: isOverdue ? "#dc2626" : "#d97706" }}>
                  {isOverdue
                    ? (isBn ? "⚠️ এই ইনভয়েসটি মেয়াদোত্তীর্ণ! অনুগ্রহ করে দ্রুত পরিশোধ করুন।" : "⚠️ This invoice is overdue! Please pay immediately.")
                    : (isBn ? "💳 এই ইনভয়েসটি এখনো অপরিশোধিত। অনুগ্রহ করে ডিউ তারিখের মধ্যে পরিশোধ করুন।" : "💳 This invoice is unpaid. Please pay before the due date.")}
                </p>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", paddingTop: 30, borderTop: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
                {isBn ? "ধন্যবাদ আমাদের সেবা ব্যবহার করার জন্য!" : "Thank you for choosing Yess Host!"}<br />
                <a href="https://yesshost.com" style={{ color: "#0ea5e9", textDecoration: "none" }}>www.yesshost.com</a> | support@yesshost.com<br />
                {isBn ? "এটি একটি কম্পিউটার জেনারেটেড ইনভয়েস, স্বাক্ষরের প্রয়োজন নেই।" : "This is a computer-generated invoice. No signature required."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceReport;
