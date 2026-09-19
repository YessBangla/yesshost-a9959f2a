import { createFileRoute } from "@tanstack/react-router";
import HostingPlans from "@/pages/HostingPlans";

export const Route = createFileRoute("/hosting-plans")({
  component: HostingPlans,
  head: () => ({
    meta: [
      { title: "Web Hosting Plans & Pricing | Yess Host" },
      { name: "description", content: "Compare shared, cloud, WordPress and BDIX hosting plans in BDT with free SSL, daily backups and cPanel." },
      { property: "og:title", content: "Web Hosting Plans & Pricing | Yess Host" },
      { property: "og:description", content: "Compare shared, cloud, WordPress and BDIX hosting plans in BDT with free SSL, daily backups and cPanel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
