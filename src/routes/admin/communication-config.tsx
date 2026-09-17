import { createFileRoute } from "@tanstack/react-router";
import AdminCommunicationConfig from "@/pages/admin/CommunicationConfig";

export const Route = createFileRoute("/admin/communication-config")({
  component: AdminCommunicationConfig,
});
