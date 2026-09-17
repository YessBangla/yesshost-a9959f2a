import { createFileRoute } from "@tanstack/react-router";
import CallCenterTickets from "@/pages/callcenter/Tickets";

export const Route = createFileRoute("/call-center/tickets")({
  component: CallCenterTickets,
});
