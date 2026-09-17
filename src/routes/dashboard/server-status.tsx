import { createFileRoute } from "@tanstack/react-router";
import DashboardServerStatus from "@/pages/dashboard/ServerStatusPage";

export const Route = createFileRoute("/dashboard/server-status")({
  component: DashboardServerStatus,
});
