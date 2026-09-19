import { createFileRoute } from "@tanstack/react-router";
import MyThemes from "@/pages/dashboard/MyThemes";

export const Route = createFileRoute("/dashboard/my-themes")({
  component: MyThemes,
  head: () => ({
    meta: [
      { title: "My Themes | Yess Host" },
      { name: "description", content: "Download your purchased Yess Host website themes and settle pending theme invoices." },
      { property: "og:title", content: "My Themes | Yess Host" },
      { property: "og:description", content: "Download your purchased Yess Host website themes and settle pending theme invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
