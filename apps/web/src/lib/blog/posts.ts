import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type PostMeta = {
  title: string;
  date: string;
  summary: string;
  author?: string;
  tags?: Array<string>;
  image?: string;
  published: boolean;
};

export type Post = {
  slug: string;
  meta: PostMeta;
  content: string;
};

const postsDirectory = path.join(process.cwd(), "content/posts");

export function getAllPosts(): Array<Post> {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPosts: Array<Post> = fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        meta: {
          title: data.title,
          date: data.date,
          summary: data.summary,
          author: data.author,
          tags: data.tags,
          image: data.image,
          published: data.published ?? true,
        },
        content,
      };
    });

  return allPosts.sort((a, b) => {
    const dateA = new Date(a.meta.date);
    const dateB = new Date(b.meta.date);
    return dateB.getTime() - dateA.getTime();
  });
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      meta: {
        title: data.title,
        date: data.date,
        summary: data.summary,
        author: data.author,
        tags: data.tags,
        image: data.image,
        published: data.published ?? true,
      },
      content,
    };
  } catch {
    return null;
  }
}

export function getAllPostSlugs(): Array<string> {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => fileName.replace(/\.mdx$/, ""));
}




