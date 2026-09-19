import { createFileRoute } from "@tanstack/react-router";
import KnowledgeBase from "@/pages/company/KnowledgeBase";

export const Route = createFileRoute("/knowledge-base/")({
  component: KnowledgeBase,
  head: () => ({
    meta: [
      { title: "Knowledge Base | Yess Host" },
      { name: "description", content: "Step-by-step guides for cPanel, email, domains, SSL and WordPress in Bangla and English." },
      { property: "og:title", content: "Knowledge Base | Yess Host" },
      { property: "og:description", content: "Step-by-step guides for cPanel, email, domains, SSL and WordPress in Bangla and English." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
