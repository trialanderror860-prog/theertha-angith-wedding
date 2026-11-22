import { createFileRoute } from "@tanstack/react-router";
import { WeddingInvitation } from "@/components/wedding-invitation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Odyssey | Theertha & Angith" },
      {
        name: "description",
        content: "A botanical wedding invitation celebrating Theertha and Angith on Sunday, 10 January 2027.",
      },
      { property: "og:title", content: "The Odyssey | Theertha & Angith" },
      {
        property: "og:description",
        content: "An odyssey of two souls, stepping into a lifetime side by side. Join Theertha and Angith on 10 January 2027.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeddingInvitation,
});
