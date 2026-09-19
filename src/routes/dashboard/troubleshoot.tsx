import { createFileRoute } from "@tanstack/react-router";
import DashboardTroubleshoot from "@/pages/dashboard/Troubleshoot";

export const Route = createFileRoute("/dashboard/troubleshoot")({
  component: DashboardTroubleshoot,
  head: () => ({
    meta: [
      { title: "Troubleshoot | Yess Host" },
      { name: "description", content: "Diagnose DNS, SSL and CNAME issues for your domains." },
      { property: "og:title", content: "Troubleshoot | Yess Host" },
      { property: "og:description", content: "Diagnose DNS, SSL and CNAME issues for your domains." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
