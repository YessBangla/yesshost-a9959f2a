import { createFileRoute } from "@tanstack/react-router";
import KnowledgeBaseArticle from "@/pages/company/KnowledgeBaseArticle";

export const Route = createFileRoute("/knowledge-base/$slug")({
  component: KnowledgeBaseArticle,
});
