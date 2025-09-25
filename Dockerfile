# Multi-stage build para optimizar tamaño final
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json bun.lock* ./

# Instalar dependencias
RUN bun install --frozen-lockfile --production

# Copiar código fuente
COPY . .

# Build de assets
RUN bun run build

# Imagen final
FROM oven/bun:1-alpine AS runtime

WORKDIR /app

# Crear usuario no-root para seguridad (o usar el existente)
RUN addgroup -g 1001 -S nodejs 2>/dev/null || true && \
    adduser -S komikai -u 1001 2>/dev/null || adduser -S komikai

# Copiar dependencias desde builder
COPY --from=builder --chown=komikai:nodejs /app/node_modules ./node_modules

# Copiar código fuente y assets compilados
COPY --from=builder --chown=komikai:nodejs /app/src ./src
COPY --from=builder --chown=komikai:nodejs /app/public ./public
COPY --from=builder --chown=komikai:nodejs /app/data ./data
COPY --from=builder --chown=komikai:nodejs /app/package.json ./
COPY --from=builder --chown=komikai:nodejs /app/tsconfig.json ./

# Cambiar a usuario no-root
USER komikai

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

# Comando de inicio
CMD ["bun", "run", "start"]
