import { createFileRoute } from "@tanstack/react-router";
import CallCenterOrders from "@/pages/callcenter/Orders";

export const Route = createFileRoute("/call-center/orders")({
  component: CallCenterOrders,
});
