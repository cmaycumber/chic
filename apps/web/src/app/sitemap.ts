import { api } from "@furnish/backend/convex/_generated/api";
import { ROOM_TYPES } from "@furnish/backend/convex/lib/roomTaxonomy";
import { allPosts } from "content-collections";
import { fetchQuery } from "convex/nextjs";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

/** Rooms people offered to the gallery. Never worth a 500 on the sitemap. */
async function listedRoomPages(
  baseUrl: string
): Promise<MetadataRoute.Sitemap> {
  try {
    const { rooms } = await fetchQuery(api.rooms.listGalleryForSitemap, {});
    return rooms.map((room) => ({
      changeFrequency: "weekly" as const,
      lastModified: new Date(room.listedAt),
      priority: 0.6,
      url: `${baseUrl}/r/${room.roomId}`,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { baseUrl } = siteConfig;

  const staticPages: MetadataRoute.Sitemap = [
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 1,
      url: baseUrl,
    },
    {
      changeFrequency: "monthly",
      lastModified: new Date(),
      priority: 0.8,
      url: `${baseUrl}/about`,
    },
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 0.9,
      url: `${baseUrl}/design-tools/ai-room-designer`,
    },
    {
      changeFrequency: "daily",
      lastModified: new Date(),
      priority: 0.8,
      url: `${baseUrl}/blog`,
    },
    {
      changeFrequency: "yearly",
      lastModified: new Date(),
      priority: 0.3,
      url: `${baseUrl}/privacy`,
    },
    {
      changeFrequency: "yearly",
      lastModified: new Date(),
      priority: 0.3,
      url: `${baseUrl}/terms`,
    },
  ];

  // The gallery and the nine room types it is browsed by.
  const roomIdeasPages: MetadataRoute.Sitemap = [
    {
      changeFrequency: "daily" as const,
      lastModified: new Date(),
      priority: 1.0,
      url: `${baseUrl}/ideas`,
    },
    ...ROOM_TYPES.map((roomType) => ({
      changeFrequency: "daily" as const,
      lastModified: new Date(),
      priority: 0.9,
      url: `${baseUrl}/ideas/${roomType}`,
    })),
  ];

  const blogPosts: MetadataRoute.Sitemap = allPosts
    .filter((post) => post.published)
    .map((post) => ({
      changeFrequency: "monthly" as const,
      lastModified: new Date(post.date),
      priority: 0.7,
      url: `${baseUrl}/blog/${post.slug}`,
    }));

  const roomPages = await listedRoomPages(baseUrl);

  return [...staticPages, ...roomIdeasPages, ...roomPages, ...blogPosts];
}
