/**
 * Servidor principal refactorizado con arquitectura modular
 * Usa la nueva estructura de directorios y responsabilidades únicas
 */

import { serve } from "bun";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

// Removiendo imports temporalmente para debug
// import { aiService } from "./services/ai-service";
// import { authService } from "./services/auth.service";
// import { fileService } from "./services/file.service";
// import {
//   createAuthToken,
//   verifyAuthToken,
//   getSessionFromRequest
// } from "./middleware/auth.middleware";
// import { checkUserRateLimit } from "./middleware/ratelimit.middleware";
// import { getRateLimitInfo } from "./ratelimit";

// Importar templates modularizados
import {
  renderLogin,
  renderVerifyCode,
  renderDashboard,
  renderResult
} from "./templates";

// Importar tipos y constantes
import type { ProcessingResult, TemplateData } from "./types";
import { HTTP_STATUS, MIME_TYPES, PATHS } from "./utils/constants";
import {
  isValidEmail,
  isValidVerificationCode,
  sanitizeString
} from "./utils/validation";

// Store temporal para resultados de procesamiento
const processingResults = new Map<string, ProcessingResult>();

// Limpiar resultados antiguos cada 10 minutos
setInterval(() => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  for (const [id, result] of processingResults.entries()) {
    if (now - result.timestamp > tenMinutes) {
      processingResults.delete(id);
    }
  }
}, 10 * 60 * 1000);

// Generar ID único para resultados
function generateResultId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Servir archivos estáticos
async function serveStaticFile(pathname: string): Promise<Response | null> {
  const filePath = join(process.cwd(), "public", pathname.slice(1));

  try {
    const file = await readFile(filePath);
    const ext = extname(pathname);

    const mimeTypes: Record<string, string> = {
      '.html': MIME_TYPES.HTML,
      '.css': MIME_TYPES.CSS,
      '.js': MIME_TYPES.JS,
      '.json': MIME_TYPES.JSON,
      '.png': MIME_TYPES.PNG,
      '.jpg': MIME_TYPES.JPEG,
      '.jpeg': MIME_TYPES.JPEG,
      '.webp': MIME_TYPES.WEBP,
    };

    return new Response(file as BodyInit, {
      status: HTTP_STATUS.OK,
      headers: { "Content-Type": mimeTypes[ext] || "application/octet-stream" },
    });
  } catch {
    return null;
  }
}

// Manejador principal del servidor
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;
  const method = request.method;

  // Servir archivos estáticos
  if (pathname.startsWith("/static/") ||
      pathname.endsWith(".css") ||
      pathname.endsWith(".js") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".ico")) {
    const staticResponse = await serveStaticFile(pathname);
    if (staticResponse) return staticResponse;
  }

  // Cerrar sesión
  if (pathname === PATHS.LOGIN && searchParams.has('logout')) {
    return new Response(null, {
      status: HTTP_STATUS.FOUND,
      headers: {
        "Location": PATHS.LOGIN,
        "Set-Cookie": "auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
      }
    });
  }

  // Obtener sesión del usuario
  const session = getSessionFromRequest(request);

  // Rutas que requieren autenticación
  if ([PATHS.DASHBOARD, PATHS.PROCESS, PATHS.RESULT].includes(pathname as any) && !session) {
    return new Response(null, {
      status: HTTP_STATUS.FOUND,
      headers: { "Location": PATHS.LOGIN }
    });
  }

  // Manejo de rutas
  switch (pathname) {
    case PATHS.LOGIN:
      return handleLogin(request, session);

    case PATHS.VERIFY:
      return handleVerify(request, session);

    case PATHS.DASHBOARD:
      return handleDashboard(request, session!);

    case PATHS.PROCESS:
      return handleProcess(request, session!);

    case PATHS.RESULT:
      return handleResult(request, session!);

    default:
      return new Response("Not Found", {
        status: HTTP_STATUS.NOT_FOUND
      });
  }
}

// Manejador de la página de login
async function handleLogin(request: Request, session: any): Promise<Response> {
  // Si ya está autenticado, redirigir al dashboard
  if (session) {
    return new Response(null, {
      status: HTTP_STATUS.FOUND,
      headers: { "Location": PATHS.DASHBOARD }
    });
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const email = sanitizeString(formData.get('email')?.toString() || '');

    if (!isValidEmail(email)) {
      return new Response(renderLogin({
        error: 'Por favor ingresa un email válido'
      }), {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: { "Content-Type": MIME_TYPES.HTML }
      });
    }

    try {
      await authService.sendVerificationCode(email);

      return new Response(null, {
        status: HTTP_STATUS.FOUND,
        headers: {
          "Location": `/verify?email=${encodeURIComponent(email)}`,
          "Set-Cookie": `verify_email=${email}; Path=/; HttpOnly; SameSite=Strict; Max-Age=600`
        }
      });
    } catch (error) {
      return new Response(renderLogin({
        error: error instanceof Error ? error.message : 'Error enviando código'
      }), {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: { "Content-Type": MIME_TYPES.HTML }
      });
    }
  }

  return new Response(renderLogin(), {
    status: HTTP_STATUS.OK,
    headers: { "Content-Type": MIME_TYPES.HTML }
  });
}

// Manejador de verificación de código
async function handleVerify(request: Request, session: any): Promise<Response> {
  if (session) {
    return new Response(null, {
      status: HTTP_STATUS.FOUND,
      headers: { "Location": PATHS.DASHBOARD }
    });
  }

  // Obtener email de la cookie o query param
  const url = new URL(request.url);
  const cookieHeader = request.headers.get('cookie');
  const emailFromCookie = cookieHeader?.split(';')
    .find(c => c.trim().startsWith('verify_email='))
    ?.split('=')[1];
  const email = emailFromCookie || url.searchParams.get('email') || '';

  if (!email || !authService.isEmailAllowed(email)) {
    return new Response(null, {
      status: HTTP_STATUS.FOUND,
      headers: { "Location": PATHS.LOGIN }
    });
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const code = sanitizeString(formData.get('code')?.toString() || '');

    if (!isValidVerificationCode(code)) {
      return new Response(renderVerifyCode({
        error: 'El código debe ser de 6 dígitos'
      }), {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: { "Content-Type": MIME_TYPES.HTML }
      });
    }

    if (authService.verifyCode(email, code)) {
      const token = createAuthToken(email, authService.getUserDisplayName(email));

      return new Response(null, {
        status: HTTP_STATUS.FOUND,
        headers: {
          "Location": PATHS.DASHBOARD,
          "Set-Cookie": `auth=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}`
        }
      });
    } else {
      return new Response(renderVerifyCode({
        error: 'Código incorrecto o expirado'
      }), {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: { "Content-Type": MIME_TYPES.HTML }
      });
    }
  }

  return new Response(renderVerifyCode({}), {
    status: HTTP_STATUS.OK,
    headers: { "Content-Type": MIME_TYPES.HTML }
  });
}

// Manejador del dashboard
async function handleDashboard(request: Request, session: any): Promise<Response> {
  const rateLimitInfo = getRateLimitInfo(session.email);

  return new Response(renderDashboard({
    user: {
      email: session.email,
      name: session.name
    },
    rateLimitInfo: {
      remaining: rateLimitInfo.remaining,
      resetTime: new Date(rateLimitInfo.resetAt)
    }
  }), {
    status: HTTP_STATUS.OK,
    headers: { "Content-Type": MIME_TYPES.HTML }
  });
}

// Manejador de procesamiento de archivos
async function handleProcess(request: Request, session: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(null, {
      status: HTTP_STATUS.METHOD_NOT_ALLOWED,
      headers: { "Allow": "POST" }
    });
  }

  // Verificar rate limit
  const rateLimitResult = await checkUserRateLimit(session.email);
  if (!rateLimitResult.allowed) {
    return new Response(renderDashboard({
      user: { email: session.email, name: session.name },
      error: `Has alcanzado el límite de procesamiento. Reinicia en: ${rateLimitResult.resetTime?.toLocaleString('es-ES')}`,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining || 0,
        resetTime: rateLimitResult.resetTime || new Date()
      }
    }), {
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      headers: { "Content-Type": MIME_TYPES.HTML }
    });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    // Validar archivo
    const validation = fileService.validateUploadedFile(imageFile);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Archivo no válido');
    }

    // Procesar con IA
    const imageBuffer = await fileService.convertToArrayBuffer(imageFile);
    const result = await aiService.processImage(imageBuffer, session.email);

    // Almacenar resultado
    const resultId = generateResultId();
    processingResults.set(resultId, {
      result,
      bubbles: result.bubbles,
      email: session.email,
      timestamp: Date.now()
    });

    // Redirigir a resultados
    return new Response(null, {
      status: HTTP_STATUS.FOUND,
      headers: { "Location": `${PATHS.RESULT}?id=${resultId}` }
    });

  } catch (error) {
    const rateLimitInfo = getRateLimitInfo(session.email);

    return new Response(renderDashboard({
      user: { email: session.email, name: session.name },
      error: error instanceof Error ? error.message : 'Error procesando imagen',
      rateLimitInfo: {
        remaining: rateLimitInfo.remaining,
        resetTime: new Date(rateLimitInfo.resetAt)
      }
    }), {
      status: HTTP_STATUS.BAD_REQUEST,
      headers: { "Content-Type": MIME_TYPES.HTML }
    });
  }
}

// Manejador de resultados
async function handleResult(request: Request, session: any): Promise<Response> {
  const url = new URL(request.url);
  const resultId = url.searchParams.get('id');

  if (!resultId) {
    return new Response(null, {
      status: HTTP_STATUS.FOUND,
      headers: { "Location": PATHS.DASHBOARD }
    });
  }

  const storedResult = processingResults.get(resultId);
  if (!storedResult || storedResult.email !== session.email) {
    return new Response(renderDashboard({
      user: { email: session.email, name: session.name },
      error: 'Resultado no encontrado o expirado'
    }), {
      status: HTTP_STATUS.NOT_FOUND,
      headers: { "Content-Type": MIME_TYPES.HTML }
    });
  }

  return new Response(renderResult({
    user: { email: session.email, name: session.name },
    result: storedResult.result,
    bubbles: storedResult.bubbles
  }), {
    status: HTTP_STATUS.OK,
    headers: { "Content-Type": MIME_TYPES.HTML }
  });
}

// Iniciar servidor debug
const server = serve({
  port: 3006,
  fetch(request) {
    const url = new URL(request.url);
    console.log(`${request.method} - ${url.pathname}`);

    if (url.pathname === "/") {
      return new Response(renderLogin(), {
        headers: { "Content-Type": "text/html" }
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 KomiKAI servidor iniciado en puerto ${server.port}`);
console.log(`📱 Accede en: http://localhost:${server.port}`);

export default server;