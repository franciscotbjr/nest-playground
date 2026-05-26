import { listPostsHandler } from './list-posts.handler';
import { createMockDb } from '../../../test-utils/mock-db';

describe('listPostsHandler', () => {
  it('returns posts without filter when createdBy is omitted', async () => {
    const rows = [
      { id: 'p1', createdBy: 'u1' },
      { id: 'p2', createdBy: 'u2' },
    ];
    const db = createMockDb(rows);

    const result = await listPostsHandler(db, { limit: 10, offset: 0 });

    expect(result).toEqual({ posts: rows });
    expect(db.__calls.where).not.toHaveBeenCalled();
    expect(db.__calls.limit).toHaveBeenCalledWith(10);
  });

  it('applies the createdBy filter when provided', async () => {
    const rows = [{ id: 'p1', createdBy: 'u1' }];
    const db = createMockDb(rows);

    const result = await listPostsHandler(db, {
      createdBy: 'u1',
      limit: 5,
      offset: 2,
    });

    expect(result).toEqual({ posts: rows });
    expect(db.__calls.where).toHaveBeenCalledTimes(1);
    expect(db.__calls.offset).toHaveBeenCalledWith(2);
  });
});
