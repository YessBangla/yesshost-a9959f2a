import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Yess Host \u2014 Bangladesh's Best Web Hosting & Domain" },
      { name: "description", content: "Fast BDIX hosting, domains, VPS, reseller and SSL from Yess Host with 24/7 Bangla support and 99.9% uptime." },
      { property: "og:title", content: "Yess Host \u2014 Bangladesh's Best Web Hosting & Domain" },
      { property: "og:description", content: "Fast BDIX hosting, domains, VPS, reseller and SSL from Yess Host with 24/7 Bangla support and 99.9% uptime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
