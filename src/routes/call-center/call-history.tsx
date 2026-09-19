import { createFileRoute } from "@tanstack/react-router";
import CallCenterCallHistory from "@/pages/callcenter/CallHistory";

export const Route = createFileRoute("/call-center/call-history")({
  head: () => ({ meta: [
    { title: "Call Outcomes & History | Yess Host" }, { name: "description", content: "Customer call outcomes, durations and follow-up history for Yess Host staff." },
    { property: "og:title", content: "Call Outcomes & History | Yess Host" }, { property: "og:description", content: "Customer call outcomes, durations and follow-up history for Yess Host staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: CallCenterCallHistory,
});
