import { createFileRoute } from "@tanstack/react-router";
import AdminAnalytics from "@/pages/admin/Analytics";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
  head: () => ({
    meta: [
      { title: "Analytics | Yess Host Admin" },
      { name: "description", content: "Traffic, sales and customer analytics for the hosting business." },
      { property: "og:title", content: "Analytics | Yess Host Admin" },
      { property: "og:description", content: "Traffic, sales and customer analytics for the hosting business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
