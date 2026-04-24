import { getStoredToken } from './token-storage';

type TokenPayload = {
  sub: string;
  email: string;
  username: string;
};

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;
    return JSON.parse(atob(payloadB64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getCurrentUser(): TokenPayload | null {
  const token = getStoredToken();
  if (!token) return null;

  const decoded = decodePayload(token);
  if (!decoded) return null;

  if (typeof decoded.exp === 'number' && decoded.exp * 1000 < Date.now()) {
    return null;
  }

  return {
    sub: String(decoded.sub ?? ''),
    email: String(decoded.email ?? ''),
    username: String(decoded.username ?? ''),
  };
}

