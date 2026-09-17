import { createFileRoute } from "@tanstack/react-router";
import DashboardProfile from "@/pages/dashboard/Profile";

export const Route = createFileRoute("/dashboard/profile")({
  component: DashboardProfile,
});
