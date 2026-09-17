import { createFileRoute } from "@tanstack/react-router";
import Affiliate from "@/pages/company/Affiliate";

export const Route = createFileRoute("/affiliate")({
  component: Affiliate,
});
