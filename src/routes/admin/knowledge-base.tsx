import { createFileRoute } from "@tanstack/react-router";
import AdminKnowledgeBase from "@/pages/admin/KnowledgeBase";

export const Route = createFileRoute("/admin/knowledge-base")({
  head: () => ({
    meta: [
      { title: "Knowledge Base Operations | Yess Host Admin" },
      { name: "description", content: "Manage Yess Host help categories, bilingual articles and publishing status." },
      { property: "og:title", content: "Knowledge Base Operations | Yess Host Admin" },
      { property: "og:description", content: "Manage Yess Host help categories, bilingual articles and publishing status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminKnowledgeBase,
});
