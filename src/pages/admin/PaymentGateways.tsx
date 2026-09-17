import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Loader2, ShieldCheck, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { GATEWAYS, type GatewayDef, type GatewayStatus } from "@/lib/payment-gateways";
import { getPaymentGateways, savePaymentGateway } from "@/lib/payment-gateways.functions";

type Draft = {
  enabled: boolean;
  isSandbox: boolean;
  values: Record<string, string>;
  cleared: string[];
};

const AdminPaymentGateways = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();

  const fetchGateways = useServerFn(getPaymentGateways);
  const saveGateway = useServerFn(savePaymentGateway);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "payment-gateways"],
    queryFn: () => fetchGateways(),
  });

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.gateways) return;
    const next: Record<string, Draft> = {};
    for (const g of data.gateways) {
      next[g.gateway] = { enabled: g.enabled, isSandbox: g.isSandbox, values: {}, cleared: [] };
    }
    setDrafts(next);
  }, [data]);

  const statusOf = (id: string): GatewayStatus | undefined =>
    data?.gateways.find((g) => g.gateway === id);

  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const handleSave = async (def: GatewayDef) => {
    const draft = drafts[def.id];
    if (!draft) return;
    setSaving(def.id);
    try {
      const res = await saveGateway({
        data: {
          gateway: def.id,
          enabled: draft.enabled,
          isSandbox: draft.isSandbox,
          credentials: draft.values,
          cleared: draft.cleared,
        },
      });
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: bn ? "সংরক্ষণ হয়নি" : "Not saved",
          description:
            res.code === "missing_fields"
              ? bn
                ? "চালু করার আগে সব তথ্য পূরণ করুন।"
                : "Fill in every credential before enabling this gateway."
              : bn
                ? "সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।"
                : "Something went wrong on the server. Please try again.",
        });
        return;
      }
      toast({
        title: bn ? "সংরক্ষিত হয়েছে" : "Saved",
        description: bn
          ? `${def.bn}-এর তথ্য সার্ভারে নিরাপদে সংরক্ষিত হয়েছে।`
          : `${def.en} credentials are stored securely on the server.`,
      });
      await refetch();
    } catch {
      toast({
        variant: "destructive",
        title: bn ? "অনুমতি নেই" : "Not allowed",
        description: bn ? "শুধু অ্যাডমিন এই সেটিংস বদলাতে পারেন।" : "Only admins can change these settings.",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          {bn ? "পেমেন্ট গেটওয়ে সেটিংস" : "Payment gateway settings"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {bn
            ? "স্টোর আইডি, অ্যাপ কী ও সিক্রেট সার্ভারে এনক্রিপ্টেড স্টোরে সংরক্ষিত হয় — ব্রাউজারে কখনো পাঠানো হয় না। সংরক্ষিত সিক্রেট শুধু শেষ ৪ অক্ষরসহ দেখানো হয়।"
            : "Store IDs, app keys and secrets are saved server-side and never sent back to the browser. Saved secrets are only shown as a masked hint."}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          {bn ? "শুধু অ্যাডমিন অ্যাক্সেস করতে পারে" : "Admin-only access"}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {GATEWAYS.map((def) => {
            const status = statusOf(def.id);
            const draft = drafts[def.id] ?? { enabled: false, isSandbox: true, values: {}, cleared: [] };
            return (
              <Card key={def.id} className="border-border/60">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {bn ? def.bn : def.en}
                      {draft.enabled ? (
                        <Badge className="bg-green-600 hover:bg-green-600">{bn ? "চালু" : "Live"}</Badge>
                      ) : (
                        <Badge variant="secondary">{bn ? "বন্ধ" : "Disabled"}</Badge>
                      )}
                      {draft.isSandbox && (
                        <Badge variant="outline">{bn ? "স্যান্ডবক্স" : "Sandbox"}</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{bn ? def.descBn : def.descEn}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${def.id}-enabled`} className="text-xs">
                        {bn ? "সক্রিয়" : "Enabled"}
                      </Label>
                      <Switch
                        id={`${def.id}-enabled`}
                        checked={draft.enabled}
                        onCheckedChange={(v) => update(def.id, { enabled: v })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${def.id}-sandbox`} className="text-xs">
                        {bn ? "টেস্ট মোড" : "Test mode"}
                      </Label>
                      <Switch
                        id={`${def.id}-sandbox`}
                        checked={draft.isSandbox}
                        onCheckedChange={(v) => update(def.id, { isSandbox: v })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {def.fields.map((field) => {
                      const saved = status?.configured?.[field.key] ?? null;
                      const revealKey = `${def.id}.${field.key}`;
                      const isCleared = draft.cleared.includes(field.key);
                      const placeholder = isCleared
                        ? bn
                          ? "সংরক্ষণ করলে মুছে যাবে"
                          : "Will be removed on save"
                        : saved
                          ? bn
                            ? `সংরক্ষিত: ${saved} — বদলাতে নতুন মান লিখুন`
                            : `Saved: ${saved} — type a new value to replace`
                          : bn
                            ? "এখনো দেওয়া হয়নি"
                            : "Not set yet";
                      return (
                        <div key={field.key} className={field.textarea ? "md:col-span-2 space-y-2" : "space-y-2"}>
                          <Label className="text-xs flex items-center gap-2">
                            {bn ? field.bn : field.en}
                            {field.secret && (
                              <span className="text-[10px] text-muted-foreground">
                                {bn ? "(সিক্রেট)" : "(secret)"}
                              </span>
                            )}
                          </Label>
                          <div className="flex gap-2">
                            {field.textarea ? (
                              <Textarea
                                rows={4}
                                className="font-mono text-xs"
                                placeholder={placeholder}
                                value={draft.values[field.key] ?? ""}
                                onChange={(e) =>
                                  update(def.id, {
                                    values: { ...draft.values, [field.key]: e.target.value },
                                    cleared: draft.cleared.filter((k) => k !== field.key),
                                  })
                                }
                              />
                            ) : (
                              <Input
                                type={field.secret && !reveal[revealKey] ? "password" : "text"}
                                autoComplete="off"
                                placeholder={placeholder}
                                value={draft.values[field.key] ?? ""}
                                onChange={(e) =>
                                  update(def.id, {
                                    values: { ...draft.values, [field.key]: e.target.value },
                                    cleared: draft.cleared.filter((k) => k !== field.key),
                                  })
                                }
                              />
                            )}
                            {field.secret && !field.textarea && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setReveal((r) => ({ ...r, [revealKey]: !r[revealKey] }))}
                                aria-label={bn ? "দেখান" : "Show"}
                              >
                                {reveal[revealKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            )}
                            {saved && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  update(def.id, {
                                    values: { ...draft.values, [field.key]: "" },
                                    cleared: isCleared
                                      ? draft.cleared.filter((k) => k !== field.key)
                                      : [...draft.cleared, field.key],
                                  })
                                }
                                aria-label={bn ? "মুছুন" : "Remove"}
                              >
                                <Trash2 className={`w-4 h-4 ${isCleared ? "text-destructive" : ""}`} />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/60">
                    <span className="text-xs text-muted-foreground">
                      {status?.updatedAt
                        ? `${bn ? "সর্বশেষ আপডেট" : "Last updated"}: ${new Date(status.updatedAt).toLocaleString(bn ? "bn-BD" : "en-GB")}`
                        : bn
                          ? "এখনো সংরক্ষণ করা হয়নি"
                          : "Never saved"}
                    </span>
                    <Button onClick={() => handleSave(def)} disabled={saving === def.id} className="min-h-11">
                      {saving === def.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {bn ? "সংরক্ষণ করুন" : "Save"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPaymentGateways;
