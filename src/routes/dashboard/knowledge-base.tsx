import { createFileRoute } from "@tanstack/react-router";
import DashboardKnowledgeBase from "@/pages/dashboard/KnowledgeBasePage";

export const Route = createFileRoute("/dashboard/knowledge-base")({
  component: DashboardKnowledgeBase,
});
