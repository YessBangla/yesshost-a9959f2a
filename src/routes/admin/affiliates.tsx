import { createFileRoute } from "@tanstack/react-router";
import AdminAffiliates from "@/pages/admin/Affiliates";

export const Route = createFileRoute("/admin/affiliates")({
  component: AdminAffiliates,
});
