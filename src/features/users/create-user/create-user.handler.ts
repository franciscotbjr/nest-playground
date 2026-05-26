import type { Db } from '../../../db/db.tokens';
import { usersTable } from '../../../db/schema';

export interface CreateUserInput {
  name: string;
  age: number;
  email: string;
}

export async function createUserHandler(db: Db, input: CreateUserInput) {
  const [user] = await db.insert(usersTable).values(input).returning({
    id: usersTable.id,
    name: usersTable.name,
    age: usersTable.age,
    email: usersTable.email,
    emailUnverified: usersTable.emailUnverified,
  });
  return user;
}
