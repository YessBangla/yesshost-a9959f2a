import { FileText, ExternalLink, Download } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatAmount } from "@/lib/formatPrice";
import type { Tables } from "@/integrations/supabase/types";
import { createInvoiceShareLink } from "@/lib/invoice-share.functions";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

type Invoice = Tables<"invoices">;

const statusStyle: Record<string, string> = {
  paid: "bg-success/10 text-success",
  unpaid: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-secondary text-muted-foreground",
};

const statusLabel: Record<string, { bn: string; en: string }> = {
  paid: { bn: "পরিশোধিত", en: "Paid" },
  unpaid: { bn: "বকেয়া", en: "Unpaid" },
  overdue: { bn: "মেয়াদোত্তীর্ণ", en: "Overdue" },
  cancelled: { bn: "বাতিল", en: "Cancelled" },
  refunded: { bn: "ফেরত", en: "Refunded" },
};

/** Bills and payments of one service/domain, mirrored from the central accounts ledger. */
const ServiceInvoices = ({ invoices, compact = false }: { invoices: Invoice[]; compact?: boolean }) => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [sharingId, setSharingId] = useState<string | null>(null);
  const createShareLink = useServerFn(createInvoiceShareLink);
  const fmtDate = (v: string | null) =>
    v ? new Date(v).toLocaleDateString(bn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const paidTotal = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount_bdt), 0);
  const dueTotal = invoices.filter(i => i.status === "unpaid" || i.status === "overdue").reduce((s, i) => s + Number(i.amount_bdt), 0);

  const openInvoice = async (invoiceId: string) => {
    setSharingId(invoiceId);
    try {
      const result = await createShareLink({ data: { invoiceId } });
      window.open(`/invoice/${result.token}`, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (bn ? "ইনভয়েস খোলা যায়নি" : "Could not open invoice"));
    } finally {
      setSharingId(null);
    }
  };

  if (invoices.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {bn ? "এই সেবার জন্য এখনো কোনো বিল তৈরি হয়নি।" : "No bills generated for this item yet."}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3 w-3" /> {bn ? "বিল ও পরিশোধ" : "Bills & payments"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {bn ? "পরিশোধিত" : "Paid"} <span className="font-semibold text-success">৳{formatAmount(paidTotal, lang)}</span>
          {dueTotal > 0 && (
            <>
              {" · "}
              {bn ? "বকেয়া" : "Due"} <span className="font-semibold text-warning">৳{formatAmount(dueTotal, lang)}</span>
            </>
          )}
        </p>
      </div>
      <div className="space-y-2 sm:hidden">
        {invoices.map(inv => (
          <div key={inv.id} className="rounded-xl border border-border/70 bg-card/55 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-primary">{inv.invoice_number}</p>
                <p className="mt-1 text-xs text-muted-foreground">{bn ? "শেষ তারিখ" : "Due"}: {fmtDate(inv.due_date)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[inv.status] || "bg-secondary"}`}>
                {bn ? statusLabel[inv.status]?.bn ?? inv.status : statusLabel[inv.status]?.en ?? inv.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <strong className="text-sm tabular-nums">৳{formatAmount(Number(inv.amount_bdt), lang)}</strong>
              <button type="button" disabled={sharingId === inv.id} onClick={() => openInvoice(inv.id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-primary disabled:opacity-60">
                <Download className="size-3.5" /> {sharingId === inv.id ? (bn ? "খুলছে…" : "Opening…") : (bn ? "ইনভয়েস" : "Invoice")}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="py-1 pr-3 text-left font-medium">{bn ? "ইনভয়েস" : "Invoice"}</th>
              {!compact && <th className="py-1 pr-3 text-left font-medium">{bn ? "বিলের তারিখ" : "Billed"}</th>}
              <th className="py-1 pr-3 text-left font-medium">{bn ? "পরিশোধের দিন" : "Paid on"}</th>
              {!compact && <th className="py-1 pr-3 text-left font-medium">{bn ? "মাধ্যম" : "Method"}</th>}
              <th className="py-1 pr-3 text-left font-medium">{bn ? "অবস্থা" : "Status"}</th>
              <th className="py-1 text-right font-medium">{bn ? "টাকা" : "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-t border-border/60">
                <td className="py-1.5 pr-3">
                  <button type="button" disabled={sharingId === inv.id} onClick={() => openInvoice(inv.id)} className="font-mono text-[11px] text-primary hover:underline disabled:opacity-60">
                    {inv.invoice_number}
                  </button>
                </td>
                {!compact && <td className="py-1.5 pr-3 text-muted-foreground">{fmtDate(inv.created_at)}</td>}
                <td className="py-1.5 pr-3 text-muted-foreground">{fmtDate(inv.paid_at)}</td>
                {!compact && <td className="py-1.5 pr-3 capitalize text-muted-foreground">{inv.payment_method || "—"}</td>}
                <td className="py-1.5 pr-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[inv.status] || "bg-secondary"}`}>
                    {bn ? statusLabel[inv.status]?.bn ?? inv.status : statusLabel[inv.status]?.en ?? inv.status}
                  </span>
                </td>
                <td className="py-1.5 text-right font-semibold tabular-nums text-foreground">৳{formatAmount(Number(inv.amount_bdt), lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dueTotal > 0 && (
        <Link
          to={`/dashboard/billing?invoice=${encodeURIComponent(invoices.find(i => i.status === "unpaid" || i.status === "overdue")?.invoice_number || "")}&action=pay`}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
        >
          {bn ? "এখনই বিল পরিশোধ করুন" : "Pay this bill"} <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
};

export default ServiceInvoices;
