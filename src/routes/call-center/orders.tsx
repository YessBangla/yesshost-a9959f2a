import { createFileRoute } from "@tanstack/react-router";
import CallCenterOrders from "@/pages/callcenter/Orders";

export const Route = createFileRoute("/call-center/orders")({
  head: () => ({ meta: [
    { title: "Orders & Sales Workspace | Yess Host" }, { name: "description", content: "Order, payment and provisioning workspace for Yess Host sales staff." },
    { property: "og:title", content: "Orders & Sales Workspace | Yess Host" }, { property: "og:description", content: "Order, payment and provisioning workspace for Yess Host sales staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: CallCenterOrders,
});
