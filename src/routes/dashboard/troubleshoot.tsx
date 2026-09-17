import { createFileRoute } from "@tanstack/react-router";
import DashboardTroubleshoot from "@/pages/dashboard/Troubleshoot";

export const Route = createFileRoute("/dashboard/troubleshoot")({
  component: DashboardTroubleshoot,
});
