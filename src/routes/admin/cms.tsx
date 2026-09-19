import { createFileRoute } from "@tanstack/react-router";
import AdminCMS from "@/pages/admin/CMS";

export const Route = createFileRoute("/admin/cms")({
  component: AdminCMS,
  head: () => ({ meta: [
    { title: "Content Operations | Yess Host Admin" },
    { name: "description", content: "Manage bilingual site content, pricing, testimonials, FAQs, and publishing status." },
    { property: "og:title", content: "Content Operations | Yess Host Admin" },
    { property: "og:description", content: "Manage bilingual site content, pricing, testimonials, FAQs, and publishing status." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
