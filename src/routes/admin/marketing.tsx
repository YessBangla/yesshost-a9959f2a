import { createFileRoute } from "@tanstack/react-router";
import AdminMarketing from "@/pages/admin/Marketing";

export const Route = createFileRoute("/admin/marketing")({
  component: AdminMarketing,
});
