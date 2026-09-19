import { createFileRoute } from "@tanstack/react-router";
import DashboardDomains from "@/pages/dashboard/Domains";

export const Route = createFileRoute("/dashboard/domains")({
  component: DashboardDomains,
  head: () => ({
    meta: [
      { title: "My Domains | Yess Host" },
      { name: "description", content: "View, renew and transfer the domains registered with Yess Host." },
      { property: "og:title", content: "My Domains | Yess Host" },
      { property: "og:description", content: "View, renew and transfer the domains registered with Yess Host." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
