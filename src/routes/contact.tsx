import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/company/Contact";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact Yess Host | Support & Sales" },
      { name: "description", content: "Reach the Yess Host team in Uttara, Dhaka by phone, email or live chat for sales and technical support." },
      { property: "og:title", content: "Contact Yess Host | Support & Sales" },
      { property: "og:description", content: "Reach the Yess Host team in Uttara, Dhaka by phone, email or live chat for sales and technical support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
