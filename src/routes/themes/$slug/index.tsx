import { createFileRoute } from "@tanstack/react-router";
import ThemeDetail from "@/pages/themes/ThemeDetail";

export const Route = createFileRoute("/themes/$slug/")({
  component: ThemeDetail,
});
