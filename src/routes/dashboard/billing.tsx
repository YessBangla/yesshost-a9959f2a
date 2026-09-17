import { createFileRoute } from "@tanstack/react-router";
import DashboardBilling from "@/pages/dashboard/Billing";

export const Route = createFileRoute("/dashboard/billing")({
  component: DashboardBilling,
});
