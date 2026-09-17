import { createFileRoute } from "@tanstack/react-router";
import DashboardIncome from "@/pages/dashboard/Income";

export const Route = createFileRoute("/dashboard/income")({
  component: DashboardIncome,
  head: () => ({
    meta: [
      { title: "Income & Payments | Yess Host Client Area" },
      { name: "description", content: "Track your Yess Host spending from sign-up to every payment, invoice and wallet deposit in one place." },
      { property: "og:title", content: "Income & Payments | Yess Host Client Area" },
      { property: "og:description", content: "Track your Yess Host spending from sign-up to every payment, invoice and wallet deposit in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
