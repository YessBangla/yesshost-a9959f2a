import { createFileRoute } from "@tanstack/react-router";
import DomainSearchPage from "@/pages/DomainSearchPage";

export const Route = createFileRoute("/domain-search")({
  component: DomainSearchPage,
  head: () => ({
    meta: [
      { title: "Domain Name Search | Yess Host" },
      { name: "description", content: "Check availability for .com, .net, .com.bd and more, with instant pricing in BDT and AI name suggestions." },
      { property: "og:title", content: "Domain Name Search | Yess Host" },
      { property: "og:description", content: "Check availability for .com, .net, .com.bd and more, with instant pricing in BDT and AI name suggestions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
