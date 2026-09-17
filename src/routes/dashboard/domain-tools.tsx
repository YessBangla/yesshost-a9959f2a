import { createFileRoute } from "@tanstack/react-router";
import DashboardDomainTools from "@/pages/dashboard/DomainTools";

export const Route = createFileRoute("/dashboard/domain-tools")({
  component: DashboardDomainTools,
});
