import { createFileRoute } from "@tanstack/react-router";
import AdminAffiliates from "@/pages/admin/Affiliates";

export const Route = createFileRoute("/admin/affiliates")({
  component: AdminAffiliates,
  head: () => ({
    meta: [
      { title: "Affiliate Operations | Yess Host Admin" },
      { name: "description", content: "Monitor affiliate conversion, commissions, partner performance, and payout operations." },
      { property: "og:title", content: "Affiliate Operations | Yess Host Admin" },
      { property: "og:description", content: "Monitor affiliate conversion, commissions, partner performance, and payout operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
