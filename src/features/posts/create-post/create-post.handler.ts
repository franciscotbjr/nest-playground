import type { Db } from '../../../db/db.tokens';
import { postTable } from '../../../db/schema';

export async function createPostHandler(
  db: Db,
  { createdBy }: { createdBy: string },
) {
  const [post] = await db
    .insert(postTable)
    .values({ createdBy })
    .returning({ id: postTable.id, createdBy: postTable.createdBy });
  return post;
}
