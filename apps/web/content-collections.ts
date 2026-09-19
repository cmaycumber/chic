import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod/v3";

const posts = defineCollection({
  directory: "content/posts",
  include: "**/*.mdx",
  name: "posts",
  schema: z.object({
    author: z.string().optional(),
    content: z.string(),
    date: z.string(),
    image: z.string().optional(),
    published: z.boolean().default(true),
    summary: z.string(),
    tags: z.array(z.string()).optional(),
    title: z.string(),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document);

    return {
      ...document,
      mdx,
      slug: document._meta.path,
      url: `/blog/${document._meta.path}`,
    };
  },
});

export default defineConfig({
  content: [posts],
});
