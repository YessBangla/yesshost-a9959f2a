import { createFileRoute } from "@tanstack/react-router";
import AdminWHM from "@/pages/admin/WHM";

export const Route = createFileRoute("/admin/whm")({
  component: AdminWHM,
});
