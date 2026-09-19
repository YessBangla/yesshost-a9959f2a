import { createFileRoute } from "@tanstack/react-router";
import DashboardKnowledgeBase from "@/pages/dashboard/KnowledgeBasePage";

export const Route = createFileRoute("/dashboard/knowledge-base")({
  component: DashboardKnowledgeBase,
  head: () => ({
    meta: [
      { title: "Knowledge Base | Yess Host Dashboard" },
      { name: "description", content: "Search hosting and domain guides from inside your dashboard." },
      { property: "og:title", content: "Knowledge Base | Yess Host Dashboard" },
      { property: "og:description", content: "Search hosting and domain guides from inside your dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
