import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface Props {
  password: string;
  lang?: string;
}

const PasswordStrengthMeter = ({ password, lang = "en" }: Props) => {
  const bn = lang === "bn";

  const checks = useMemo(() => [
    { label: bn ? "৮+ অক্ষর" : "8+ characters", pass: password.length >= 8 },
    { label: bn ? "বড় হাতের অক্ষর" : "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: bn ? "ছোট হাতের অক্ষর" : "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: bn ? "সংখ্যা" : "Number", pass: /\d/.test(password) },
    { label: bn ? "বিশেষ চিহ্ন" : "Special character", pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password, bn]);

  const score = checks.filter(c => c.pass).length;
  const strength = score <= 1 ? "weak" : score <= 3 ? "fair" : score <= 4 ? "good" : "strong";
  const strengthLabel = {
    weak: bn ? "দুর্বল" : "Weak",
    fair: bn ? "মোটামুটি" : "Fair",
    good: bn ? "ভালো" : "Good",
    strong: bn ? "শক্তিশালী" : "Strong",
  }[strength];
  const strengthColor = {
    weak: "bg-destructive",
    fair: "bg-warning",
    good: "bg-info",
    strong: "bg-success",
  }[strength];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${i <= score ? strengthColor : "bg-secondary"}`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-semibold ${
          strength === "strong" ? "text-success" : strength === "good" ? "text-info" : strength === "fair" ? "text-warning" : "text-destructive"
        }`}>
          {strengthLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-1.5 text-[10px] ${c.pass ? "text-success" : "text-muted-foreground"}`}>
            {c.pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
