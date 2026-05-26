import type { Request, Response } from 'express';

interface FakeTransport {
  sessionId?: string;
  onclose?: () => void;
  handleRequest: jest.Mock;
  close: jest.Mock;
  __opts?: {
    sessionIdGenerator?: () => string;
    onsessioninitialized?: (id: string) => void | Promise<void>;
  };
}

const transportInstances: FakeTransport[] = [];

jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: jest
    .fn()
    .mockImplementation((opts: FakeTransport['__opts']) => {
      const instance: FakeTransport = {
        sessionId: undefined,
        handleRequest: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        __opts: opts,
      };
      transportInstances.push(instance);
      return instance;
    }),
}));

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    registerTool: jest.fn(),
    registerResource: jest.fn(),
    registerPrompt: jest.fn(),
  })),
}));

jest.mock('../mcp/tool-registry', () => ({ registerAllTools: jest.fn() }), {
  virtual: true,
});

import { McpService } from './mcp.service';

function buildReqRes(opts: { sessionId?: string; body?: unknown } = {}) {
  const req = {
    headers: opts.sessionId ? { 'mcp-session-id': opts.sessionId } : {},
    body: opts.body,
  } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    headersSent: false,
  } as unknown as Response;
  return { req, res };
}

describe('McpService', () => {
  let service: McpService;
  const fakeDb = {} as never;

  beforeEach(() => {
    transportInstances.length = 0;
    service = new McpService(fakeDb);
  });

  describe('handlePost', () => {
    it('returns 400 JSON-RPC error when no session-id and body is not initialize', async () => {
      const { req, res } = buildReqRes({
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });
      await service.handlePost(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jsonrpc: '2.0',
          error: expect.objectContaining({ code: -32000 }),
        }),
      );
    });

    it('delegates to existing transport when session-id matches', async () => {
      const existing: FakeTransport = {
        handleRequest: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        sessionId: 'sess-A',
      };
      (
        service as unknown as { transports: Record<string, FakeTransport> }
      ).transports['sess-A'] = existing;

      const { req, res } = buildReqRes({
        sessionId: 'sess-A',
        body: { foo: 'bar' },
      });
      await service.handlePost(req, res);

      expect(existing.handleRequest).toHaveBeenCalledWith(req, res, {
        foo: 'bar',
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('creates a new transport and stores it on initialize', async () => {
      const initializeBody = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'c', version: '0' },
        },
      };
      const { req, res } = buildReqRes({ body: initializeBody });

      await service.handlePost(req, res);

      expect(transportInstances).toHaveLength(1);
      const created = transportInstances[0];
      expect(created.__opts?.sessionIdGenerator).toBeDefined();
      expect(created.__opts?.onsessioninitialized).toBeDefined();
      expect(created.handleRequest).toHaveBeenCalledWith(
        req,
        res,
        initializeBody,
      );

      // simulate the SDK calling the session-initialized callback
      await created.__opts!.onsessioninitialized!('newly-created-id');
      const map = (
        service as unknown as { transports: Record<string, FakeTransport> }
      ).transports;
      expect(map['newly-created-id']).toBe(created);

      // simulate close cleanup
      created.sessionId = 'newly-created-id';
      created.onclose?.();
      expect(map['newly-created-id']).toBeUndefined();
    });

    it('returns 500 when an unexpected error escapes before headers are sent', async () => {
      const broken: FakeTransport = {
        handleRequest: jest.fn().mockRejectedValue(new Error('boom')),
        close: jest.fn(),
        sessionId: 'sess-B',
      };
      (
        service as unknown as { transports: Record<string, FakeTransport> }
      ).transports['sess-B'] = broken;

      const { req, res } = buildReqRes({ sessionId: 'sess-B', body: {} });
      await expect(service.handlePost(req, res)).rejects.toThrow('boom');
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('handleGet', () => {
    it('returns 400 when session-id is missing', async () => {
      const { req, res } = buildReqRes({});
      await service.handleGet(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalled();
    });

    it('delegates to the matching transport', async () => {
      const t: FakeTransport = {
        handleRequest: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        sessionId: 'sess-G',
      };
      (
        service as unknown as { transports: Record<string, FakeTransport> }
      ).transports['sess-G'] = t;

      const { req, res } = buildReqRes({ sessionId: 'sess-G' });
      await service.handleGet(req, res);
      expect(t.handleRequest).toHaveBeenCalledWith(req, res);
    });
  });

  describe('handleDelete', () => {
    it('returns 400 when session-id is missing', async () => {
      const { req, res } = buildReqRes({});
      await service.handleDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('delegates to the matching transport', async () => {
      const t: FakeTransport = {
        handleRequest: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        sessionId: 'sess-D',
      };
      (
        service as unknown as { transports: Record<string, FakeTransport> }
      ).transports['sess-D'] = t;

      const { req, res } = buildReqRes({ sessionId: 'sess-D' });
      await service.handleDelete(req, res);
      expect(t.handleRequest).toHaveBeenCalledWith(req, res);
    });
  });

  describe('onModuleDestroy', () => {
    it('closes all active transports', async () => {
      const t1: FakeTransport = {
        handleRequest: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      };
      const t2: FakeTransport = {
        handleRequest: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
      };
      const map = (
        service as unknown as { transports: Record<string, FakeTransport> }
      ).transports;
      map['s1'] = t1;
      map['s2'] = t2;

      await service.onModuleDestroy();
      expect(t1.close).toHaveBeenCalled();
      expect(t2.close).toHaveBeenCalled();
    });
  });
});
