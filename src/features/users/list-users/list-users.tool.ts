import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDeps } from '../../../mcp/tool-registry';
import { formatError } from '../../../mcp/format-error';
import { listUsersInput, listUsersOutput } from './list-users.schema';
import { listUsersHandler } from './list-users.handler';

export function registerListUsersTool(
  server: McpServer,
  { db }: ToolDeps,
): void {
  server.registerTool(
    'users.list',
    {
      title: 'List Users',
      description: 'Lists registered users with pagination',
      inputSchema: listUsersInput,
      outputSchema: listUsersOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (input) => {
      try {
        const data = await listUsersHandler(db, input);
        return {
          content: [{ type: 'text', text: `${data.users.length} users` }],
          structuredContent: data,
        };
      } catch (err) {
        return {
          content: [
            { type: 'text', text: `Failed to list users: ${formatError(err)}` },
          ],
          isError: true,
        };
      }
    },
  );
}
