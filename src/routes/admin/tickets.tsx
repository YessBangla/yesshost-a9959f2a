import { createFileRoute } from "@tanstack/react-router";
import AdminTickets from "@/pages/admin/Tickets";

export const Route = createFileRoute("/admin/tickets")({
  component: AdminTickets,
});
