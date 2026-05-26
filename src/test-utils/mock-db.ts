import type { Db } from '../db/db.tokens';

export interface MockDb extends Db {
  __calls: {
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    limit: jest.Mock;
    offset: jest.Mock;
    insert: jest.Mock;
    values: jest.Mock;
    returning: jest.Mock;
  };
}

export function createMockDb<T>(
  resolved: T | (() => T | Promise<T>) | Error,
): MockDb {
  const builder: Record<string, unknown> = {};
  const calls = {
    select: jest.fn().mockReturnValue(builder),
    from: jest.fn().mockReturnValue(builder),
    where: jest.fn().mockReturnValue(builder),
    limit: jest.fn().mockReturnValue(builder),
    offset: jest.fn().mockReturnValue(builder),
    insert: jest.fn().mockReturnValue(builder),
    values: jest.fn().mockReturnValue(builder),
    returning: jest.fn().mockReturnValue(builder),
  };
  Object.assign(builder, calls);
  builder.then = (
    onFulfilled?: (v: T) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) => {
    if (resolved instanceof Error) {
      return Promise.reject(resolved).then(onFulfilled, onRejected);
    }
    const value =
      typeof resolved === 'function'
        ? (resolved as () => T | Promise<T>)()
        : resolved;
    return Promise.resolve(value).then(onFulfilled, onRejected);
  };
  const db = builder as unknown as MockDb;
  db.__calls = calls;
  return db;
}
