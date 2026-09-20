import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Plus, Download, RefreshCw, Check, Trash2, Receipt, Wallet, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import { downloadCsv, csvDate } from "@/lib/export-csv";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import {
  StaffPageHeader,
  StaffMetricStrip,
  StaffSearch,
  StaffLoading,
  StaffEmpty,
} from "@/components/staff/StaffConsole";

type ResellerInvoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  domain: string | null;
  description: string | null;
  amount_bdt: number;
  status: string;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  created_at: string;
};

const emptyForm = {
  customer_name: "",
  customer_email: "",
  domain: "",
  description: "",
  amount_bdt: "",
  due_date: "",
};

const makeInvoiceNumber = () =>
  `RS-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const ResellerInvoices = () => {
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const bn = lang === "bn";

  const [invoices, setInvoices] = useState<ResellerInvoice[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; domain: string; email: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: inv }, { data: accs }] = await Promise.all([
      supabase
        .from("reseller_invoices")
        .select("*")
        .eq("reseller_user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("reseller_accounts")
        .select("id, domain, email")
        .eq("reseller_user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setInvoices((inv as ResellerInvoice[]) || []);
    setAccounts((accs as { id: string; domain: string; email: string | null }[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      const matchesStatus = statusFilter === "all" || i.status === statusFilter;
      const matchesSearch =
        !q ||
        [i.invoice_number, i.customer_name, i.customer_email, i.domain, i.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [invoices, search, statusFilter]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const totals = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid");
    const unpaid = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");
    const sum = (list: ResellerInvoice[]) => list.reduce((acc, i) => acc + Number(i.amount_bdt || 0), 0);
    return { paidSum: sum(paid), unpaidSum: sum(unpaid), count: invoices.length, unpaidCount: unpaid.length };
  }, [invoices]);

  const money = (n: number) => `৳${Number(n || 0).toLocaleString("en-US")}`;
  const fmtDate = (v?: string | null) =>
    v ? new Date(v).toLocaleDateString(bn ? "bn-BD" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const statusLabel = (s: string) =>
    s === "paid" ? (bn ? "পরিশোধিত" : "Paid")
      : s === "overdue" ? (bn ? "মেয়াদোত্তীর্ণ" : "Overdue")
      : s === "cancelled" ? (bn ? "বাতিল" : "Cancelled")
      : (bn ? "অপরিশোধিত" : "Unpaid");

  const statusTone = (s: string) =>
    s === "paid" ? "bg-success/10 text-success border-success/30"
      : s === "overdue" ? "bg-destructive/10 text-destructive border-destructive/30"
      : s === "cancelled" ? "bg-muted text-muted-foreground border-border"
      : "bg-warning/10 text-warning border-warning/30";

  const handleCreate = async () => {
    if (!user) return;
    const amount = Number(form.amount_bdt);
    if (!form.customer_name.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast({
        title: bn ? "গ্রাহকের নাম ও সঠিক পরিমাণ দিন" : "Enter customer name and a valid amount",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("reseller_invoices").insert({
      reseller_user_id: user.id,
      invoice_number: makeInvoiceNumber(),
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim() || null,
      domain: form.domain.trim() || null,
      description: form.description.trim() || null,
      amount_bdt: amount,
      due_date: form.due_date || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: bn ? "সংরক্ষণ ব্যর্থ" : "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: bn ? "ইনভয়েস তৈরি হয়েছে" : "Invoice created" });
    setForm(emptyForm);
    setShowCreate(false);
    load();
  };

  const updateStatus = async (invoice: ResellerInvoice, status: string) => {
    const { error } = await supabase
      .from("reseller_invoices")
      .update({
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", invoice.id);
    if (error) {
      toast({ title: bn ? "আপডেট ব্যর্থ" : "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const removeInvoice = async (invoice: ResellerInvoice) => {
    const { error } = await supabase.from("reseller_invoices").delete().eq("id", invoice.id);
    if (error) {
      toast({ title: bn ? "মুছে ফেলা যায়নি" : "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const downloadPdf = (invoice: ResellerInvoice) => {
    const amount = Number(invoice.amount_bdt || 0);
    downloadInvoicePdf({
      invoiceNumber: invoice.invoice_number,
      createdAt: invoice.issue_date || invoice.created_at,
      dueDate: invoice.due_date,
      paid: invoice.status === "paid",
      paidAt: invoice.paid_at,
      paymentMethod: invoice.payment_method,
      customerName: invoice.customer_name,
      customerEmail: invoice.customer_email,
      lines: [
        {
          domain: invoice.domain || invoice.description || "Hosting service",
          years: 1,
          unitPrice: amount,
          total: amount,
        },
      ],
      totals: { subtotal: amount, discount: 0, fees: 0, vat: 0, total: amount },
    });
  };

  const exportCsv = () => {
    downloadCsv(
      "reseller-invoices.csv",
      ["Invoice", "Customer", "Email", "Domain", "Amount BDT", "Status", "Issue date", "Due date", "Paid at"],
      filtered.map((i) => [
        i.invoice_number,
        i.customer_name,
        i.customer_email || "",
        i.domain || "",
        Number(i.amount_bdt || 0),
        i.status,
        csvDate(i.issue_date),
        csvDate(i.due_date),
        csvDate(i.paid_at),
      ]),
    );
  };

  return (
    <div className="mobile-page-shell space-y-5">
      <StaffPageHeader
        title={bn ? "গ্রাহক ইনভয়েস" : "Customer Invoices"}
        description={
          bn
            ? `${profile?.full_name || "রিসেলার"} — নিজের গ্রাহকদের বিল তৈরি করুন, অবস্থা হালনাগাদ করুন ও PDF ডাউনলোড করুন।`
            : "Create bills for your own customers, track payment status and download PDF copies."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-11 gap-2" onClick={load}>
              <RefreshCw className="size-4" />
              {bn ? "রিফ্রেশ" : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" className="h-11 gap-2" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="size-4" />
              CSV
            </Button>
            <Button size="sm" className="h-11 gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              {bn ? "নতুন ইনভয়েস" : "New Invoice"}
            </Button>
          </div>
        }
      />

      <StaffMetricStrip
        metrics={[
          {
            label: bn ? "মোট ইনভয়েস" : "Total invoices",
            value: totals.count,
            detail: bn ? "সব সময়" : "all time",
            icon: Receipt,
          },
          {
            label: bn ? "আদায়কৃত" : "Collected",
            value: money(totals.paidSum),
            detail: bn ? "পরিশোধিত" : "paid",
            icon: Wallet,
            tone: "success",
          },
          {
            label: bn ? "বকেয়া" : "Outstanding",
            value: money(totals.unpaidSum),
            detail: bn ? `${totals.unpaidCount} টি ইনভয়েস` : `${totals.unpaidCount} invoices`,
            icon: Clock,
            tone: "warning",
          },
        ]}
      />

      <div className="mobile-glass-panel space-y-4 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <StaffSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder={bn ? "গ্রাহক, ডোমেইন বা ইনভয়েস নম্বর খুঁজুন" : "Search customer, domain or invoice no."}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{bn ? "সব অবস্থা" : "All statuses"}</SelectItem>
              <SelectItem value="unpaid">{bn ? "অপরিশোধিত" : "Unpaid"}</SelectItem>
              <SelectItem value="paid">{bn ? "পরিশোধিত" : "Paid"}</SelectItem>
              <SelectItem value="overdue">{bn ? "মেয়াদোত্তীর্ণ" : "Overdue"}</SelectItem>
              <SelectItem value="cancelled">{bn ? "বাতিল" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <StaffLoading rows={4} />
        ) : filtered.length === 0 ? (
          <StaffEmpty
            icon={FileText}
            title={bn ? "কোনো ইনভয়েস নেই" : "No invoices yet"}
            description={
              bn
                ? "আপনার গ্রাহকদের জন্য প্রথম বিলটি তৈরি করুন, এরপর সেটি PDF আকারে ডাউনলোড করে পাঠাতে পারবেন।"
                : "Create the first bill for your customers, then download it as a PDF to send them."
            }
          />
        ) : (
          <div className="space-y-3">
            {paged.map((invoice) => (
              <div key={invoice.id} className="rounded-xl border border-border/70 bg-card/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{invoice.customer_name}</span>
                      <Badge variant="outline" className={statusTone(invoice.status)}>
                        {statusLabel(invoice.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      #{invoice.invoice_number}
                      {invoice.domain ? ` · ${invoice.domain}` : ""}
                      {invoice.customer_email ? ` · ${invoice.customer_email}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {bn ? "ইস্যু" : "Issued"}: {fmtDate(invoice.issue_date)} · {bn ? "ডিউ" : "Due"}: {fmtDate(invoice.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-foreground">{money(Number(invoice.amount_bdt))}</p>
                    {invoice.paid_at && (
                      <p className="text-xs text-muted-foreground">
                        {bn ? "পরিশোধ" : "Paid"}: {fmtDate(invoice.paid_at)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-10 gap-2" onClick={() => downloadPdf(invoice)}>
                    <Download className="size-4" />
                    PDF
                  </Button>
                  {invoice.status !== "paid" && (
                    <Button size="sm" variant="outline" className="h-10 gap-2" onClick={() => updateStatus(invoice, "paid")}>
                      <Check className="size-4" />
                      {bn ? "পরিশোধিত করুন" : "Mark paid"}
                    </Button>
                  )}
                  {invoice.status === "paid" && (
                    <Button size="sm" variant="outline" className="h-10 gap-2" onClick={() => updateStatus(invoice, "unpaid")}>
                      <RefreshCw className="size-4" />
                      {bn ? "অপরিশোধিত করুন" : "Mark unpaid"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 gap-2 text-destructive"
                    onClick={() => removeInvoice(invoice)}
                  >
                    <Trash2 className="size-4" />
                    {bn ? "মুছুন" : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
            <DataPagination
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{bn ? "নতুন গ্রাহক ইনভয়েস" : "New customer invoice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {accounts.length > 0 && (
              <div className="space-y-1.5">
                <Label>{bn ? "cPanel অ্যাকাউন্ট থেকে নিন" : "Pick from cPanel account"}</Label>
                <Select
                  onValueChange={(id) => {
                    const acc = accounts.find((a) => a.id === id);
                    if (acc) setForm((f) => ({ ...f, domain: acc.domain, customer_email: acc.email || f.customer_email }));
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={bn ? "অ্যাকাউন্ট নির্বাচন করুন" : "Select an account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{bn ? "গ্রাহকের নাম" : "Customer name"}</Label>
                <Input
                  className="h-11"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{bn ? "ইমেইল" : "Email"}</Label>
                <Input
                  className="h-11"
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{bn ? "ডোমেইন" : "Domain"}</Label>
                <Input className="h-11" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{bn ? "পরিমাণ (৳)" : "Amount (BDT)"}</Label>
                <Input
                  className="h-11"
                  type="number"
                  min={0}
                  value={form.amount_bdt}
                  onChange={(e) => setForm({ ...form, amount_bdt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{bn ? "ডিউ তারিখ" : "Due date"}</Label>
                <Input
                  className="h-11"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{bn ? "বিবরণ" : "Description"}</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={bn ? "যেমন: হোস্টিং রিনিউ — ১ বছর" : "e.g. Hosting renewal — 1 year"}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" className="h-11" onClick={() => setShowCreate(false)}>
                {bn ? "বাতিল" : "Cancel"}
              </Button>
              <Button className="h-11" onClick={handleCreate} disabled={saving}>
                {saving ? (bn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : bn ? "তৈরি করুন" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResellerInvoices;
