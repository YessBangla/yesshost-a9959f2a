import { createFileRoute } from "@tanstack/react-router";
import AdminCoupons from "@/pages/admin/Coupons";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});
