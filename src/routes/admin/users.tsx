import { createFileRoute } from "@tanstack/react-router";
import AdminUsers from "@/pages/admin/Users";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});
