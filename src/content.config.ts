import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every note is a Markdown file in src/content/notes. A note in a series sits in the series' folder
// and names the series and its part number in its front matter.
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      date: z.object({
        created: z.coerce.date(),
        updated: z.coerce.date().optional(),
      }),
      series: z.string().optional(),
      part: z.number().int().positive().optional(),
      // The book the note credits at its end, from src/content/books.yaml.
      book: reference('books').optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    })
    .refine((note) => !note.series === !note.part, {
      message: 'A note in a series needs a part number, and a part number needs a series.',
    }),
});

const books = defineCollection({
  loader: file('./src/content/books.yaml'),
  schema: z.object({
    title: z.string(),
    author: z.string(),
  }),
});

export const collections = { notes, books };
