import { createFileRoute } from "@tanstack/react-router";
import AdminChatRooms from "@/pages/admin/ChatRooms";

export const Route = createFileRoute("/admin/chat-rooms")({
  component: AdminChatRooms,
  head: () => ({
    meta: [
      { title: "Chat Rooms | Yess Host Admin" },
      { name: "description", content: "Moderate community chat rooms and membership requests." },
      { property: "og:title", content: "Chat Rooms | Yess Host Admin" },
      { property: "og:description", content: "Moderate community chat rooms and membership requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
