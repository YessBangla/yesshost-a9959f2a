import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/pages/admin/Dashboard";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Yess Host" },
      { name: "description", content: "Business overview of customers, revenue, services and support load." },
      { property: "og:title", content: "Admin Dashboard | Yess Host" },
      { property: "og:description", content: "Business overview of customers, revenue, services and support load." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
