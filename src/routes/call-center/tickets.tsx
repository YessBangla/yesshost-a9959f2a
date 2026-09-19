import { createFileRoute } from "@tanstack/react-router";
import CallCenterTickets from "@/pages/callcenter/Tickets";

export const Route = createFileRoute("/call-center/tickets")({
  head: () => ({ meta: [
    { title: "Support Tickets & SLA | Yess Host" }, { name: "description", content: "Customer support ticket and SLA workspace for Yess Host staff." },
    { property: "og:title", content: "Support Tickets & SLA | Yess Host" }, { property: "og:description", content: "Customer support ticket and SLA workspace for Yess Host staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: CallCenterTickets,
});
