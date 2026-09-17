import { createFileRoute } from "@tanstack/react-router";
import AdminStaff from "@/pages/admin/Staff";

export const Route = createFileRoute("/admin/staff")({
  component: AdminStaff,
});
