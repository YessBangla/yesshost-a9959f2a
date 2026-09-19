import { createFileRoute } from "@tanstack/react-router";
import AdminCoupons from "@/pages/admin/Coupons";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
  head: () => ({ meta: [
    { title: "Coupon Operations | Yess Host Admin" },
    { name: "description", content: "Manage Yess Host coupon campaigns, usage limits, status and expiry." },
    { property: "og:title", content: "Coupon Operations | Yess Host Admin" },
    { property: "og:description", content: "Manage coupon campaigns, limits and availability." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
