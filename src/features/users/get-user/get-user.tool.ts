import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDeps } from '../../../mcp/tool-registry';
import { formatError } from '../../../mcp/format-error';
import { getUserInput, getUserOutput } from './get-user.schema';
import { getUserHandler } from './get-user.handler';

export function registerGetUserTool(server: McpServer, { db }: ToolDeps): void {
  server.registerTool(
    'users.get',
    {
      title: 'Get User',
      description: 'Fetches a single user by id',
      inputSchema: getUserInput,
      outputSchema: getUserOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      try {
        const user = await getUserHandler(db, { id });
        if (!user) {
          return {
            content: [{ type: 'text', text: `User ${id} not found` }],
            isError: true,
          };
        }
        return {
          content: [
            { type: 'text', text: `User ${user.name} (${user.email})` },
          ],
          structuredContent: { user },
        };
      } catch (err) {
        return {
          content: [
            { type: 'text', text: `Failed to fetch user: ${formatError(err)}` },
          ],
          isError: true,
        };
      }
    },
  );
}
