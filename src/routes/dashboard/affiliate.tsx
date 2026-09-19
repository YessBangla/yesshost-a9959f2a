import { createFileRoute } from "@tanstack/react-router";
import DashboardAffiliate from "@/pages/dashboard/AffiliateDashboard";

export const Route = createFileRoute("/dashboard/affiliate")({
  component: DashboardAffiliate,
  head: () => ({
    meta: [
      { title: "Affiliate Dashboard | Yess Host" },
      { name: "description", content: "Track referral clicks, commissions and payout requests." },
      { property: "og:title", content: "Affiliate Dashboard | Yess Host" },
      { property: "og:description", content: "Track referral clicks, commissions and payout requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
