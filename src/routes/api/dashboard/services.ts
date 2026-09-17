import { createFileRoute } from "@tanstack/react-router";
import { createUserClientFromRequest, loadServices } from "@/lib/dashboard-data.server";

export const Route = createFileRoute("/api/dashboard/services")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await createUserClientFromRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });
        try {
          const payload = await loadServices(auth.supabase, auth.userId);
          return Response.json(payload, {
            headers: { "cache-control": "private, no-store" },
          });
        } catch (error) {
          console.error("[api/dashboard/services]", error);
          return Response.json({ error: "Failed to load services" }, { status: 500 });
        }
      },
    },
  },
});
