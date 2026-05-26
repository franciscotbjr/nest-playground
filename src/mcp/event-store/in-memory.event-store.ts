import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import type {
  EventId,
  EventStore,
  StreamId,
} from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export class InMemoryEventStore implements EventStore {
  private events = new Map<
    EventId,
    { streamId: StreamId; message: JSONRPCMessage }
  >();

  private generateEventId(streamId: StreamId): EventId {
    return `${streamId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private getStreamIdFromEventId(eventId: EventId): StreamId {
    const parts = eventId.split('_');
    return parts.length > 0 ? parts[0] : '';
  }

  storeEvent(streamId: StreamId, message: JSONRPCMessage): Promise<EventId> {
    const eventId = this.generateEventId(streamId);
    this.events.set(eventId, { streamId, message });
    return Promise.resolve(eventId);
  }

  async replayEventsAfter(
    lastEventId: EventId,
    {
      send,
    }: { send: (eventId: EventId, message: JSONRPCMessage) => Promise<void> },
  ): Promise<StreamId> {
    if (!lastEventId || !this.events.has(lastEventId)) {
      return '';
    }
    const streamId = this.getStreamIdFromEventId(lastEventId);
    if (!streamId) {
      return '';
    }
    let foundLastEvent = false;
    const sortedEvents = [...this.events.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [
      eventId,
      { streamId: eventStreamId, message },
    ] of sortedEvents) {
      if (eventStreamId !== streamId) continue;
      if (eventId === lastEventId) {
        foundLastEvent = true;
        continue;
      }
      if (foundLastEvent) {
        await send(eventId, message);
      }
    }
    return streamId;
  }
}
