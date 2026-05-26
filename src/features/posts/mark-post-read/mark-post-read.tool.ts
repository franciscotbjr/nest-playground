import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDeps } from '../../../mcp/tool-registry';
import { formatError } from '../../../mcp/format-error';
import { markPostReadInput, markPostReadOutput } from './mark-post-read.schema';
import { markPostReadHandler } from './mark-post-read.handler';

export function registerMarkPostReadTool(
  server: McpServer,
  { db }: ToolDeps,
): void {
  server.registerTool(
    'posts.markRead',
    {
      title: 'Mark Post as Read',
      description: 'Records that the given user has read the given post',
      inputSchema: markPostReadInput,
      outputSchema: markPostReadOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (input) => {
      try {
        const read = await markPostReadHandler(db, input);
        return {
          content: [
            {
              type: 'text',
              text: `Post ${input.postId} marked as read by ${input.userId}`,
            },
          ],
          structuredContent: { read },
        };
      } catch (err) {
        const formatted = formatError(err);
        const isFkViolation = /foreign key|violates/i.test(formatted);
        return {
          content: [
            {
              type: 'text',
              text: isFkViolation
                ? 'User or post does not exist'
                : `Failed to mark post as read: ${formatted}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
