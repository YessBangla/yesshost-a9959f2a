import { createFileRoute } from "@tanstack/react-router";
import DashboardProfile from "@/pages/dashboard/Profile";

export const Route = createFileRoute("/dashboard/profile")({
  component: DashboardProfile,
  head: () => ({
    meta: [
      { title: "My Profile | Yess Host" },
      { name: "description", content: "Update your contact, company and billing details." },
      { property: "og:title", content: "My Profile | Yess Host" },
      { property: "og:description", content: "Update your contact, company and billing details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
