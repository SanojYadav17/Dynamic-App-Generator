import { z } from 'zod';
import { requestOtp } from '@/lib/auth-store';
import { emitNotification } from '@/lib/notifications';

const payloadSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid OTP request payload.' }, { status: 400 });
  }

  const result = requestOtp(parsed.data.email);
  if (!('code' in result)) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  emitNotification({
    type: 'auth.otp.requested',
    level: 'info',
    message: `OTP requested for ${parsed.data.email}`,
    actor: parsed.data.email
  });

  return Response.json({
    message: 'OTP generated.',
    otp: result.code,
    expiresAt: result.expiresAt
  });
}