import { z } from 'zod';
import { logInWithOtp } from '@/lib/auth-store';
import { emitNotification } from '@/lib/notifications';

const payloadSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid OTP login payload.' }, { status: 400 });
  }

  const result = logInWithOtp(parsed.data.email, parsed.data.otp);
  if (!('user' in result)) {
    return Response.json({ error: result.error }, { status: 401 });
  }

  emitNotification({
    type: 'auth.login.otp',
    level: 'success',
    message: `${result.user.email} logged in via OTP`,
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