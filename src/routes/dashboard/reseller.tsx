import { createFileRoute } from "@tanstack/react-router";
import DashboardReseller from "@/pages/dashboard/Reseller";

export const Route = createFileRoute("/dashboard/reseller")({
  component: DashboardReseller,
});
