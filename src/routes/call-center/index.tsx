import { createFileRoute } from "@tanstack/react-router";
import CallCenterDashboard from "@/pages/callcenter/Dashboard";

export const Route = createFileRoute("/call-center/")({
  component: CallCenterDashboard,
});
