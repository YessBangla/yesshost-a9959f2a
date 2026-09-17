import { createFileRoute } from "@tanstack/react-router";
import AdminCallHistory from "@/pages/callcenter/CallHistory";

export const Route = createFileRoute("/admin/call-history")({
  component: AdminCallHistory,
});
