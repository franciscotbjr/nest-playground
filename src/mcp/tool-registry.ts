import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Db } from '../db/db.tokens';
import { registerListUsersTool } from '../features/users/list-users/list-users.tool';
import { registerGetUserTool } from '../features/users/get-user/get-user.tool';
import { registerCreateUserTool } from '../features/users/create-user/create-user.tool';
import { registerListPostsTool } from '../features/posts/list-posts/list-posts.tool';
import { registerCreatePostTool } from '../features/posts/create-post/create-post.tool';
import { registerMarkPostReadTool } from '../features/posts/mark-post-read/mark-post-read.tool';

export interface ToolDeps {
  db: Db;
}

export function registerAllTools(server: McpServer, deps: ToolDeps): void {
  registerListUsersTool(server, deps);
  registerGetUserTool(server, deps);
  registerCreateUserTool(server, deps);
  registerListPostsTool(server, deps);
  registerCreatePostTool(server, deps);
  registerMarkPostReadTool(server, deps);
}
