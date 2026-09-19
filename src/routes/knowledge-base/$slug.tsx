import { createFileRoute } from "@tanstack/react-router";
import KnowledgeBaseArticle from "@/pages/company/KnowledgeBaseArticle";

export const Route = createFileRoute("/knowledge-base/$slug")({
  component: KnowledgeBaseArticle,
  head: () => ({
    meta: [
      { title: "Knowledge Base Article | Yess Host" },
      { name: "description", content: "Detailed hosting and domain help article from the Yess Host knowledge base." },
      { property: "og:title", content: "Knowledge Base Article | Yess Host" },
      { property: "og:description", content: "Detailed hosting and domain help article from the Yess Host knowledge base." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
