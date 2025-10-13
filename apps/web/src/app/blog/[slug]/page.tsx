import { MDXContent } from "@content-collections/mdx/react";
import { allPosts } from "content-collections";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/public-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Params = Promise<{
  slug: string;
}>;

type Props = {
  params: Params;
};

export function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | Furnish Blog`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);

  if (!post?.published) {
    notFound();
  }

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Link href="/blog">
          <Button className="mb-8" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <header className="not-prose mb-8">
            <div className="mb-4 flex items-center gap-2 text-muted-foreground text-sm">
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

            <h1 className="mb-4 font-bold text-4xl tracking-tight">
              {post.title}
            </h1>

            <p className="mb-6 text-muted-foreground text-xl">{post.summary}</p>

            {post.tags && post.tags.length > 0 ? (
              <div className="mb-8 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}

            {post.image ? (
              <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <div
                  aria-label={post.title}
                  className="h-full w-full bg-center bg-cover"
                  role="img"
                  style={{ backgroundImage: `url(${post.image})` }}
                />
              </div>
            ) : null}
          </header>

          <MDXContent code={post.mdx} />
        </article>

        <footer className="mt-12 border-t pt-8">
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all posts
            </Button>
          </Link>
        </footer>
      </div>
    </PublicLayout>
  );
}
