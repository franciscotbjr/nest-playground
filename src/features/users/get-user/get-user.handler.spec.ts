import { getUserHandler } from './get-user.handler';
import { createMockDb } from '../../../test-utils/mock-db';

describe('getUserHandler', () => {
  it('returns the user when found', async () => {
    const user = {
      id: 'u1',
      name: 'Alice',
      age: 30,
      email: 'a@x.com',
      emailUnverified: false,
    };
    const db = createMockDb([user]);

    const result = await getUserHandler(db, { id: 'u1' });

    expect(result).toEqual(user);
    expect(db.__calls.where).toHaveBeenCalledTimes(1);
    expect(db.__calls.limit).toHaveBeenCalledWith(1);
  });

  it('returns null when not found', async () => {
    const db = createMockDb([]);
    const result = await getUserHandler(db, { id: 'missing' });
    expect(result).toBeNull();
  });
});
