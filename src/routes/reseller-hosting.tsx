import { createFileRoute } from "@tanstack/react-router";
import ResellerHosting from "@/pages/ResellerHosting";

export const Route = createFileRoute("/reseller-hosting")({
  component: ResellerHosting,
});
