import { createFileRoute } from "@tanstack/react-router";
import DashboardSupportPin from "@/pages/dashboard/SupportPin";

export const Route = createFileRoute("/dashboard/support-pin")({
  component: DashboardSupportPin,
});
