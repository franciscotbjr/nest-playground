import * as z from 'zod/v4';

export const createUserInput = {
  name: z.string().min(1).max(255).describe('Full name'),
  age: z.number().int().min(0).max(150).describe('Age in years'),
  email: z.string().email().max(255).describe('Unique email address'),
};

export const createUserOutput = {
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
    emailUnverified: z.boolean().nullable(),
  }),
};
