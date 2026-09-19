import { createFileRoute } from "@tanstack/react-router";
import DashboardOrders from "@/pages/dashboard/Orders";

export const Route = createFileRoute("/dashboard/orders")({
  component: DashboardOrders,
  head: () => ({
    meta: [
      { title: "My Orders | Yess Host" },
      { name: "description", content: "Track order status and provisioning for your Yess Host purchases." },
      { property: "og:title", content: "My Orders | Yess Host" },
      { property: "og:description", content: "Track order status and provisioning for your Yess Host purchases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
