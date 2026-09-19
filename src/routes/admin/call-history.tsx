import { createFileRoute } from "@tanstack/react-router";
import AdminCallHistory from "@/pages/callcenter/CallHistory";

export const Route = createFileRoute("/admin/call-history")({
  component: AdminCallHistory,
  head: () => ({
    meta: [
      { title: "Call History | Yess Host Admin" },
      { name: "description", content: "Review incoming and outgoing support call records." },
      { property: "og:title", content: "Call History | Yess Host Admin" },
      { property: "og:description", content: "Review incoming and outgoing support call records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
