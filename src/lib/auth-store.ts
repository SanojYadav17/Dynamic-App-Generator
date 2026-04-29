import crypto from 'node:crypto';

type User = {
  id: string;
  email: string;
  passwordHash: string;
};

type SignUpResult = { user: User } | { error: string };
type LoginResult = { user: User; token: string } | { error: string };
type OtpResult = { code: string; expiresAt: string } | { error: string };

type OtpEntry = {
  code: string;
  expiresAt: number;
};

type AuthStoreState = {
  users: Map<string, User>;
  otpCodes: Map<string, OtpEntry>;
  seeded: boolean;
};

declare global {
  var __dynamicAppAuthStore: AuthStoreState | undefined;
}

const store =
  globalThis.__dynamicAppAuthStore ??
  (globalThis.__dynamicAppAuthStore = {
    users: new Map<string, User>(),
    otpCodes: new Map<string, OtpEntry>(),
    seeded: false
  });

if (!store.seeded) {
  const demoPassword = hashPassword('demo1234');
  store.users.set('demo@company.com', {
    id: 'demo-user',
    email: 'demo@company.com',
    passwordHash: demoPassword
  });
  store.seeded = true;
}

const users = store.users;
const otpCodes = store.otpCodes;

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function signUp(email: string, password: string): SignUpResult {
  const normalizedEmail = email.toLowerCase().trim();
  if (users.has(normalizedEmail)) {
    return { error: 'User already exists.' };
  }

  const user: User = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: hashPassword(password)
  };

  users.set(normalizedEmail, user);
  return { user };
}

export function logIn(email: string, password: string): LoginResult {
  const normalizedEmail = email.toLowerCase().trim();
  const user = users.get(normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return { error: 'Invalid credentials.' };
  }

  return {
    user,
    token: `demo-token-${user.id}`
  };
}

export function requestOtp(email: string): OtpResult {
  const normalizedEmail = email.toLowerCase().trim();
  const user = users.get(normalizedEmail);

  if (!user) {
    return { error: 'User not found.' };
  }

  const code = '123456';
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpCodes.set(normalizedEmail, { code, expiresAt });

  return {
    code,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

export function logInWithOtp(email: string, otp: string): LoginResult {
  const normalizedEmail = email.toLowerCase().trim();
  const user = users.get(normalizedEmail);
  const entry = otpCodes.get(normalizedEmail);

  if (!user || !entry) {
    return { error: 'OTP not requested.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpCodes.delete(normalizedEmail);
    return { error: 'OTP expired.' };
  }

  if (entry.code !== otp.trim()) {
    return { error: 'Invalid OTP.' };
  }

  otpCodes.delete(normalizedEmail);

  return {
    user,
    token: `demo-token-otp-${user.id}`
  };
}