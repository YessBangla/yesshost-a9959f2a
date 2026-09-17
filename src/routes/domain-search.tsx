import { createFileRoute } from "@tanstack/react-router";
import DomainSearchPage from "@/pages/DomainSearchPage";

export const Route = createFileRoute("/domain-search")({
  component: DomainSearchPage,
});
