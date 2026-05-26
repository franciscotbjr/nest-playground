import { randomUUID } from 'node:crypto';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { DRIZZLE, type Db } from '../db/db.tokens';
import { InMemoryEventStore } from './event-store/in-memory.event-store';
import { registerAllTools } from './tool-registry';

@Injectable()
export class McpService implements OnModuleDestroy {
  private readonly transports: Record<string, StreamableHTTPServerTransport> =
    {};

  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  async handlePost(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    try {
      if (sessionId && this.transports[sessionId]) {
        await this.transports[sessionId].handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        const transport: StreamableHTTPServerTransport =
          new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            eventStore: new InMemoryEventStore(),
            onsessioninitialized: (id) => {
              this.transports[id] = transport;
            },
          });
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && this.transports[sid]) {
            delete this.transports[sid];
          }
        };

        const server = this.createMcpServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
      throw error;
    }
  }

  async handleGet(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await this.transports[sessionId].handleRequest(req, res);
  }

  async handleDelete(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await this.transports[sessionId].handleRequest(req, res);
  }

  private createMcpServer(): McpServer {
    const server = new McpServer(
      { name: 'nest-playground-mcp', version: '0.1.0' },
      { capabilities: { logging: {} } },
    );
    registerAllTools(server, { db: this.db });
    return server;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(Object.values(this.transports).map((t) => t.close()));
  }
}
