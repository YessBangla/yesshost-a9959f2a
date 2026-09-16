import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Phone, Key, Shield, Loader2, Save, Eye, EyeOff, CheckCircle2, AlertCircle, PlayCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConfigRow {
  id: string;
  config_key: string;
  config_value: Record<string, any>;
  is_active: boolean;
  description: string | null;
}

const CommunicationConfig = () => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testTarget, setTestTarget] = useState("");
  const [testSmsTarget, setTestSmsTarget] = useState("");
  const [testing, setTesting] = useState<string | null>(null);
  const [testSteps, setTestSteps] = useState<{ name: string; ok: boolean; detail?: string }[] | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const runTest = async (testType: "full" | "email" | "sms") => {
    const target = testType === "sms" ? testSmsTarget.trim() : testTarget.trim();
    if (!target) {
      toast.error(bn ? "টেস্টের জন্য ঠিকানা লিখুন" : "Enter a target first");
      return;
    }
    setTesting(testType);
    setTestSteps(null);
    setTestError(null);
    const { data, error } = await supabase.functions.invoke("communication-test", {
      body: { test_type: testType, target },
    });
    setTesting(null);
    if (error) {
      setTestError(error.message);
      toast.error(bn ? "টেস্ট চালানো যায়নি" : "Test could not run");
      return;
    }
    setTestSteps(data?.steps || []);
    if (data?.success) {
      toast.success(bn ? "টেস্ট সফল — ইনবক্স দেখুন" : "Test passed — check the inbox");
    } else {
      setTestError(data?.error || null);
      toast.error(bn ? "টেস্ট ব্যর্থ" : "Test failed");
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("communication_config")
      .select("*")
      .order("created_at");
    if (!error && data) setConfigs(data as unknown as ConfigRow[]);
    setLoading(false);
  };

  const getConfig = (key: string) => configs.find(c => c.config_key === key);

  const updateConfig = (key: string, field: string, value: any) => {
    setConfigs(prev => prev.map(c => {
      if (c.config_key === key) {
        return { ...c, config_value: { ...c.config_value, [field]: value } };
      }
      return c;
    }));
  };

  const toggleActive = async (key: string) => {
    const config = getConfig(key);
    if (!config) return;
    const newActive = !config.is_active;
    setConfigs(prev => prev.map(c => c.config_key === key ? { ...c, is_active: newActive } : c));
    await supabase
      .from("communication_config")
      .update({ is_active: newActive } as any)
      .eq("config_key", key);
    toast.success(newActive ? (bn ? "সক্রিয় করা হয়েছে" : "Enabled") : (bn ? "নিষ্ক্রিয় করা হয়েছে" : "Disabled"));
  };

  const saveConfig = async (key: string) => {
    const config = getConfig(key);
    if (!config) return;
    setSaving(key);
    const { error } = await supabase
      .from("communication_config")
      .update({ config_value: config.config_value as any })
      .eq("config_key", key);
    if (error) {
      toast.error(bn ? "সেভ করতে ব্যর্থ" : "Failed to save");
    } else {
      toast.success(bn ? "সফলভাবে সেভ হয়েছে" : "Saved successfully");
    }
    setSaving(null);
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const smtpConfig = getConfig("smtp_email");
  const emailApiConfig = getConfig("email_api");
  const smsConfig = getConfig("sms_otp");
  const emailOtpConfig = getConfig("email_otp");

  const SecretInput = ({ configKey, field, value, placeholder }: { configKey: string; field: string; value: string; placeholder: string }) => (
    <div className="relative">
      <Input
        type={showSecrets[`${configKey}_${field}`] ? "text" : "password"}
        value={value || ""}
        onChange={e => updateConfig(configKey, field, e.target.value)}
        placeholder={placeholder}
        className="pr-10 font-mono text-xs"
      />
      <button
        type="button"
        onClick={() => toggleSecret(`${configKey}_${field}`)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {showSecrets[`${configKey}_${field}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  const StatusBadge = ({ active }: { active: boolean }) => (
    <Badge variant={active ? "default" : "secondary"} className={`text-[10px] ${active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}>
      {active ? (
        <><CheckCircle2 className="w-3 h-3 mr-1" />{bn ? "সক্রিয়" : "Active"}</>
      ) : (
        <><AlertCircle className="w-3 h-3 mr-1" />{bn ? "নিষ্ক্রিয়" : "Inactive"}</>
      )}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{bn ? "কমিউনিকেশন কনফিগারেশন" : "Communication Config"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {bn ? "ইমেইল, SMS এবং OTP সার্ভিসের API কনফিগারেশন পরিচালনা করুন" : "Manage API configurations for email, SMS, and OTP services"}
        </p>
      </div>

      {/* Live delivery test */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            {bn ? "লাইভ ডেলিভারি টেস্ট" : "Live Delivery Test"}
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            {bn
              ? "আপনার সেভ করা সেটিংস দিয়ে সত্যিকারের ইমেইল ও OTP পাঠিয়ে পুরো প্রক্রিয়া যাচাই করুন"
              : "Send a real email and OTP with your saved settings to verify the full flow end to end"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{bn ? "টেস্ট ইমেইল ঠিকানা" : "Test email address"}</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={testTarget}
                  onChange={e => setTestTarget(e.target.value)}
                  placeholder="you@example.com"
                  className="text-sm"
                />
                <Button size="sm" onClick={() => runTest("full")} disabled={!!testing} className="gap-1.5 shrink-0">
                  {testing === "full" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                  {bn ? "পুরো টেস্ট" : "Full test"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {bn ? "কনফিগ যাচাই → টেস্ট ইমেইল → OTP ইমেইল → OTP ভেরিফাই" : "Config check → test email → OTP email → OTP verify"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{bn ? "টেস্ট মোবাইল নম্বর" : "Test phone number"}</Label>
              <div className="flex gap-2">
                <Input
                  value={testSmsTarget}
                  onChange={e => setTestSmsTarget(e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => runTest("sms")} disabled={!!testing} className="gap-1.5 shrink-0">
                  {testing === "sms" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                  {bn ? "SMS টেস্ট" : "SMS test"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {bn ? "SMS প্রোভাইডার সক্রিয় থাকলে কাজ করবে" : "Requires an active SMS provider"}
              </p>
            </div>
          </div>

          {(testSteps || testError) && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              {(testSteps || []).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {s.ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />}
                  <div className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    {s.detail && <span className="block text-muted-foreground break-words">{s.detail}</span>}
                  </div>
                </div>
              ))}
              {testError && (
                <p className="text-xs text-destructive break-words pt-1 border-t">{testError}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="smtp" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Mail className="w-3.5 h-3.5" /> SMTP
          </TabsTrigger>
          <TabsTrigger value="email-api" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Key className="w-3.5 h-3.5" /> {bn ? "ইমেইল API" : "Email API"}
          </TabsTrigger>
          <TabsTrigger value="sms-otp" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Phone className="w-3.5 h-3.5" /> {bn ? "SMS/OTP" : "SMS/OTP"}
          </TabsTrigger>
          <TabsTrigger value="email-otp" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Shield className="w-3.5 h-3.5" /> {bn ? "ইমেইল OTP" : "Email OTP"}
          </TabsTrigger>
        </TabsList>

        {/* SMTP Config */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {bn ? "SMTP ইমেইল কনফিগারেশন" : "SMTP Email Configuration"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {bn ? "SMTP সার্ভারের মাধ্যমে ইমেইল পাঠানোর সেটিংস" : "Configure SMTP server for sending emails"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge active={smtpConfig?.is_active || false} />
                  <Switch checked={smtpConfig?.is_active || false} onCheckedChange={() => toggleActive("smtp_email")} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "SMTP হোস্ট" : "SMTP Host"}</Label>
                  <Input
                    value={smtpConfig?.config_value?.host || ""}
                    onChange={e => updateConfig("smtp_email", "host", e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "পোর্ট" : "Port"}</Label>
                  <Input
                    type="number"
                    value={smtpConfig?.config_value?.port || 587}
                    onChange={e => updateConfig("smtp_email", "port", parseInt(e.target.value))}
                    placeholder="587"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "ইউজারনেম" : "Username"}</Label>
                  <Input
                    value={smtpConfig?.config_value?.username || ""}
                    onChange={e => updateConfig("smtp_email", "username", e.target.value)}
                    placeholder="your@email.com"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "পাসওয়ার্ড" : "Password"}</Label>
                  <SecretInput configKey="smtp_email" field="password" value={smtpConfig?.config_value?.password || ""} placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "প্রেরকের ইমেইল" : "From Email"}</Label>
                  <Input
                    value={smtpConfig?.config_value?.from_email || ""}
                    onChange={e => updateConfig("smtp_email", "from_email", e.target.value)}
                    placeholder="noreply@yourdomain.com"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "প্রেরকের নাম" : "From Name"}</Label>
                  <Input
                    value={smtpConfig?.config_value?.from_name || ""}
                    onChange={e => updateConfig("smtp_email", "from_name", e.target.value)}
                    placeholder="YessHost"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5 max-w-xs">
                <Label className="text-xs">{bn ? "এনক্রিপশন" : "Encryption"}</Label>
                <Select
                  value={smtpConfig?.config_value?.encryption || "tls"}
                  onValueChange={v => updateConfig("smtp_email", "encryption", v)}
                >
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="none">{bn ? "কিছুই নয়" : "None"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => saveConfig("smtp_email")} disabled={saving === "smtp_email"} size="sm" className="gap-1.5">
                  {saving === "smtp_email" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {bn ? "সেভ করুন" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email API Config */}
        <TabsContent value="email-api">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    {bn ? "ইমেইল API কনফিগারেশন" : "Email API Configuration"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {bn ? "Resend, SendGrid বা Mailgun API ব্যবহার করে ইমেইল পাঠান" : "Send emails via Resend, SendGrid, or Mailgun API"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge active={emailApiConfig?.is_active || false} />
                  <Switch checked={emailApiConfig?.is_active || false} onCheckedChange={() => toggleActive("email_api")} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 max-w-xs">
                <Label className="text-xs">{bn ? "প্রোভাইডার" : "Provider"}</Label>
                <Select
                  value={emailApiConfig?.config_value?.provider || ""}
                  onValueChange={v => updateConfig("email_api", "provider", v)}
                >
                  <SelectTrigger className="text-sm"><SelectValue placeholder={bn ? "প্রোভাইডার নির্বাচন করুন" : "Select provider"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resend">Resend</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="postmark">Postmark</SelectItem>
                    <SelectItem value="ses">Amazon SES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">API Key</Label>
                  <SecretInput configKey="email_api" field="api_key" value={emailApiConfig?.config_value?.api_key || ""} placeholder="re_xxxxxxxx..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "প্রেরকের ইমেইল" : "From Email"}</Label>
                  <Input
                    value={emailApiConfig?.config_value?.from_email || ""}
                    onChange={e => updateConfig("email_api", "from_email", e.target.value)}
                    placeholder="noreply@yourdomain.com"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "প্রেরকের নাম" : "From Name"}</Label>
                  <Input
                    value={emailApiConfig?.config_value?.from_name || ""}
                    onChange={e => updateConfig("email_api", "from_name", e.target.value)}
                    placeholder="YessHost"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => saveConfig("email_api")} disabled={saving === "email_api"} size="sm" className="gap-1.5">
                  {saving === "email_api" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {bn ? "সেভ করুন" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS/OTP Config */}
        <TabsContent value="sms-otp">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {bn ? "SMS/ফোন OTP কনফিগারেশন" : "SMS/Phone OTP Configuration"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {bn ? "SMS প্রোভাইডার API ব্যবহার করে ফোনে OTP পাঠান" : "Send OTP via phone using SMS provider APIs"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge active={smsConfig?.is_active || false} />
                  <Switch checked={smsConfig?.is_active || false} onCheckedChange={() => toggleActive("sms_otp")} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 max-w-xs">
                <Label className="text-xs">{bn ? "প্রোভাইডার" : "Provider"}</Label>
                <Select
                  value={smsConfig?.config_value?.provider || ""}
                  onValueChange={v => updateConfig("sms_otp", "provider", v)}
                >
                  <SelectTrigger className="text-sm"><SelectValue placeholder={bn ? "প্রোভাইডার নির্বাচন করুন" : "Select provider"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                    <SelectItem value="messagebird">MessageBird</SelectItem>
                    <SelectItem value="bulksms_bd">BulkSMS BD</SelectItem>
                    <SelectItem value="sslwireless">SSL Wireless</SelectItem>
                    <SelectItem value="custom">{bn ? "কাস্টম API" : "Custom API"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">API Key / Account SID</Label>
                  <SecretInput configKey="sms_otp" field="api_key" value={smsConfig?.config_value?.api_key || ""} placeholder="ACxxxxxxxx..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">API Secret / Auth Token</Label>
                  <SecretInput configKey="sms_otp" field="api_secret" value={smsConfig?.config_value?.api_secret || ""} placeholder="xxxxxxxx..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "সেন্ডার আইডি" : "Sender ID"}</Label>
                  <Input
                    value={smsConfig?.config_value?.sender_id || ""}
                    onChange={e => updateConfig("sms_otp", "sender_id", e.target.value)}
                    placeholder="YessHost"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "ফোন নম্বর (From)" : "From Number"}</Label>
                  <Input
                    value={smsConfig?.config_value?.from_number || ""}
                    onChange={e => updateConfig("sms_otp", "from_number", e.target.value)}
                    placeholder="+8801XXXXXXXXX"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => saveConfig("sms_otp")} disabled={saving === "sms_otp"} size="sm" className="gap-1.5">
                  {saving === "sms_otp" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {bn ? "সেভ করুন" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email OTP Config */}
        <TabsContent value="email-otp">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {bn ? "ইমেইল OTP সেটিংস" : "Email OTP Settings"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {bn ? "ইমেইলে OTP পাঠানোর সেটিংস কনফিগার করুন" : "Configure email OTP delivery settings"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge active={emailOtpConfig?.is_active || false} />
                  <Switch checked={emailOtpConfig?.is_active || false} onCheckedChange={() => toggleActive("email_otp")} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "OTP দৈর্ঘ্য" : "OTP Length"}</Label>
                  <Select
                    value={String(emailOtpConfig?.config_value?.length || 6)}
                    onValueChange={v => updateConfig("email_otp", "length", parseInt(v))}
                  >
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 {bn ? "ডিজিট" : "digits"}</SelectItem>
                      <SelectItem value="6">6 {bn ? "ডিজিট" : "digits"}</SelectItem>
                      <SelectItem value="8">8 {bn ? "ডিজিট" : "digits"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{bn ? "মেয়াদ (মিনিট)" : "Expiry (minutes)"}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={emailOtpConfig?.config_value?.expiry_minutes || 5}
                    onChange={e => updateConfig("email_otp", "expiry_minutes", parseInt(e.target.value))}
                    className="text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {bn
                  ? "ইমেইল OTP পাঠাতে উপরের SMTP বা Email API কনফিগারেশন সক্রিয় থাকতে হবে।"
                  : "Email OTP requires an active SMTP or Email API configuration above to send messages."}
              </p>
              <div className="flex justify-end pt-2">
                <Button onClick={() => saveConfig("email_otp")} disabled={saving === "email_otp"} size="sm" className="gap-1.5">
                  {saving === "email_otp" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {bn ? "সেভ করুন" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationConfig;
