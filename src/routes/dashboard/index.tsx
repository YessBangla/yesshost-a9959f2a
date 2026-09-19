import { createFileRoute } from "@tanstack/react-router";
import DashboardOverview from "@/pages/dashboard/Overview";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
  head: () => ({
    meta: [
      { title: "Client Dashboard | Yess Host" },
      { name: "description", content: "Overview of your services, invoices, wallet balance and support tickets." },
      { property: "og:title", content: "Client Dashboard | Yess Host" },
      { property: "og:description", content: "Overview of your services, invoices, wallet balance and support tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
