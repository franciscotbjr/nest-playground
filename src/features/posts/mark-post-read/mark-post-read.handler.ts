import type { Db } from '../../../db/db.tokens';
import { postReadTable } from '../../../db/schema';

export async function markPostReadHandler(
  db: Db,
  { userId, postId }: { userId: string; postId: string },
) {
  const [read] = await db
    .insert(postReadTable)
    .values({ userId, postId })
    .returning({
      id: postReadTable.id,
      userId: postReadTable.userId,
      postId: postReadTable.postId,
    });
  return read;
}
