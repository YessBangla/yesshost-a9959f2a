import { createFileRoute } from "@tanstack/react-router";
import AdminLiveChat from "@/pages/admin/LiveChat";

export const Route = createFileRoute("/admin/live-chat")({
  component: AdminLiveChat,
  head: () => ({
    meta: [
      { title: "Live Chat Console | Yess Host Admin" },
      { name: "description", content: "Answer visitor live chats and calls in real time." },
      { property: "og:title", content: "Live Chat Console | Yess Host Admin" },
      { property: "og:description", content: "Answer visitor live chats and calls in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
