import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: DashboardRouteComponent,
});

function DashboardRouteComponent() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}
