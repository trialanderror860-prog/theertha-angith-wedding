import { createFileRoute } from "@tanstack/react-router";
import { WeddingInvitation } from "@/components/wedding-invitation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Odyssey | Theertha & Anigith" },
      {
        name: "description",
        content: "A botanical wedding invitation celebrating Theertha and Anigith on Sunday, 10 January 2027.",
      },
      { property: "og:title", content: "The Odyssey | Theertha & Anigith" },
      {
        property: "og:description",
        content: "An odyssey of two souls, stepping into a lifetime side by side. Join Theertha and Anigith on 10 January 2027.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeddingInvitation,
});
