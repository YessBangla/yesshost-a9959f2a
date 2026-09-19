import { createFileRoute } from "@tanstack/react-router";
import ChatRooms from "@/pages/ChatRooms";

export const Route = createFileRoute("/chat-rooms")({
  component: ChatRooms,
  head: () => ({
    meta: [
      { title: "Community Chat Rooms | Yess Host" },
      { name: "description", content: "Join Yess Host community rooms to discuss hosting, domains and website building with other customers." },
      { property: "og:title", content: "Community Chat Rooms | Yess Host" },
      { property: "og:description", content: "Join Yess Host community rooms to discuss hosting, domains and website building with other customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
