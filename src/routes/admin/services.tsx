import { createFileRoute } from "@tanstack/react-router";
import AdminServices from "@/pages/admin/Services";

export const Route = createFileRoute("/admin/services")({
  component: AdminServices,
  head: () => ({
    meta: [
      { title: "Service Management | Yess Host Admin" },
      { name: "description", content: "Manage customer hosting, VPS and domain services." },
      { property: "og:title", content: "Service Management | Yess Host Admin" },
      { property: "og:description", content: "Manage customer hosting, VPS and domain services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
