import { createFileRoute } from "@tanstack/react-router";
import DashboardBilling from "@/pages/dashboard/Billing";

export const Route = createFileRoute("/dashboard/billing")({
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
