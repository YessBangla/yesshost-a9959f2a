import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Palette, RefreshCw, Receipt, CheckCircle2, Clock } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffPageHeader, StaffMetricStrip, StaffLoading, StaffEmpty } from "@/components/staff/StaffConsole";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount } from "@/lib/formatPrice";
import { toast } from "sonner";

type Row = {
  id: string;
  status: string;
  amount_bdt: number;
  created_at: string;
  paid_at: string | null;
  invoice_id: string | null;
  theme: { id: string; name: string; slug: string; thumbnail_url: string | null; file_path: string | null } | null;
};

const MyThemes = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("theme_orders")
      .select("id,status,amount_bdt,created_at,paid_at,invoice_id,themes(id,name,slug,thumbnail_url,file_path)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows(
      (data ?? []).map((r: any) => ({
        id: r.id,
        status: r.status,
        amount_bdt: Number(r.amount_bdt),
        created_at: r.created_at,
        paid_at: r.paid_at,
        invoice_id: r.invoice_id,
        theme: r.themes ?? null,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const paid = useMemo(() => rows.filter((r) => r.status === "paid" || r.status === "completed"), [rows]);
  const pending = useMemo(() => rows.filter((r) => r.status !== "paid" && r.status !== "completed"), [rows]);
  const spent = paid.reduce((s, r) => s + r.amount_bdt, 0);

  const download = async (row: Row) => {
    if (!row.theme?.file_path) {
      toast.error(bn ? "এই থিমের ফাইল এখনো আপলোড হয়নি" : "Theme file is not uploaded yet");
      return;
    }
    setBusy(row.id);
    const { data, error } = await supabase.storage.from("theme-files").createSignedUrl(row.theme.file_path, 300);
    setBusy(null);
    if (error || !data?.signedUrl) {
      toast.error(bn ? "ডাউনলোড লিংক তৈরি করা যায়নি" : "Could not create the download link");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title={bn ? "আমার থিম" : "My Themes"}
        description={bn ? "কেনা থিম ডাউনলোড করুন এবং অপেক্ষমাণ পেমেন্ট সম্পন্ন করুন।" : "Download purchased themes and settle pending payments."}
        actions={
          <Button variant="outline" onClick={() => void load()} className="h-11 gap-2">
            <RefreshCw className="size-4" /> {bn ? "রিফ্রেশ" : "Refresh"}
          </Button>
        }
      />

      <StaffMetricStrip
        metrics={[
          { label: bn ? "কেনা থিম" : "Owned themes", value: paid.length, detail: bn ? "ডাউনলোডযোগ্য" : "ready to download", icon: Palette, tone: "primary" },
          { label: bn ? "অপেক্ষমাণ" : "Pending", value: pending.length, detail: bn ? "পেমেন্ট বাকি" : "awaiting payment", icon: Clock, tone: "warning" },
          { label: bn ? "মোট ব্যয়" : "Total spent", value: `৳${formatAmount(spent, lang)}`, detail: bn ? "থিম ক্রয়ে" : "on themes", icon: Receipt, tone: "success" },
        ]}
      />

      {loading ? (
        <StaffLoading rows={4} />
      ) : rows.length === 0 ? (
        <div className="staff-card">
          <StaffEmpty
            icon={Palette}
            title={bn ? "এখনো কোনো থিম কেনা হয়নি" : "No themes purchased yet"}
            description={bn ? "থিম স্টোর থেকে পছন্দের থিম বেছে নিন।" : "Pick a theme from the theme store to get started."}
          />
          <div className="flex justify-center pb-6">
            <Link to="/themes"><Button className="h-11">{bn ? "থিম স্টোরে যান" : "Browse theme store"}</Button></Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => {
            const isPaid = row.status === "paid" || row.status === "completed";
            return (
              <div key={row.id} className="staff-card overflow-hidden p-0">
                {row.theme?.thumbnail_url && (
                  <img src={row.theme.thumbnail_url} alt={row.theme.name} className="h-36 w-full object-cover" />
                )}
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{row.theme?.name ?? (bn ? "থিম" : "Theme")}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString(bn ? "bn-BD" : "en-GB")} · ৳{formatAmount(row.amount_bdt, lang)}
                      </p>
                    </div>
                    <Badge variant={isPaid ? "default" : "secondary"} className="gap-1">
                      {isPaid ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                      {isPaid ? (bn ? "পরিশোধিত" : "Paid") : bn ? "অপেক্ষমাণ" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isPaid ? (
                      <Button className="h-11 gap-2" disabled={busy === row.id} onClick={() => void download(row)}>
                        <Download className="size-4" /> {bn ? "ডাউনলোড" : "Download"}
                      </Button>
                    ) : (
                      <Link to="/dashboard/billing">
                        <Button className="h-11 gap-2"><Receipt className="size-4" /> {bn ? "বিল পরিশোধ করুন" : "Pay invoice"}</Button>
                      </Link>
                    )}
                    {row.theme?.slug && (
                      <Link to={`/themes/${row.theme.slug}`}>
                        <Button variant="outline" className="h-11">{bn ? "থিম দেখুন" : "View theme"}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyThemes;
