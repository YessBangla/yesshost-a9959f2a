import { createFileRoute } from "@tanstack/react-router";
import DashboardServices from "@/pages/dashboard/Services";

export const Route = createFileRoute("/dashboard/services")({
  component: DashboardServices,
  head: () => ({
    meta: [
      { title: "My Services | Yess Host" },
      { name: "description", content: "Manage your hosting, VPS and reseller services, renewals and expiry dates." },
      { property: "og:title", content: "My Services | Yess Host" },
      { property: "og:description", content: "Manage your hosting, VPS and reseller services, renewals and expiry dates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
