import { createFileRoute } from "@tanstack/react-router";
import AdminCMS from "@/pages/admin/CMS";

export const Route = createFileRoute("/admin/cms")({
  component: AdminCMS,
});
