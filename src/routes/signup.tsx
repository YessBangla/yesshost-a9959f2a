import { createFileRoute } from "@tanstack/react-router";
import Signup from "@/pages/Signup";

export const Route = createFileRoute("/signup")({
  component: Signup,
  head: () => ({
    meta: [
      { title: "Create Your Account | Yess Host" },
      { name: "description", content: "Open a Yess Host client account to order hosting, register domains and track your services." },
      { property: "og:title", content: "Create Your Account | Yess Host" },
      { property: "og:description", content: "Open a Yess Host client account to order hosting, register domains and track your services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
