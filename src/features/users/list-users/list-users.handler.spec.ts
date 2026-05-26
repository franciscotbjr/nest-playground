import { listUsersHandler } from './list-users.handler';
import { createMockDb } from '../../../test-utils/mock-db';

describe('listUsersHandler', () => {
  it('returns users from db with limit/offset applied', async () => {
    const rows = [
      { id: 'u1', name: 'Alice', age: 30, email: 'a@x.com' },
      { id: 'u2', name: 'Bob', age: 25, email: 'b@x.com' },
    ];
    const db = createMockDb(rows);

    const result = await listUsersHandler(db, { limit: 50, offset: 10 });

    expect(result).toEqual({ users: rows });
    expect(db.__calls.select).toHaveBeenCalledTimes(1);
    expect(db.__calls.limit).toHaveBeenCalledWith(50);
    expect(db.__calls.offset).toHaveBeenCalledWith(10);
  });

  it('returns empty list when db has no rows', async () => {
    const db = createMockDb([]);
    const result = await listUsersHandler(db, { limit: 20, offset: 0 });
    expect(result).toEqual({ users: [] });
  });
});
