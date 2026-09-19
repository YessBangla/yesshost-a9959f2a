import { createFileRoute } from "@tanstack/react-router";
import AdminThemes from "@/pages/admin/Themes";

export const Route = createFileRoute("/admin/themes")({
  component: AdminThemes,
  head: () => ({ meta: [
    { title: "Theme Store Operations | Yess Host Admin" },
    { name: "description", content: "Manage Yess Host themes, seller reviews, sales and payouts." },
    { property: "og:title", content: "Theme Store Operations | Yess Host Admin" },
    { property: "og:description", content: "Manage the theme catalogue and marketplace workflow." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
