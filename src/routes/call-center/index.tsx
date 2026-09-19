import { createFileRoute } from "@tanstack/react-router";
import CallCenterDashboard from "@/pages/callcenter/Dashboard";

export const Route = createFileRoute("/call-center/")({
  head: () => ({ meta: [
    { title: "Staff Operations Console | Yess Host" },
    { name: "description", content: "Live support, call center and sales operations console for Yess Host staff." },
    { property: "og:title", content: "Staff Operations Console | Yess Host" },
    { property: "og:description", content: "Live support, call center and sales operations console for Yess Host staff." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CallCenterDashboard,
});
