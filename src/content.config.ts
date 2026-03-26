import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const modules = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/modules' }),
  schema: z.object({
    title: z.string(),
    lessonId: z.string(),
    moduleId: z.string(),
    order: z.number(),
    xpReward: z.number().default(100),
    robotPart: z.string().optional(),
    requiresParts: z.array(z.string()).default([]),
    isBonus: z.boolean().default(false),
    challengeId: z.string().optional(),
    journalEntry: z.string().optional(),
  }),
});

export const collections = { modules };
