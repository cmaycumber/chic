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
  title: "Blog | Furnish",
  description:
    "Interior design tips, sustainable furniture guides, and home decor inspiration.",
};

export default function BlogPage() {
  const sortedPosts = allPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-bold text-4xl">Our Blog</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Discover interior design inspiration, sustainable living tips, and
          expert advice to transform your space.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedPosts.map((post) => (
          <Link className="group" href={post.url} key={post._meta.path}>
            <Card className="hover:-translate-y-1 h-full transition-all hover:shadow-lg">
              {post.image ? (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                  <img
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={post.image}
                  />
                </div>
              ) : null}
              <CardHeader>
                <div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
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
