import { eq } from 'drizzle-orm';
import type { Db } from '../../../db/db.tokens';
import { usersTable } from '../../../db/schema';

export async function getUserHandler(db: Db, { id }: { id: string }) {
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      age: usersTable.age,
      email: usersTable.email,
      emailUnverified: usersTable.emailUnverified,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  return user ?? null;
}
