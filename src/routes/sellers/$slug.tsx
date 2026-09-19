import { createFileRoute } from "@tanstack/react-router";
import SellerProfile from "@/pages/themes/SellerProfile";

export const Route = createFileRoute("/sellers/$slug")({
  component: SellerProfile,
  head: () => ({
    meta: [
      { title: "Theme Seller Profile | Yess Host" },
      { name: "description", content: "Explore website themes published by this Yess Host theme seller." },
      { property: "og:title", content: "Theme Seller Profile | Yess Host" },
      { property: "og:description", content: "Explore website themes published by this Yess Host theme seller." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
