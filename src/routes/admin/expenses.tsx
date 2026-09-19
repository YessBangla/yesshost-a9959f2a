import { createFileRoute } from "@tanstack/react-router";
import AdminExpenses from "@/pages/admin/Expenses";

export const Route = createFileRoute("/admin/expenses")({
  component: AdminExpenses,
  head: () => ({
    meta: [
      { title: "Office Expenses | Yess Host Admin" },
      { name: "description", content: "Record Yess Host office and operating expenses that post automatically into the central accounting ledger." },
      { property: "og:title", content: "Office Expenses | Yess Host Admin" },
      { property: "og:description", content: "Expense entry with automatic ledger posting, category ledger codes, search and CSV export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
