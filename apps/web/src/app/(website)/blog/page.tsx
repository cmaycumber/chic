import { allPosts } from "content-collections";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  description:
    "Expert interior design tips, AI design guides, room transformation ideas, and home decor inspiration. Learn how to use AI for interior design from our free AI interior designer.",
  keywords: [
    "interior design blog",
    "ai interior design tips",
    "room design ideas",
    "interior design guide",
    "ai designer tips",
  ],
  openGraph: {
    description:
      "Expert interior design tips and AI design guides to help you transform your space.",
    images: [
      {
        alt: "Interior Design Blog - Expert tips and guides",
        height: 630,
        url: "/images/interior-design-ai-basics.png",
        width: 1200,
      },
    ],
    title: "Interior Design Blog - AI Interior Designer Tips & Guides",
    type: "website",
  },
  title: "Interior Design Blog | AI Interior Designer Tips & Guides - Chic",
  twitter: {
    card: "summary_large_image",
    description:
      "Expert interior design tips and AI design guides to help you transform your space.",
    images: ["/images/interior-design-ai-basics.png"],
    title: "Interior Design Blog - AI Interior Designer Tips & Guides",
  },
};

export default function BlogPage() {
  const sortedPosts = allPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-bold text-4xl">AI Interior Designer Blog</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Interior design inspiration, AI design tips, and expert guidance to
          help you transform your space. Learn how to use AI for interior design
          effectively.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedPosts.map((post) => (
          <Link className="group" href={`/blog/${post.slug}`} key={post.slug}>
            <Card className="h-full pt-0 transition-all hover:-translate-y-1 hover:shadow-lg">
              {post.image ? (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                  <div
                    aria-label={post.title}
                    className="h-full w-full rounded-t-lg bg-center bg-cover transition-transform duration-300 group-hover:scale-105"
                    role="img"
                    style={{ backgroundImage: `url(${post.image})` }}
                  />
                </div>
              ) : null}
              <CardHeader>
                <div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  {post.author ? (
                    <>
                      <span>•</span>
                      <span>{post.author}</span>
                    </>
                  ) : null}
                </div>
                <CardTitle className="transition-colors group-hover:text-primary">
                  {post.title}
                </CardTitle>
                <CardDescription>{post.summary}</CardDescription>
              </CardHeader>
              {post.tags && post.tags.length > 0 ? (
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              ) : null}
            </Card>
          </Link>
        ))}
      </div>

      {sortedPosts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No blog posts found.</p>
        </div>
      ) : null}
    </div>
  );
}
