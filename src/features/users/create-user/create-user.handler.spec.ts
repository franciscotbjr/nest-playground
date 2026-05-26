import { createUserHandler } from './create-user.handler';
import { createMockDb } from '../../../test-utils/mock-db';

describe('createUserHandler', () => {
  it('inserts the user and returns the inserted row', async () => {
    const inserted = {
      id: 'u1',
      name: 'Alice',
      age: 30,
      email: 'a@x.com',
      emailUnverified: false,
    };
    const db = createMockDb([inserted]);

    const result = await createUserHandler(db, {
      name: 'Alice',
      age: 30,
      email: 'a@x.com',
    });

    expect(result).toEqual(inserted);
    expect(db.__calls.insert).toHaveBeenCalledTimes(1);
    expect(db.__calls.values).toHaveBeenCalledWith({
      name: 'Alice',
      age: 30,
      email: 'a@x.com',
    });
    expect(db.__calls.returning).toHaveBeenCalledTimes(1);
  });

  it('propagates db errors', async () => {
    const db = createMockDb(
      new Error('duplicate key value violates unique constraint'),
    );
    await expect(
      createUserHandler(db, { name: 'A', age: 1, email: 'a@x.com' }),
    ).rejects.toThrow('duplicate key');
  });
});
