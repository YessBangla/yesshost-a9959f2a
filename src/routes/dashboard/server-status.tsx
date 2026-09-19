import { createFileRoute } from "@tanstack/react-router";
import DashboardServerStatus from "@/pages/dashboard/ServerStatusPage";

export const Route = createFileRoute("/dashboard/server-status")({
  component: DashboardServerStatus,
  head: () => ({
    meta: [
      { title: "Server Status | Yess Host" },
      { name: "description", content: "Live status of Yess Host servers and network." },
      { property: "og:title", content: "Server Status | Yess Host" },
      { property: "og:description", content: "Live status of Yess Host servers and network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
