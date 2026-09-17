import { createFileRoute } from "@tanstack/react-router";
import ThemeStore from "@/pages/themes/ThemeStore";

export const Route = createFileRoute("/themes/")({
  component: ThemeStore,
});
