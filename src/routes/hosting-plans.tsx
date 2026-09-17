import { createFileRoute } from "@tanstack/react-router";
import HostingPlans from "@/pages/HostingPlans";

export const Route = createFileRoute("/hosting-plans")({
  component: HostingPlans,
});
