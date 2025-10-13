import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { PublicLayout } from "@/components/public-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog/posts";

type Params = Promise<{
  slug: string;
}>;

type Props = {
  params: Params;
};

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.meta.title} | Furnish Blog`,
    description: post.meta.summary,
    openGraph: {
      title: post.meta.title,
      description: post.meta.summary,
      type: "article",
      publishedTime: post.meta.date,
      authors: post.meta.author ? [post.meta.author] : undefined,
      images: post.meta.image ? [post.meta.image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post?.meta.published) {
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
              <time dateTime={post.meta.date}>
                {new Date(post.meta.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.meta.author ? (
                <>
                  <span>•</span>
                  <span>{post.meta.author}</span>
                </>
              ) : null}
            </div>

            <h1 className="mb-4 font-bold text-4xl tracking-tight">
              {post.meta.title}
            </h1>

            <p className="mb-6 text-muted-foreground text-xl">
              {post.meta.summary}
            </p>

            {post.meta.tags && post.meta.tags.length > 0 ? (
              <div className="mb-8 flex flex-wrap gap-2">
                {post.meta.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}

            {post.meta.image ? (
              <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <div
                  aria-label={post.meta.title}
                  className="h-full w-full bg-center bg-cover"
                  role="img"
                  style={{ backgroundImage: `url(${post.meta.image})` }}
                />
              </div>
            ) : null}
          </header>

          <MDXRemote source={post.content} />
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
