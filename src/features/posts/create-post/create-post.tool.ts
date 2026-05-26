import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDeps } from '../../../mcp/tool-registry';
import { formatError } from '../../../mcp/format-error';
import { createPostInput, createPostOutput } from './create-post.schema';
import { createPostHandler } from './create-post.handler';

export function registerCreatePostTool(
  server: McpServer,
  { db }: ToolDeps,
): void {
  server.registerTool(
    'posts.create',
    {
      title: 'Create Post',
      description: 'Creates a post authored by the given user id',
      inputSchema: createPostInput,
      outputSchema: createPostOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (input) => {
      try {
        const post = await createPostHandler(db, input);
        return {
          content: [{ type: 'text', text: `Created post ${post.id}` }],
          structuredContent: { post },
        };
      } catch (err) {
        const formatted = formatError(err);
        const isFkViolation = /foreign key|violates/i.test(formatted);
        return {
          content: [
            {
              type: 'text',
              text: isFkViolation
                ? `Author ${input.createdBy} does not exist`
                : `Failed to create post: ${formatted}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
