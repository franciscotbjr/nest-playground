import * as z from 'zod/v4';

export const markPostReadInput = {
  userId: z.string().uuid().describe('Reader user id'),
  postId: z.string().uuid().describe('Post that was read'),
};

export const markPostReadOutput = {
  read: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid().nullable(),
    postId: z.string().uuid().nullable(),
  }),
};
