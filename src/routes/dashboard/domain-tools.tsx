import { createFileRoute } from "@tanstack/react-router";
import DashboardDomainTools from "@/pages/dashboard/DomainTools";

export const Route = createFileRoute("/dashboard/domain-tools")({
  component: DashboardDomainTools,
  head: () => ({
    meta: [
      { title: "Domain Tools | Yess Host" },
      { name: "description", content: "Renew, transfer and look up WHOIS details for your domains." },
      { property: "og:title", content: "Domain Tools | Yess Host" },
      { property: "og:description", content: "Renew, transfer and look up WHOIS details for your domains." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
