import { createFileRoute } from "@tanstack/react-router";
import AdminFinance from "@/pages/admin/Finance";

export const Route = createFileRoute("/admin/finance")({
  component: AdminFinance,
  head: () => ({
    meta: [
      { title: "Finance Control Center | Yess Host Admin" },
      { name: "description", content: "Monitor revenue, receivables, payment reconciliation, wallet activity, and finance liabilities." },
      { property: "og:title", content: "Finance Control Center | Yess Host Admin" },
      { property: "og:description", content: "Monitor revenue, receivables, payment reconciliation, wallet activity, and finance liabilities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
