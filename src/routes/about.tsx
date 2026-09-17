import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/company/About";

export const Route = createFileRoute("/about")({
  component: About,
});
