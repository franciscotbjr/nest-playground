import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerAllTools } from './tool-registry';
import { createMockDb, type MockDb } from '../test-utils/mock-db';

const UUID = {
  u1: '11111111-1111-4111-8111-111111111111',
  u2: '22222222-2222-4222-8222-222222222222',
  p1: '33333333-3333-4333-8333-333333333333',
  p2: '44444444-4444-4444-8444-444444444444',
  r1: '55555555-5555-4555-8555-555555555555',
  missing: '66666666-6666-4666-8666-666666666666',
} as const;

interface ToolHarness {
  client: Client;
  server: McpServer;
}

// Builds a Client + Server pair and primes the client's output-validator cache.
// Priming matters: the MCP client caches an Ajv validator per tool after `listTools`
// and enforces it on every `callTool` whose result includes `structuredContent`
// (regardless of `isError`). Tests must mirror that real-world flow or they will
// silently miss schema-violation regressions.
async function buildHarness(db: MockDb): Promise<ToolHarness> {
  const server = new McpServer({ name: 'test-mcp', version: '0.0.0' });
  registerAllTools(server, { db });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  await client.listTools();
  return { client, server };
}

async function teardown(h: ToolHarness): Promise<void> {
  await h.client.close();
  await h.server.close();
}

describe('tool-registry (integration via InMemoryTransport)', () => {
  it('exposes all 6 tools to clients', async () => {
    const harness = await buildHarness(createMockDb([]));
    try {
      const list = await harness.client.listTools();
      const names = list.tools.map((t) => t.name).sort();
      expect(names).toEqual([
        'posts.create',
        'posts.list',
        'posts.markRead',
        'users.create',
        'users.get',
        'users.list',
      ]);
    } finally {
      await teardown(harness);
    }
  });

  describe('users.list', () => {
    it('returns rows via structuredContent', async () => {
      const rows = [{ id: UUID.u1, name: 'A', age: 1, email: 'a@b.com' }];
      const harness = await buildHarness(createMockDb(rows));
      try {
        const res = await harness.client.callTool({
          name: 'users.list',
          arguments: { limit: 10, offset: 0 },
        });
        expect(res.isError).toBeFalsy();
        expect(res.structuredContent).toEqual({ users: rows });
      } finally {
        await teardown(harness);
      }
    });

    it('returns isError with cause message when db throws', async () => {
      const cause = new Error('relation "users" does not exist');
      const err = new Error('Failed query: select ... limit $1');
      (err as Error & { cause?: unknown }).cause = cause;
      const harness = await buildHarness(createMockDb(err));
      try {
        const res = await harness.client.callTool({
          name: 'users.list',
          arguments: { limit: 10, offset: 0 },
        });
        expect(res.isError).toBe(true);
        const text = (res.content as Array<{ text: string }>)[0].text;
        expect(text).toContain('relation "users" does not exist');
        expect(res.structuredContent).toBeUndefined();
      } finally {
        await teardown(harness);
      }
    });
  });

  describe('users.get', () => {
    it('returns the user when found', async () => {
      const user = {
        id: UUID.u2,
        name: 'B',
        age: 22,
        email: 'b@x.com',
        emailUnverified: false,
      };
      const harness = await buildHarness(createMockDb([user]));
      try {
        const res = await harness.client.callTool({
          name: 'users.get',
          arguments: { id: user.id },
        });
        expect(res.isError).toBeFalsy();
        expect(res.structuredContent).toEqual({ user });
      } finally {
        await teardown(harness);
      }
    });

    it('returns isError true when not found, with no structuredContent', async () => {
      const harness = await buildHarness(createMockDb([]));
      try {
        const res = await harness.client.callTool({
          name: 'users.get',
          arguments: { id: UUID.missing },
        });
        expect(res.isError).toBe(true);
        expect(res.structuredContent).toBeUndefined();
        const text = (res.content as Array<{ text: string }>)[0].text;
        expect(text).toContain('not found');
      } finally {
        await teardown(harness);
      }
    });
  });

  describe('users.create', () => {
    it('returns the created user', async () => {
      const inserted = {
        id: UUID.u1,
        name: 'C',
        age: 30,
        email: 'c@x.com',
        emailUnverified: false,
      };
      const harness = await buildHarness(createMockDb([inserted]));
      try {
        const res = await harness.client.callTool({
          name: 'users.create',
          arguments: { name: 'C', age: 30, email: 'c@x.com' },
        });
        expect(res.isError).toBeFalsy();
        expect(res.structuredContent).toEqual({ user: inserted });
      } finally {
        await teardown(harness);
      }
    });

    it('returns a friendly message for unique-violation errors', async () => {
      const harness = await buildHarness(
        createMockDb(
          new Error('duplicate key value violates unique constraint'),
        ),
      );
      try {
        const res = await harness.client.callTool({
          name: 'users.create',
          arguments: { name: 'D', age: 20, email: 'dup@x.com' },
        });
        expect(res.isError).toBe(true);
        expect(res.structuredContent).toBeUndefined();
        const text = (res.content as Array<{ text: string }>)[0].text;
        expect(text).toContain('Email already in use');
      } finally {
        await teardown(harness);
      }
    });

    it('returns a generic message for unknown errors', async () => {
      const harness = await buildHarness(
        createMockDb(new Error('connection lost')),
      );
      try {
        const res = await harness.client.callTool({
          name: 'users.create',
          arguments: { name: 'D', age: 20, email: 'd@x.com' },
        });
        expect(res.isError).toBe(true);
        expect(res.structuredContent).toBeUndefined();
        const text = (res.content as Array<{ text: string }>)[0].text;
        expect(text).toContain('Failed to create user');
      } finally {
        await teardown(harness);
      }
    });
  });

  describe('posts.list', () => {
    it('returns posts', async () => {
      const rows = [{ id: UUID.p1, createdBy: UUID.u1 }];
      const harness = await buildHarness(createMockDb(rows));
      try {
        const res = await harness.client.callTool({
          name: 'posts.list',
          arguments: { limit: 10, offset: 0 },
        });
        expect(res.isError).toBeFalsy();
        expect(res.structuredContent).toEqual({ posts: rows });
      } finally {
        await teardown(harness);
      }
    });

    it('returns isError on db failure with no structuredContent', async () => {
      const harness = await buildHarness(createMockDb(new Error('boom')));
      try {
        const res = await harness.client.callTool({
          name: 'posts.list',
          arguments: { limit: 10, offset: 0 },
        });
        expect(res.isError).toBe(true);
        expect(res.structuredContent).toBeUndefined();
      } finally {
        await teardown(harness);
      }
    });
  });

  describe('posts.create', () => {
    it('returns the created post', async () => {
      const post = { id: UUID.p1, createdBy: UUID.u1 };
      const harness = await buildHarness(createMockDb([post]));
      try {
        const res = await harness.client.callTool({
          name: 'posts.create',
          arguments: { createdBy: post.createdBy },
        });
        expect(res.isError).toBeFalsy();
        expect(res.structuredContent).toEqual({ post });
      } finally {
        await teardown(harness);
      }
    });

    it('returns a friendly message for FK violations', async () => {
      const harness = await buildHarness(
        createMockDb(new Error('violates foreign key constraint')),
      );
      try {
        const res = await harness.client.callTool({
          name: 'posts.create',
          arguments: { createdBy: UUID.missing },
        });
        expect(res.isError).toBe(true);
        expect(res.structuredContent).toBeUndefined();
        const text = (res.content as Array<{ text: string }>)[0].text;
        expect(text).toContain('does not exist');
      } finally {
        await teardown(harness);
      }
    });

    it('returns a generic message for unknown errors', async () => {
      const harness = await buildHarness(createMockDb(new Error('boom')));
      try {
        const res = await harness.client.callTool({
          name: 'posts.create',
          arguments: { createdBy: UUID.u1 },
        });
        expect(res.isError).toBe(true);
        expect(res.structuredContent).toBeUndefined();
        const text = (res.content as Array<{ text: string }>)[0].text;
        expect(text).toContain('Failed to create post');
      } finally {
        await teardown(harness);
      }
    });
  });

  describe('posts.markRead', () => {
    it('returns the read row', async () => {
      const read = { id: UUID.r1, userId: UUID.u1, postId: UUID.p1 };
      const harness = await buildHarness(createMockDb([read]));
      try {
        const res = await harness.client.callTool({
          name: 'posts.markRead',
          arguments: { userId: read.userId, postId: read.postId },
        });
        expect(res.isError).toBeFalsy();
        expect(res.structuredContent).toEqual({ read });
      } finally {
        await teardown(harness);
      }
    });

    it('returns a friendly message for FK violations', async () => {
      const harness = await buildHarness(
        createMockDb(new Error('violates foreign key constraint')),
      );
      try {
        const res = await harness.client.callTool({
          name: 'posts.markRead',
          arguments: { userId: UUID.u1, postId: UUID.missing },
        });
        expect(res.isError).toBe(true);
        expect(res.structuredContent).toBeUndefined();
        const text = (res.content as Array<{ text: string }>)[0].text;
        expect(text).toContain('does not exist');
      } finally {
        await teardown(harness);
      }
    });

    it('returns a generic message for unknown errors', async () => {
      const harness = await buildHarness(createMockDb(new Error('boom')));
      try {
        const res = await harness.client.callTool({
          name: 'posts.markRead',
          arguments: { userId: UUID.u1, postId: UUID.p1 },
        });
        expect(res.isError).toBe(true);
        expect(res.structuredContent).toBeUndefined();
        const text = (res.content as Array<{ text: string }>)[0].text;
        expect(text).toContain('Failed to mark post as read');
      } finally {
        await teardown(harness);
      }
    });
  });
});
