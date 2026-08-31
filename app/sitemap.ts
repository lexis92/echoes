import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

/**
 * Only the marketing surface is listed. Public profile pages are deliberately
 * excluded: a share link is for the people you give it to, not for search.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/signup"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/login"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
