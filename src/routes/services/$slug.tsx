import { createFileRoute } from "@tanstack/react-router";
import ServiceDetail from "@/pages/services/ServiceDetail";

export const Route = createFileRoute("/services/$slug")({
  component: ServiceDetail,
  head: () => ({
    meta: [
      { title: "Hosting & Domain Services | Yess Host" },
      { name: "description", content: "Explore service details, features and pricing for this Yess Host product." },
      { property: "og:title", content: "Hosting & Domain Services | Yess Host" },
      { property: "og:description", content: "Explore service details, features and pricing for this Yess Host product." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
