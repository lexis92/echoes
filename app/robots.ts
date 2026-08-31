import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private surfaces, and the one-time auth callbacks.
        disallow: [
          "/api/",
          "/dashboard",
          "/inbox",
          "/messages/",
          "/favorites",
          "/archive",
          "/scheduled",
          "/trash",
          "/settings",
          "/setup",
          "/auth/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
