import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/company/About";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About Yess Host | Hosting Company in Dhaka" },
      { name: "description", content: "Learn about Yess Host, our Dhaka BDIX infrastructure, support team and commitment to Bangladeshi businesses." },
      { property: "og:title", content: "About Yess Host | Hosting Company in Dhaka" },
      { property: "og:description", content: "Learn about Yess Host, our Dhaka BDIX infrastructure, support team and commitment to Bangladeshi businesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
