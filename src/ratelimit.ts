interface RateLimitEntry {
  count: number;
  resetAt: number;
  lastAttempt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs?: number;
}

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
  blocked: boolean;
}

// Configuración por tipo de endpoint
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 60_000, // 1 minuto
    maxAttempts: 5,
    blockDurationMs: 300_000, // 5 minutos de bloqueo
  },
  process: {
    windowMs: 300_000, // 5 minutos
    maxAttempts: 10,
  },
  default: {
    windowMs: 60_000,
    maxAttempts: 20,
  },
};

const buckets = new Map<string, RateLimitEntry>();

function getConfig(key: string): RateLimitConfig {
  if (key.startsWith('login:')) return rateLimitConfigs.login!;
  if (key.startsWith('process:')) return rateLimitConfigs.process!;
  return rateLimitConfigs.default!;
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt < now) {
      buckets.delete(key);
    }
  }
}

// Limpiar entradas expiradas cada 5 minutos
setInterval(cleanupExpiredEntries, 300_000).unref?.();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const config = getConfig(key);
  const entry = buckets.get(key);

  // Si no hay entrada, crear una nueva
  if (!entry) {
    buckets.set(key, { 
      count: 1, 
      resetAt: now + config.windowMs,
      lastAttempt: now 
    });
    return true;
  }

  // Si la ventana ha expirado, resetear
  if (entry.resetAt < now) {
    entry.count = 1;
    entry.resetAt = now + config.windowMs;
    entry.lastAttempt = now;
    return true;
  }

  // Si está bloqueado por demasiados intentos
  if (entry.count >= config.maxAttempts) {
    const blockDuration = config.blockDurationMs ?? config.windowMs;
    if (now - entry.lastAttempt < blockDuration) {
      return false;
    }
    // El bloqueo ha expirado, resetear
    entry.count = 1;
    entry.resetAt = now + config.windowMs;
    entry.lastAttempt = now;
    return true;
  }

  // Incrementar contador
  entry.count += 1;
  entry.lastAttempt = now;
  return true;
}

export function getRateLimitInfo(key: string): RateLimitInfo {
  const now = Date.now();
  const config = getConfig(key);
  const entry = buckets.get(key);

  if (!entry) {
    return { 
      remaining: config.maxAttempts, 
      resetAt: now + config.windowMs,
      blocked: false 
    };
  }

  const blocked = entry.count >= config.maxAttempts && 
                  (now - entry.lastAttempt) < (config.blockDurationMs ?? config.windowMs);

  return { 
    remaining: Math.max(0, config.maxAttempts - entry.count), 
    resetAt: entry.resetAt,
    blocked 
  };
}

export function getRateLimitStatus(): { totalEntries: number; memoryUsage: string } {
  cleanupExpiredEntries();
  const memoryUsage = process.memoryUsage();
  return {
    totalEntries: buckets.size,
    memoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
  };
}

