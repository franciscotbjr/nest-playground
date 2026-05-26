import * as z from 'zod/v4';

export const listUsersInput = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Max users to return'),
  offset: z.number().int().min(0).default(0).describe('Pagination offset'),
};

export const listUsersOutput = {
  users: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      age: z.number(),
      email: z.string().email(),
    }),
  ),
};
