import { createFileRoute } from "@tanstack/react-router";
import DashboardOrders from "@/pages/dashboard/Orders";

export const Route = createFileRoute("/dashboard/orders")({
  component: DashboardOrders,
});
