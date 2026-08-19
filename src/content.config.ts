import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    base: './src/content/posts',
    pattern: '**/*.{md,mdx}',
    generateId: ({ entry }) =>
      entry.replace(/\.(md|mdx)$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''),
  }),
  schema: z.object({
    title: z.string(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    locale: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({
    base: './src/content/pages',
    pattern: '**/*.{md,mdx}',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/i, ''),
  }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    locale: z.string().optional(),
    sitemap: z.boolean().optional(),
    permalink: z.string().optional(),
    layout: z.string().optional(),
    author_profile: z.boolean().optional(),
    toc: z.boolean().optional(),
    toc_sticky: z.boolean().optional(),
  }),
});

export const collections = { posts, pages };
