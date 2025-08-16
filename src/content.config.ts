import { defineCollection, z } from "astro:content";

// Common schema for all campaign content
const campaignContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  heroImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  playerVisible: z.boolean().optional(),
  gmOnly: z.boolean().optional(),
});

// Blog collection (for regular blog posts)
const blog = defineCollection({
  type: 'content',
  schema: campaignContentSchema,
});

// Campaign content collections
const characters = defineCollection({
  type: 'content',
  schema: campaignContentSchema,
});

const locations = defineCollection({
  type: 'content',
  schema: campaignContentSchema,
});

const adventures = defineCollection({
  type: 'content',
  schema: campaignContentSchema,
});

const monsters = defineCollection({
  type: 'content',
  schema: campaignContentSchema,
});

const items = defineCollection({
  type: 'content',
  schema: campaignContentSchema,
});

const campaign = defineCollection({
  type: 'content',
  schema: campaignContentSchema,
});

const environments = defineCollection({
  type: 'content',
  schema: campaignContentSchema,
});

export const collections = { 
  blog,
  characters, 
  locations, 
  adventures, 
  monsters, 
  items, 
  campaign, 
  environments 
};
