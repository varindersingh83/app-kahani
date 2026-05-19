export type StructuredBookEventInput = {
  bookId: string;
  pageId?: string;
  agent: string;
  eventType: string;
  payloadJson?: Record<string, unknown>;
  createdAt?: Date;
};

export function buildStructuredBookEvent(input: StructuredBookEventInput) {
  return {
    bookId: input.bookId,
    pageId: input.pageId,
    agent: input.agent,
    eventType: input.eventType,
    payloadJson: input.payloadJson ?? {},
    createdAt: input.createdAt ?? new Date(),
  };
}

export function toMonitoringEvent(event: ReturnType<typeof buildStructuredBookEvent>) {
  return {
    timestamp: event.createdAt.toISOString(),
    book_id: event.bookId,
    page_id: event.pageId,
    agent: event.agent,
    event: event.eventType,
    ...event.payloadJson,
  };
}
