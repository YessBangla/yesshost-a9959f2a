import { createFileRoute } from "@tanstack/react-router";
import DashboardReseller from "@/pages/dashboard/Reseller";

export const Route = createFileRoute("/dashboard/reseller")({
  component: DashboardReseller,
  head: () => ({
    meta: [
      { title: "Reseller Dashboard | Yess Host" },
      { name: "description", content: "Manage your reseller package, cPanel accounts and quotas." },
      { property: "og:title", content: "Reseller Dashboard | Yess Host" },
      { property: "og:description", content: "Manage your reseller package, cPanel accounts and quotas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
