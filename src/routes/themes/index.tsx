import { createFileRoute } from "@tanstack/react-router";
import ThemeStore from "@/pages/themes/ThemeStore";

export const Route = createFileRoute("/themes/")({
  component: ThemeStore,
  head: () => ({
    meta: [
      { title: "Website Theme Store | Yess Host" },
      { name: "description", content: "Buy ready-made Bangla and English website themes for business, e-commerce, education and more." },
      { property: "og:title", content: "Website Theme Store | Yess Host" },
      { property: "og:description", content: "Buy ready-made Bangla and English website themes for business, e-commerce, education and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
