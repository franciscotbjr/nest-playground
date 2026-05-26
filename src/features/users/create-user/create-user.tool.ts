import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolDeps } from '../../../mcp/tool-registry';
import { formatError } from '../../../mcp/format-error';
import { createUserInput, createUserOutput } from './create-user.schema';
import { createUserHandler } from './create-user.handler';

export function registerCreateUserTool(
  server: McpServer,
  { db }: ToolDeps,
): void {
  server.registerTool(
    'users.create',
    {
      title: 'Create User',
      description: 'Creates a new user. Email must be unique.',
      inputSchema: createUserInput,
      outputSchema: createUserOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (input) => {
      try {
        const user = await createUserHandler(db, input);
        return {
          content: [
            { type: 'text', text: `Created user ${user.name} (${user.id})` },
          ],
          structuredContent: { user },
        };
      } catch (err) {
        const formatted = formatError(err);
        const isUniqueViolation = /unique|duplicate/i.test(formatted);
        return {
          content: [
            {
              type: 'text',
              text: isUniqueViolation
                ? `Email already in use: ${input.email}`
                : `Failed to create user: ${formatted}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
