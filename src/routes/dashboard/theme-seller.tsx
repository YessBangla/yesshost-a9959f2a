import { createFileRoute } from "@tanstack/react-router";
import DashboardThemeSeller from "@/pages/dashboard/ThemeSeller";

export const Route = createFileRoute("/dashboard/theme-seller")({
  component: DashboardThemeSeller,
  head: () => ({
    meta: [
      { title: "Theme Seller Dashboard | Yess Host" },
      { name: "description", content: "Upload themes, track sales and withdraw your earnings." },
      { property: "og:title", content: "Theme Seller Dashboard | Yess Host" },
      { property: "og:description", content: "Upload themes, track sales and withdraw your earnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
