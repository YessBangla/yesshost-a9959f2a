import { createFileRoute } from "@tanstack/react-router";
import { loadChatMessages } from "@/lib/dashboard-data.server";

export const Route = createFileRoute("/api/public/live-chat-messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const chatId = new URL(request.url).searchParams.get("chatId");
        if (!chatId) return Response.json({ error: "chatId is required" }, { status: 400 });
        try {
          const messages = await loadChatMessages(chatId);
          return Response.json({ messages }, { headers: { "cache-control": "no-store" } });
        } catch (error) {
          console.error("[api/public/live-chat-messages]", error);
          return Response.json({ error: "Failed to load messages" }, { status: 500 });
        }
      },
    },
  },
});
