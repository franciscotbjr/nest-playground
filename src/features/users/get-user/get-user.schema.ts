import * as z from 'zod/v4';

export const getUserInput = {
  id: z.string().uuid().describe('User id'),
};

export const getUserOutput = {
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
    emailUnverified: z.boolean().nullable(),
  }),
};
