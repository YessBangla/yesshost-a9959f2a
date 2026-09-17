import { createFileRoute } from "@tanstack/react-router";
import DashboardOverview from "@/pages/dashboard/Overview";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});
