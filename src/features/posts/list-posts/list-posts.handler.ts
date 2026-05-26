import { eq } from 'drizzle-orm';
import type { Db } from '../../../db/db.tokens';
import { postTable } from '../../../db/schema';

export interface ListPostsInput {
  createdBy?: string;
  limit: number;
  offset: number;
}

export async function listPostsHandler(
  db: Db,
  { createdBy, limit, offset }: ListPostsInput,
) {
  const base = db
    .select({ id: postTable.id, createdBy: postTable.createdBy })
    .from(postTable);
  const query = createdBy
    ? base.where(eq(postTable.createdBy, createdBy))
    : base;
  const rows = await query.limit(limit).offset(offset);
  return { posts: rows };
}
