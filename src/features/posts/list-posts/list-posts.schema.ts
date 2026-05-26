import * as z from 'zod/v4';

export const listPostsInput = {
  createdBy: z.string().uuid().optional().describe('Filter by author user id'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Max posts to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
};

export const listPostsOutput = {
  posts: z.array(
    z.object({
      id: z.string().uuid(),
      createdBy: z.string().uuid().nullable(),
    }),
  ),
};
