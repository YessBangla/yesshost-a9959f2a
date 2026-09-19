import { createFileRoute } from "@tanstack/react-router";
import DashboardBilling from "@/pages/dashboard/Billing";

export const Route = createFileRoute("/dashboard/billing")({
  validateSearch: (search: Record<string, unknown>) => ({
    invoice: typeof search["invoice"] === "string" ? (search["invoice"] as string) : undefined,
    action: search["action"] === "pay" ? ("pay" as const) : undefined,
  }),
  component: DashboardBilling,
  head: () => ({
    meta: [
      { title: "Billing & Invoices | Yess Host" },
      { name: "description", content: "See invoices, payment history and pay outstanding bills." },
      { property: "og:title", content: "Billing & Invoices | Yess Host" },
      { property: "og:description", content: "See invoices, payment history and pay outstanding bills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
