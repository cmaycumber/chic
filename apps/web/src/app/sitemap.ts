import { allPosts } from "content-collections";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const { baseUrl } = siteConfig;

  // Static pages
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
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 0.7,
      url: `${baseUrl}/explore`,
    },
    {
      changeFrequency: "monthly",
      lastModified: new Date(),
      priority: 0.6,
      url: `${baseUrl}/signup`,
    },
    {
      changeFrequency: "monthly",
      lastModified: new Date(),
      priority: 0.5,
      url: `${baseUrl}/login`,
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

  // Room ideas pages (high priority for SEO)
  const roomIdeasPages: MetadataRoute.Sitemap = [
    {
      changeFrequency: "daily" as const,
      lastModified: new Date(),
      priority: 1.0, // Main explore page - highest priority
      url: `${baseUrl}/ideas`,
    },
    ...[
      "living-room",
      "bedroom",
      "kitchen",
      "bathroom",
      "dining-room",
      "home-office",
      "family-room",
      "nursery",
      "outdoor",
    ].map((roomType) => ({
      changeFrequency: "daily" as const,
      lastModified: new Date(),
      priority: 0.9,
      url: `${baseUrl}/ideas/${roomType}`,
    })),
  ];

  // Dynamic blog post pages
  const blogPosts: MetadataRoute.Sitemap = allPosts
    .filter((post) => post.published)
    .map((post) => ({
      changeFrequency: "monthly" as const,
      lastModified: new Date(post.date),
      priority: 0.7,
      url: `${baseUrl}/blog/${post.slug}`,
    }));

  return [...staticPages, ...roomIdeasPages, ...blogPosts];
}
