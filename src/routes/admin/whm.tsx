import { createFileRoute } from "@tanstack/react-router";
import AdminWHM from "@/pages/admin/WHM";

export const Route = createFileRoute("/admin/whm")({
  component: AdminWHM,
  head: () => ({
    meta: [
      { title: "WHM Server | Yess Host Admin" },
      { name: "description", content: "Connect WHM servers and provision reseller accounts." },
      { property: "og:title", content: "WHM Server | Yess Host Admin" },
      { property: "og:description", content: "Connect WHM servers and provision reseller accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
