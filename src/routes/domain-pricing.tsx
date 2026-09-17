import { createFileRoute } from "@tanstack/react-router";
import DomainPricing from "@/pages/DomainPricing";

export const Route = createFileRoute("/domain-pricing")({
  component: DomainPricing,
});
