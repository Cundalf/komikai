/**
 * Middleware de autenticación
 */

import type { SessionData } from '../types';

const tokenSecret = Bun.env.SESSION_SECRET ?? "dev-secret";

export function createAuthToken(email: string, name: string): string {
  const payload: SessionData = {
    email,
    name,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
  };

  return btoa(JSON.stringify(payload));
}

export function verifyAuthToken(token: string): SessionData | null {
  try {
    const decoded = JSON.parse(atob(token)) as SessionData;

    if (Date.now() > decoded.exp) {
      return null; // Token expirado
    }

    return decoded;
  } catch (error) {
    return null; // Token inválido
  }
}

export function extractTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value !== undefined) {
      acc[name] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  return cookies.auth || null;
}

export function getSessionFromRequest(request: Request): SessionData | null {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  return verifyAuthToken(token);
}