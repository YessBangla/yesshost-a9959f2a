import { createFileRoute } from "@tanstack/react-router";
import AdminMarketing from "@/pages/admin/Marketing";

export const Route = createFileRoute("/admin/marketing")({
  component: AdminMarketing,
  head: () => ({ meta: [
    { title: "Marketing Operations | Yess Host Admin" },
    { name: "description", content: "Track campaign reach, referral conversion, coupon performance, and customer inquiries." },
    { property: "og:title", content: "Marketing Operations | Yess Host Admin" },
    { property: "og:description", content: "Track campaign reach, referral conversion, coupon performance, and customer inquiries." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
