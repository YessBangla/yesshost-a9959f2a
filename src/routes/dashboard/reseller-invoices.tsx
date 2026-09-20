import { createFileRoute } from "@tanstack/react-router";
import ResellerInvoices from "@/pages/dashboard/ResellerInvoices";

export const Route = createFileRoute("/dashboard/reseller-invoices")({
  component: ResellerInvoices,
  head: () => ({
    meta: [
      { title: "Reseller Customer Invoices | Yess Host" },
      {
        name: "description",
        content: "Create, track and download invoices for your own reseller hosting customers.",
      },
      { property: "og:title", content: "Reseller Customer Invoices | Yess Host" },
      {
        property: "og:description",
        content: "Create, track and download invoices for your own reseller hosting customers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
