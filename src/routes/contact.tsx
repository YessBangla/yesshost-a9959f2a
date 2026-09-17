import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/company/Contact";

export const Route = createFileRoute("/contact")({
  component: Contact,
});
