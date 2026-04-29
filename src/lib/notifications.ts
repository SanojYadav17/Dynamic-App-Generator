import crypto from 'node:crypto';

export type NotificationEvent = {
  id: string;
  type: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  actor?: string;
  createdAt: string;
};

const events: NotificationEvent[] = [];

export function emitNotification(input: Omit<NotificationEvent, 'id' | 'createdAt'>) {
  const event: NotificationEvent = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input
  };

  events.unshift(event);
  if (events.length > 100) {
    events.length = 100;
  }

  return event;
}

export function listNotifications() {
  return events;
}