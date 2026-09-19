import { createFileRoute } from "@tanstack/react-router";
import Affiliate from "@/pages/company/Affiliate";

export const Route = createFileRoute("/affiliate")({
  component: Affiliate,
  head: () => ({
    meta: [
      { title: "Affiliate Program | Yess Host" },
      { name: "description", content: "Earn recurring commission by referring customers to Yess Host hosting, domain and theme products." },
      { property: "og:title", content: "Affiliate Program | Yess Host" },
      { property: "og:description", content: "Earn recurring commission by referring customers to Yess Host hosting, domain and theme products." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
