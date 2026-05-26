import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDeps } from '../../../mcp/tool-registry';
import { formatError } from '../../../mcp/format-error';
import { listPostsInput, listPostsOutput } from './list-posts.schema';
import { listPostsHandler } from './list-posts.handler';

export function registerListPostsTool(
  server: McpServer,
  { db }: ToolDeps,
): void {
  server.registerTool(
    'posts.list',
    {
      title: 'List Posts',
      description: 'Lists posts, optionally filtered by author',
      inputSchema: listPostsInput,
      outputSchema: listPostsOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (input) => {
      try {
        const data = await listPostsHandler(db, input);
        return {
          content: [{ type: 'text', text: `${data.posts.length} posts` }],
          structuredContent: data,
        };
      } catch (err) {
        return {
          content: [
            { type: 'text', text: `Failed to list posts: ${formatError(err)}` },
          ],
          isError: true,
        };
      }
    },
  );
}
