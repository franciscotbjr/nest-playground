import { markPostReadHandler } from './mark-post-read.handler';
import { createMockDb } from '../../../test-utils/mock-db';

describe('markPostReadHandler', () => {
  it('inserts a postRead row and returns it', async () => {
    const inserted = { id: 'r1', userId: 'u1', postId: 'p1' };
    const db = createMockDb([inserted]);

    const result = await markPostReadHandler(db, {
      userId: 'u1',
      postId: 'p1',
    });

    expect(result).toEqual(inserted);
    expect(db.__calls.values).toHaveBeenCalledWith({
      userId: 'u1',
      postId: 'p1',
    });
    expect(db.__calls.returning).toHaveBeenCalledTimes(1);
  });

  it('propagates db errors', async () => {
    const db = createMockDb(new Error('violates foreign key constraint'));
    await expect(
      markPostReadHandler(db, { userId: 'u1', postId: 'missing' }),
    ).rejects.toThrow('foreign key');
  });
});
