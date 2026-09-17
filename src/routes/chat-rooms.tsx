import { createFileRoute } from "@tanstack/react-router";
import ChatRooms from "@/pages/ChatRooms";

export const Route = createFileRoute("/chat-rooms")({
  component: ChatRooms,
});
