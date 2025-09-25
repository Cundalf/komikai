type PendingCode = { code: string; expiresAt: number };

const pendingCodes = new Map<string, PendingCode>();

export function setPendingCode(email: string, code: string, ttlMinutes = 10) {
  const expiresAt = Date.now() + ttlMinutes * 60_000;
  pendingCodes.set(email, { code, expiresAt });
}

export function consumePendingCode(email: string, code: string) {
  const entry = pendingCodes.get(email);
  if (!entry) return false;
  if (entry.code !== code) return false;
  if (entry.expiresAt < Date.now()) {
    pendingCodes.delete(email);
    return false;
  }
  pendingCodes.delete(email);
  return true;
}

export function clearExpiredCodes() {
  const now = Date.now();
  for (const [email, entry] of pendingCodes) {
    if (entry.expiresAt < now) {
      pendingCodes.delete(email);
    }
  }
}

setInterval(clearExpiredCodes, 60_000).unref?.();

