import { createFileRoute } from "@tanstack/react-router";
import AdminRoute from "@/components/AdminRoute";
import AdminLayout from "@/components/AdminLayout";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  return (
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  );
}
