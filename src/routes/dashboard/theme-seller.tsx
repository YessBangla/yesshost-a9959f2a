import { createFileRoute } from "@tanstack/react-router";
import DashboardThemeSeller from "@/pages/dashboard/ThemeSeller";

export const Route = createFileRoute("/dashboard/theme-seller")({
  component: DashboardThemeSeller,
});
