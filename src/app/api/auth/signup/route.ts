import { z } from 'zod';
import { signUp } from '@/lib/auth-store';
import { emitNotification } from '@/lib/notifications';

const payloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid signup payload.' }, { status: 400 });
  }

  const result = signUp(parsed.data.email, parsed.data.password);
  if (!('user' in result)) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  emitNotification({
    type: 'auth.signup',
    level: 'success',
    message: `${result.user.email} signed up`,
    actor: result.user.email
  });

  return Response.json({
    user: {
      id: result.user.id,
      email: result.user.email
    }
  });
}