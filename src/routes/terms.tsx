import { createFileRoute } from "@tanstack/react-router";
import Terms from "@/pages/legal/Terms";

export const Route = createFileRoute("/terms")({
  component: Terms,
});
