import { createFileRoute } from "@tanstack/react-router";
import AdminTickets from "@/pages/admin/Tickets";

export const Route = createFileRoute("/admin/tickets")({
  component: AdminTickets,
  head: () => ({
    meta: [
      { title: "Ticket Management | Yess Host Admin" },
      { name: "description", content: "Handle customer support tickets across departments." },
      { property: "og:title", content: "Ticket Management | Yess Host Admin" },
      { property: "og:description", content: "Handle customer support tickets across departments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
