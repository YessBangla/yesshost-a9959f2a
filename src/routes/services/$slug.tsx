import { createFileRoute } from "@tanstack/react-router";
import ServiceDetail from "@/pages/services/ServiceDetail";

export const Route = createFileRoute("/services/$slug")({
  component: ServiceDetail,
});
