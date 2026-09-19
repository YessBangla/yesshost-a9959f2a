import { createFileRoute } from "@tanstack/react-router";
import ResellerHosting from "@/pages/ResellerHosting";

export const Route = createFileRoute("/reseller-hosting")({
  component: ResellerHosting,
  head: () => ({
    meta: [
      { title: "Reseller Hosting Packages | Yess Host" },
      { name: "description", content: "Start your own hosting business with WHM reseller packages, white-label cPanel accounts and instant provisioning." },
      { property: "og:title", content: "Reseller Hosting Packages | Yess Host" },
      { property: "og:description", content: "Start your own hosting business with WHM reseller packages, white-label cPanel accounts and instant provisioning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
