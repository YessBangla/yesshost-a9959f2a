import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Copy, LifeBuoy } from "lucide-react";
import { reportError, friendlyMessage, formatLogsForCopy, type DebugLogEntry } from "@/lib/errorReporting";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  entry: DebugLogEntry | null;
  copied: boolean;
}

const isBnUI = () => {
  try {
    return localStorage.getItem("yh_lang") === "bn";
  } catch {
    return false;
  }
};

class ErrorBoundary extends Component<Props, State> {
  public override state: State = { hasError: false, error: null, entry: null, copied: false };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    const entry = reportError({
      area: "render",
      message: error.message || "Render error",
      context: this.props.context || (typeof window !== "undefined" ? window.location.pathname : "app"),
      detail: (errorInfo?.componentStack || "").split("\n").slice(0, 6).join(" ").trim(),
    });
    this.setState({ entry });
  }

  private handleReload = () => window.location.reload();
  private handleGoHome = () => { window.location.href = "/"; };

  private handleCopy = async () => {
    const text = [
      `Error code: ${this.state.entry?.code ?? "n/a"}`,
      `Message: ${this.state.error?.message ?? ""}`,
      "",
      formatLogsForCopy(),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const bn = isBnUI();
      const code = this.state.entry?.code ?? "YH-UI-0000";

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {bn ? "পেজটি দেখানো যাচ্ছে না" : "This page could not be displayed"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {friendlyMessage("render", bn, null, this.state.error?.message)}
            </p>

            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border">
              <span className="text-[11px] text-muted-foreground">{bn ? "এরর কোড" : "Error code"}</span>
              <code className="text-xs font-semibold text-foreground tracking-wide">{code}</code>
            </div>

            {this.state.error && (
              <pre className="text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3 mb-5 overflow-auto max-h-24 text-left">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                {bn ? "রিফ্রেশ করুন" : "Refresh page"}
              </button>
              <button
                onClick={this.handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-all"
              >
                <Copy className="w-4 h-4" />
                {this.state.copied ? (bn ? "কপি হয়েছে" : "Copied") : bn ? "বিবরণ কপি" : "Copy details"}
              </button>
              <a
                href="/dashboard/troubleshoot"
                className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-all"
              >
                <LifeBuoy className="w-4 h-4" />
                {bn ? "সমস্যা নির্ণয়" : "Troubleshoot"}
              </a>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-all"
              >
                <Home className="w-4 h-4" />
                {bn ? "হোম" : "Go home"}
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground mt-5">
              {bn
                ? "সমস্যা থাকলে এরর কোডটি সাপোর্টে জানান — support@yesshost.com"
                : "Still stuck? Send this error code to support@yesshost.com"}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
