import { createFileRoute } from "@tanstack/react-router";
import DashboardSupport from "@/pages/dashboard/Support";

export const Route = createFileRoute("/dashboard/support")({
  component: DashboardSupport,
});
