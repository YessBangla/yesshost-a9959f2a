import { useEffect, useState } from "react";
import { KeyRound, Copy, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const STORAGE_KEY = "yh_support_pin";
const VALID_MS = 60 * 60 * 1000; // 1 hour

interface StoredPin {
  pin: string;
  expiresAt: number;
  uid: string;
}

const makePin = () => String(Math.floor(100000 + Math.random() * 900000));

const readPin = (uid: string): StoredPin | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPin;
    if (parsed.uid !== uid || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
};

const DashboardSupportPin = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const { toast } = useToast();
  const [pin, setPin] = useState<StoredPin | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!user) return;
    const existing = readPin(user.id);
    if (existing) setPin(existing);
    else generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const generate = () => {
    if (!user) return;
    const next: StoredPin = { pin: makePin(), expiresAt: Date.now() + VALID_MS, uid: user.id };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPin(next);
  };

  const copy = async () => {
    if (!pin) return;
    await navigator.clipboard.writeText(pin.pin);
    toast({ title: "✅", description: bn ? "পিন কপি হয়েছে" : "PIN copied" });
  };

  const remaining = pin ? Math.max(0, pin.expiresAt - now) : 0;
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const expired = remaining <= 0;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{bn ? "সাপোর্ট পিন" : "Support PIN"}</h1>
        <p className="text-sm text-muted-foreground">
          {bn
            ? "ফোন বা লাইভ চ্যাটে পরিচয় নিশ্চিত করতে এই পিনটি আমাদের টিমকে জানান।"
            : "Share this PIN with our team to verify your identity over phone or live chat."}
        </p>
      </div>

      {!pin ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <Skeleton className="w-12 h-12 rounded-2xl mx-auto mb-4" />
          <Skeleton className="h-12 w-56 mx-auto mb-4" />
          <Skeleton className="h-3 w-32 mx-auto mb-5" />
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      ) : (
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <p className="text-4xl sm:text-5xl font-extrabold tracking-[0.3em] text-foreground mb-3">
          {expired ? "------" : pin?.pin || "------"}
        </p>
        <p className={`text-xs mb-5 ${expired ? "text-destructive" : "text-muted-foreground"}`}>
          {expired
            ? bn
              ? "পিনের মেয়াদ শেষ — নতুন পিন তৈরি করুন"
              : "PIN expired — generate a new one"
            : bn
            ? `মেয়াদ শেষ হবে ${mm}:${ss} পরে`
            : `Expires in ${mm}:${ss}`}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={copy}
            disabled={expired || !pin}
            className="flex items-center justify-center gap-2 bg-secondary/60 text-foreground px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            <Copy className="w-4 h-4" /> {bn ? "পিন কপি করুন" : "Copy PIN"}
          </button>
          <button
            onClick={generate}
            className="flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-4 py-3 rounded-xl text-sm font-semibold hover:opacity-90"
          >
            <RefreshCw className="w-4 h-4" /> {bn ? "নতুন পিন" : "New PIN"}
          </button>
        </div>
      </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-success" />
          <h2 className="text-sm font-bold text-foreground">{bn ? "নিরাপত্তা পরামর্শ" : "Security tips"}</h2>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>{bn ? "পিন শুধু Yess Host টিমকে দিন, অন্য কাউকে নয়।" : "Share the PIN only with the Yess Host team."}</li>
          <li>{bn ? "পিন এক ঘণ্টা পর নিজে থেকেই অকার্যকর হয়ে যায়।" : "The PIN automatically expires after one hour."}</li>
          <li>{bn ? "কখনো অ্যাকাউন্টের পাসওয়ার্ড শেয়ার করবেন না।" : "Never share your account password."}</li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardSupportPin;
