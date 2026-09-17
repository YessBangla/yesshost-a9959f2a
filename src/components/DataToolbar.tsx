import { Search, Download, RefreshCw, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type FilterOption = { value: string; label: string; count?: number };

interface DataToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  filters?: FilterOption[];
  activeFilter?: string;
  onFilter?: (v: string) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  resultCount?: number;
}

/**
 * Shared dashboard toolbar: live search, status filter chips,
 * CSV export and refresh — bilingual and mobile friendly.
 */
const DataToolbar = ({
  search,
  onSearch,
  placeholder,
  filters,
  activeFilter,
  onFilter,
  onExport,
  onRefresh,
  refreshing,
  resultCount,
}: DataToolbarProps) => {
  const { lang } = useLanguage();
  const bn = lang === "bn";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={placeholder || (bn ? "খুঁজুন..." : "Search...")}
            aria-label={bn ? "খুঁজুন" : "Search"}
            className="w-full h-11 pl-9 pr-9 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label={bn ? "মুছুন" : "Clear"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:bg-secondary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="h-11 px-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{bn ? "রিফ্রেশ" : "Refresh"}</span>
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="h-11 px-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}
        </div>
      </div>

      {filters && filters.length > 0 && onFilter && (
        <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar snap-x scroll-smooth py-0.5">
          {filters.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilter(f.value)}
              className={`shrink-0 snap-start h-9 px-3 rounded-full text-xs font-semibold border transition-colors ${
                activeFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-secondary"
              }`}
            >
              {f.label}
              {typeof f.count === "number" && (
                <span className="ml-1.5 opacity-70">{f.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {typeof resultCount === "number" && (
        <p className="text-xs text-muted-foreground">
          {resultCount} {bn ? "টি ফলাফল" : "results"}
        </p>
      )}
    </div>
  );
};

export default DataToolbar;
