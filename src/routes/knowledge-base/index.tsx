import { createFileRoute } from "@tanstack/react-router";
import KnowledgeBase from "@/pages/company/KnowledgeBase";

export const Route = createFileRoute("/knowledge-base/")({
  component: KnowledgeBase,
});
