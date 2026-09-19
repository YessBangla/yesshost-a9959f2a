import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled endpoint: emails the monthly statement + trial balance to the
 * configured recipients. Called by the database cron job with a shared secret.
 */
export const Route = createFileRoute("/api/public/accounts-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getCronSecret, getReportSettings, sendAccountsReport } = await import(
          "@/lib/accounts-report.server"
        );
        const provided = request.headers.get("x-report-secret") || "";
        const expected = await getCronSecret();
        if (!expected || provided.length !== expected.length || provided !== expected) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settings = await getReportSettings();
        if (!settings.enabled) {
          return Response.json({ skipped: true, reason: "Scheduled report disabled" });
        }

        try {
          const result = await sendAccountsReport();
          return Response.json(result, { status: result.ok ? 200 : 500 });
        } catch (error) {
          console.error("[api/public/accounts-report]", error);
          return Response.json({ error: "Failed to send report" }, { status: 500 });
        }
      },
    },
  },
});
