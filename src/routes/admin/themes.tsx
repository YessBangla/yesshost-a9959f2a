import { createFileRoute } from "@tanstack/react-router";
import AdminThemes from "@/pages/admin/Themes";

export const Route = createFileRoute("/admin/themes")({
  component: AdminThemes,
});
