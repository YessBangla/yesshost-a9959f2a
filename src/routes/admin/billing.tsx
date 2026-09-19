import { createFileRoute } from "@tanstack/react-router";
import AdminBilling from "@/pages/admin/Billing";

export const Route = createFileRoute("/admin/billing")({
  component: AdminBilling,
  head: () => ({
    meta: [
      { title: "Billing Management | Yess Host Admin" },
      { name: "description", content: "Manage invoices, payments and receivables." },
      { property: "og:title", content: "Billing Management | Yess Host Admin" },
      { property: "og:description", content: "Manage invoices, payments and receivables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
