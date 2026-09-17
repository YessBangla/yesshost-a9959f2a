import { createFileRoute } from "@tanstack/react-router";
import DashboardServices from "@/pages/dashboard/Services";

export const Route = createFileRoute("/dashboard/services")({
  component: DashboardServices,
});
