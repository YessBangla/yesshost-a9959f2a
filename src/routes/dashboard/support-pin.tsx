import { createFileRoute } from "@tanstack/react-router";
import DashboardSupportPin from "@/pages/dashboard/SupportPin";

export const Route = createFileRoute("/dashboard/support-pin")({
  component: DashboardSupportPin,
  head: () => ({
    meta: [
      { title: "Support PIN | Yess Host" },
      { name: "description", content: "Generate a verification PIN for phone and live chat support." },
      { property: "og:title", content: "Support PIN | Yess Host" },
      { property: "og:description", content: "Generate a verification PIN for phone and live chat support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
