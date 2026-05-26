import * as z from 'zod/v4';

export const createPostInput = {
  createdBy: z.string().uuid().describe('User id of the author'),
};

export const createPostOutput = {
  post: z.object({
    id: z.string().uuid(),
    createdBy: z.string().uuid().nullable(),
  }),
};
