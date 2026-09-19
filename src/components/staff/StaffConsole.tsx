import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StaffPageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-display text-xl font-semibold text-foreground">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{actions}</div>;
}

export type StaffMetric = { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: "primary" | "success" | "warning" | "danger" };

export function StaffMetricStrip({ metrics }: { metrics: StaffMetric[] }) {
  return <div className="staff-metric-strip">{metrics.map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="staff-metric"><div className="flex items-center justify-between gap-3"><span className="staff-eyebrow">{metric.label}</span><Icon className={cn("size-4", metric.tone === "success" ? "text-success" : metric.tone === "warning" ? "text-warning" : metric.tone === "danger" ? "text-destructive" : "text-primary")} /></div><div className="mt-2 flex items-baseline gap-2"><strong className="text-2xl font-semibold tabular-nums text-foreground">{metric.value}</strong><span className="text-xs text-muted-foreground">{metric.detail}</span></div><div className={cn("mt-3 h-1 rounded-full bg-secondary after:block after:h-full after:w-2/3 after:rounded-full", metric.tone === "success" ? "after:bg-success" : metric.tone === "warning" ? "after:bg-warning" : metric.tone === "danger" ? "after:bg-destructive" : "after:bg-primary")} /></div>; })}</div>;
}

export function StaffSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 pl-9" /></div>;
}

export function StaffLoading({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div>;
}

export function StaffEmpty({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex size-11 items-center justify-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-5" /></div><p className="font-medium text-foreground">{title}</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p></div>;
}