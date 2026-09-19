import { createFileRoute } from "@tanstack/react-router";
import DomainPricing from "@/pages/DomainPricing";

export const Route = createFileRoute("/domain-pricing")({
  component: DomainPricing,
  head: () => ({
    meta: [
      { title: "Domain Registration & Renewal Pricing | Yess Host" },
      { name: "description", content: "Transparent registration, renewal and transfer pricing in BDT for every popular domain extension." },
      { property: "og:title", content: "Domain Registration & Renewal Pricing | Yess Host" },
      { property: "og:description", content: "Transparent registration, renewal and transfer pricing in BDT for every popular domain extension." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
