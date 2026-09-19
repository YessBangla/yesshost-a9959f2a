import { createFileRoute } from "@tanstack/react-router";
import DashboardSupport from "@/pages/dashboard/Support";

export const Route = createFileRoute("/dashboard/support")({
  component: DashboardSupport,
  head: () => ({
    meta: [
      { title: "Support Tickets | Yess Host" },
      { name: "description", content: "Open and follow up support tickets with the Yess Host team." },
      { property: "og:title", content: "Support Tickets | Yess Host" },
      { property: "og:description", content: "Open and follow up support tickets with the Yess Host team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
