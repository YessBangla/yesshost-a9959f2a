import { createFileRoute } from "@tanstack/react-router";
import AdminChatRooms from "@/pages/admin/ChatRooms";

export const Route = createFileRoute("/admin/chat-rooms")({
  component: AdminChatRooms,
});
