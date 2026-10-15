import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    excerpt: z.string(),
    metaDescription: z.string().optional(),
    ogImage: z.string().optional(),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    // CSS object-position for the desktop 2:1 crop, e.g. "50% 35%". Defaults to center.
    heroPosition: z.string().optional(),
    primaryKeyword: z.string().optional(),
    secondaryKeywords: z.array(z.string()).optional(),
    updatedDate: z.string().optional(),
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .optional(),
  }),
});

export const collections = { blog };
