import type { Db } from '../../../db/db.tokens';
import { usersTable } from '../../../db/schema';

export interface ListUsersInput {
  limit: number;
  offset: number;
}

export async function listUsersHandler(
  db: Db,
  { limit, offset }: ListUsersInput,
) {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      age: usersTable.age,
      email: usersTable.email,
    })
    .from(usersTable)
    .limit(limit)
    .offset(offset);
  return { users: rows };
}
