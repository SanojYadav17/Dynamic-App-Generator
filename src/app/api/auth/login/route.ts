import { z } from 'zod';
import { logIn } from '@/lib/auth-store';
import { emitNotification } from '@/lib/notifications';

const payloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid login payload.' }, { status: 400 });
  }

  const result = logIn(parsed.data.email, parsed.data.password);
  if (!('user' in result)) {
    return Response.json({ error: result.error }, { status: 401 });
  }

  emitNotification({
    type: 'auth.login.password',
    level: 'success',
    message: `${result.user.email} logged in with password`,
    actor: result.user.email
  });

  return Response.json({
    token: result.token,
    user: {
      id: result.user.id,
      email: result.user.email
    }
  });
}