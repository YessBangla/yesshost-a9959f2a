import { createFileRoute } from "@tanstack/react-router";
import ThemeDemo from "@/pages/themes/ThemeDemo";

export const Route = createFileRoute("/themes/$slug/demo")({
  component: ThemeDemo,
});
