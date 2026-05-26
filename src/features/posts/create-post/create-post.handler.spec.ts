import { createPostHandler } from './create-post.handler';
import { createMockDb } from '../../../test-utils/mock-db';

describe('createPostHandler', () => {
  it('inserts a post and returns the inserted row', async () => {
    const inserted = { id: 'p1', createdBy: 'u1' };
    const db = createMockDb([inserted]);

    const result = await createPostHandler(db, { createdBy: 'u1' });

    expect(result).toEqual(inserted);
    expect(db.__calls.insert).toHaveBeenCalledTimes(1);
    expect(db.__calls.values).toHaveBeenCalledWith({ createdBy: 'u1' });
  });

  it('propagates db errors', async () => {
    const db = createMockDb(new Error('foreign key violation'));
    await expect(
      createPostHandler(db, { createdBy: 'missing' }),
    ).rejects.toThrow('foreign key');
  });
});
