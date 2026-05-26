import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { InMemoryEventStore } from './in-memory.event-store';

const msg = (id: number): JSONRPCMessage => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/list',
  params: {},
});

describe('InMemoryEventStore', () => {
  it('storeEvent returns an id prefixed with the streamId', async () => {
    const store = new InMemoryEventStore();
    const eventId = await store.storeEvent('streamA', msg(1));
    expect(eventId.startsWith('streamA_')).toBe(true);
  });

  it('replayEventsAfter delivers only events after the cursor on the same stream', async () => {
    // Mock Date.now so each storeEvent gets a strictly increasing timestamp.
    // Otherwise events within the same ms get random-suffix ordering that breaks replay.
    let tick = 1_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => tick++);

    const store = new InMemoryEventStore();
    const a1 = await store.storeEvent('A', msg(1));
    await store.storeEvent('A', msg(2));
    await store.storeEvent('A', msg(3));
    await store.storeEvent('B', msg(99));

    const sent: Array<{ id: string; message: JSONRPCMessage }> = [];
    const streamId = await store.replayEventsAfter(a1, {
      send: (id, message) => {
        sent.push({ id, message });
        return Promise.resolve();
      },
    });

    expect(streamId).toBe('A');
    expect(sent).toHaveLength(2);
    expect(sent.every((s) => s.id.startsWith('A_'))).toBe(true);
    nowSpy.mockRestore();
  });

  it('replayEventsAfter returns empty stream id when lastEventId is unknown', async () => {
    const store = new InMemoryEventStore();
    const result = await store.replayEventsAfter('does-not-exist', {
      send: () => Promise.resolve(),
    });
    expect(result).toBe('');
  });

  it('replayEventsAfter returns empty stream id when lastEventId is empty string', async () => {
    const store = new InMemoryEventStore();
    const result = await store.replayEventsAfter('', {
      send: () => Promise.resolve(),
    });
    expect(result).toBe('');
  });
});
