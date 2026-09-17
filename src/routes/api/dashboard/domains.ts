import { createFileRoute } from "@tanstack/react-router";
import { createUserClientFromRequest, loadDomains } from "@/lib/dashboard-data.server";

export const Route = createFileRoute("/api/dashboard/domains")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await createUserClientFromRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });
        try {
          const payload = await loadDomains(auth.supabase, auth.userId);
          return Response.json(payload, {
            headers: { "cache-control": "private, no-store" },
          });
        } catch (error) {
          console.error("[api/dashboard/domains]", error);
          return Response.json({ error: "Failed to load domains" }, { status: 500 });
        }
      },
    },
  },
});
