import { createFileRoute } from "@tanstack/react-router";
import DashboardOrderService from "@/pages/dashboard/OrderService";

export const Route = createFileRoute("/dashboard/order-service")({
  component: DashboardOrderService,
  head: () => ({
    meta: [
      { title: "Order a Service | Yess Host" },
      { name: "description", content: "Order new hosting, domain or add-on services from your dashboard." },
      { property: "og:title", content: "Order a Service | Yess Host" },
      { property: "og:description", content: "Order new hosting, domain or add-on services from your dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
