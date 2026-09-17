import { createFileRoute } from "@tanstack/react-router";
import AdminBilling from "@/pages/admin/Billing";

export const Route = createFileRoute("/admin/billing")({
  component: AdminBilling,
});
