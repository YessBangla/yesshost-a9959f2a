import { createFileRoute } from "@tanstack/react-router";
import AdminServices from "@/pages/admin/Services";

export const Route = createFileRoute("/admin/services")({
  component: AdminServices,
});
