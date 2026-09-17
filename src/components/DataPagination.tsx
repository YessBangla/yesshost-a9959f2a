import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DataPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  pageSizeOptions?: number[];
}

/** Shared dashboard pagination: page controls + page-size selector, bilingual. */
const DataPagination = ({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
  pageSizeOptions = [10, 25, 50, 100],
}: DataPaginationProps) => {
  const { lang } = useLanguage();
  const bn = lang === "bn";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (total > 0 && page > totalPages) onPage(totalPages);
  }, [total, page, totalPages, onPage]);

  const pages = useMemo(() => {
    const list: number[] = [];
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    for (let i = start; i < start + 5 && i <= totalPages; i++) list.push(i);
    return list;
  }, [page, totalPages]);

  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
      <p className="text-xs text-muted-foreground">
        {bn ? `${total}টির মধ্যে ${from}–${to} দেখানো হচ্ছে` : `Showing ${from}–${to} of ${total}`}
      </p>

      <div className="flex items-center gap-2">
        {onPageSize && (
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSize(Number(e.target.value));
              onPage(1);
            }}
            aria-label={bn ? "প্রতি পাতায়" : "Rows per page"}
            className="h-9 px-2 rounded-lg border border-border bg-card text-xs text-foreground"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / {bn ? "পাতা" : "page"}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label={bn ? "আগের পাতা" : "Previous page"}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={`h-9 min-w-9 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-secondary"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label={bn ? "পরের পাতা" : "Next page"}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPagination;
