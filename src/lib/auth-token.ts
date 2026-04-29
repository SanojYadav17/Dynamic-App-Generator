import crypto from 'node:crypto';

type AuthTokenPayload = {
  userId: string;
  email: string;
  exp: number;
};

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

function getTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET ?? 'dev-auth-secret-change-me';
}

function encodePayload(payload: AuthTokenPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload(value: string) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as AuthTokenPayload;
  } catch {
    return null;
  }
}

function sign(value: string) {
  return crypto.createHmac('sha256', getTokenSecret()).update(value).digest('base64url');
}

export function createAuthToken(input: { userId: string; email: string }) {
  const payload: AuthTokenPayload = {
    userId: input.userId,
    email: input.email,
    exp: Math.floor(Date.now() / 1000) + ONE_DAY_IN_SECONDS
  };
  const encoded = encodePayload(payload);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyAuthToken(token: string) {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) {
    return null;
  }

  if (!payload.userId || !payload.email || typeof payload.exp !== 'number') {
    return null;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function readBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length).trim();
}
