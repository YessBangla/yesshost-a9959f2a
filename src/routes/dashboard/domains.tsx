import { createFileRoute } from "@tanstack/react-router";
import DashboardDomains from "@/pages/dashboard/Domains";

export const Route = createFileRoute("/dashboard/domains")({
  component: DashboardDomains,
});
