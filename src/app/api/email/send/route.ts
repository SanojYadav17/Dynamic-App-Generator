import crypto from 'node:crypto';
import { z } from 'zod';
import { emitNotification } from '@/lib/notifications';

const payloadSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid email payload.' }, { status: 400 });
  }

  const messageId = `mock-email-${crypto.randomUUID()}`;

  emitNotification({
    type: 'email.transactional.sent',
    level: 'info',
    message: `Mock email queued for ${parsed.data.to}`,
    actor: parsed.data.to
  });

  return Response.json({
    success: true,
    provider: 'mock',
    messageId
  });
}