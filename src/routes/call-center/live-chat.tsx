import { createFileRoute } from "@tanstack/react-router";
import CallCenterLiveChat from "@/pages/callcenter/LiveChat";

export const Route = createFileRoute("/call-center/live-chat")({
  head: () => ({ meta: [
    { title: "Live Customer Conversations | Yess Host" },
    { name: "description", content: "Secure live chat and voice support workspace for Yess Host staff." },
    { property: "og:title", content: "Live Customer Conversations | Yess Host" },
    { property: "og:description", content: "Secure live chat and voice support workspace for Yess Host staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: CallCenterLiveChat,
});
