import { createFileRoute } from "@tanstack/react-router";
import DashboardAffiliate from "@/pages/dashboard/AffiliateDashboard";

export const Route = createFileRoute("/dashboard/affiliate")({
  component: DashboardAffiliate,
});
