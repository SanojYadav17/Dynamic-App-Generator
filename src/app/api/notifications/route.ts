import { z } from 'zod';
import { emitNotification, listNotifications } from '@/lib/notifications';

const payloadSchema = z.object({
  type: z.string().min(1),
  level: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  message: z.string().min(1),
  actor: z.string().optional()
});

export async function GET() {
  return Response.json({ events: listNotifications() });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid notification payload.' }, { status: 400 });
  }

  const event = emitNotification(parsed.data);
  return Response.json({ event }, { status: 201 });
}