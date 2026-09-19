import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText, Loader2, LockKeyhole, ShieldCheck, CreditCard } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount } from "@/lib/formatPrice";
import { getSharedInvoice } from "@/lib/invoice-share.functions";
import { useToast } from "@/hooks/use-toast";

const SharedInvoice = () => {
  const { token } = useParams({ from: "/invoice/$token" });
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const fetchInvoice = useServerFn(getSharedInvoice);
  const [paying, setPaying] = useState(false);
  const invoiceQuery = useQuery({
    queryKey: ["shared-invoice", token],
    queryFn: () => fetchInvoice({ data: { token } }),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const invoice = invoiceQuery.data;
  const payable = invoice?.status === "unpaid" || invoice?.status === "overdue";
  const formatDate = (value: string | null | undefined) => value
    ? new Date(value).toLocaleDateString(bn ? "bn-BD" : "en-US", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const startPayment = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("sslcommerz-init", {
        body: { invoice_id: invoice.id, share_token: token, description: invoice.description },
      });
      if (error || !data?.gateway_url) throw new Error(data?.message || data?.error || "Payment could not be started");
      window.location.assign(data.gateway_url);
    } catch (error) {
      toast({
        title: bn ? "পেমেন্ট শুরু হয়নি" : "Payment not started",
        description: error instanceof Error ? error.message : (bn ? "আবার চেষ্টা করুন" : "Please try again"),
        variant: "destructive",
      });
      setPaying(false);
    }
  };

  return (
    <PublicLayout>
      <section className="mobile-page-shell min-h-[70vh] py-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl px-4">
          {invoiceQuery.isPending ? (
            <div className="mobile-glass-panel space-y-4 p-5 sm:p-8">
              <div className="h-8 w-44 animate-pulse rounded-lg bg-secondary" />
              <div className="h-28 animate-pulse rounded-2xl bg-secondary/70" />
              <div className="h-12 animate-pulse rounded-xl bg-secondary/70" />
            </div>
          ) : !invoice ? (
            <div className="mobile-glass-panel p-8 text-center">
              <LockKeyhole className="mx-auto mb-4 size-10 text-muted-foreground" />
              <h1 className="text-xl font-bold">{bn ? "ইনভয়েস লিংকটি বৈধ নয়" : "This invoice link is invalid"}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{bn ? "লিংকটির মেয়াদ শেষ হতে পারে। নতুন লিংকের জন্য সহায়তা নিন।" : "It may have expired. Please request a new link."}</p>
            </div>
          ) : (
            <article className="mobile-glass-panel overflow-hidden">
              <header className="border-b border-border/70 p-5 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-primary">Yess Host</p>
                    <h1 className="mt-2 text-2xl font-bold">{bn ? "ইনভয়েস" : "Invoice"}</h1>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">#{invoice.invoiceNumber}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${invoice.status === "paid" ? "bg-success/10 text-success" : invoice.status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                    {invoice.status === "paid" ? (bn ? "পরিশোধিত" : "Paid") : invoice.status === "overdue" ? (bn ? "মেয়াদোত্তীর্ণ" : "Overdue") : (bn ? "অপরিশোধিত" : "Unpaid")}
                  </span>
                </div>
              </header>

              <div className="space-y-5 p-5 sm:p-8">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/70 bg-card/55 p-4">
                    <p className="text-xs text-muted-foreground">{bn ? "ইস্যুর তারিখ" : "Issue date"}</p>
                    <p className="mt-1 text-sm font-semibold">{formatDate(invoice.createdAt)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/55 p-4">
                    <p className="text-xs text-muted-foreground">{bn ? "শেষ তারিখ" : "Due date"}</p>
                    <p className="mt-1 text-sm font-semibold">{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{invoice.description || (bn ? "হোস্টিং সেবা" : "Hosting service")}</p>
                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/60 pt-4">
                        <span className="text-sm text-muted-foreground">{bn ? "মোট" : "Total"}</span>
                        <strong className="text-2xl tabular-nums">৳{formatAmount(invoice.amountBdt, lang)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {payable && (
                    <Button className="h-12 flex-1 gap-2 rounded-2xl" onClick={startPayment} disabled={paying}>
                      {paying ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                      {bn ? "নিরাপদে পেমেন্ট করুন" : "Pay securely"}
                    </Button>
                  )}
                  <Button variant="outline" className="h-12 gap-2 rounded-2xl" onClick={() => window.print()}>
                    <Download className="size-4" /> {bn ? "PDF / প্রিন্ট" : "PDF / Print"}
                  </Button>
                </div>
                <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-success" />
                  {bn ? "পেমেন্ট নিশ্চিত হলে ইনভয়েস ও সংশ্লিষ্ট সার্ভিস স্বয়ংক্রিয়ভাবে আপডেট হবে।" : "Verified payments automatically update this invoice and its linked service."}
                </p>
              </div>
            </article>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};

export default SharedInvoice;