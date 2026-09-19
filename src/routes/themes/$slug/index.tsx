import { createFileRoute } from "@tanstack/react-router";
import ThemeDetail from "@/pages/themes/ThemeDetail";

export const Route = createFileRoute("/themes/$slug/")({
  component: ThemeDetail,
  head: () => ({
    meta: [
      { title: "Website Theme Details | Yess Host" },
      { name: "description", content: "See screenshots, features and pricing for this Yess Host marketplace theme." },
      { property: "og:title", content: "Website Theme Details | Yess Host" },
      { property: "og:description", content: "See screenshots, features and pricing for this Yess Host marketplace theme." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
