import { createFileRoute } from "@tanstack/react-router";
import DashboardOrderService from "@/pages/dashboard/OrderService";

export const Route = createFileRoute("/dashboard/order-service")({
  component: DashboardOrderService,
});
