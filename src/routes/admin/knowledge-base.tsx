import { createFileRoute } from "@tanstack/react-router";
import AdminKnowledgeBase from "@/pages/admin/KnowledgeBase";

export const Route = createFileRoute("/admin/knowledge-base")({
  component: AdminKnowledgeBase,
});
