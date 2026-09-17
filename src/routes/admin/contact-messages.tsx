import { createFileRoute } from "@tanstack/react-router";
import AdminContactMessages from "@/pages/admin/ContactMessages";

export const Route = createFileRoute("/admin/contact-messages")({
  component: AdminContactMessages,
});
