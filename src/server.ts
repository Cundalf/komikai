/**
 * Servidor principal refactorizado con server-side rendering
 * Arquitectura segura que no expone lógica al cliente
 */

import { serve } from "bun";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { getAllowedUsers, getUserName } from "./config";
import { sendLoginCodeEmail } from "./mailer";
import { checkRateLimit, getRateLimitInfo } from "./ratelimit";
import { setPendingCode, consumePendingCode } from "./auth-store";
import { aiService } from "./ai-service";
import { renderLayout, renderLogin, renderVerifyCode, renderDashboard } from "./templates";
import type { TemplateData } from "./templates";

const appName = "KomiKAI";
const allowedUsers = getAllowedUsers();
const tokenSecret = Bun.env.SESSION_SECRET ?? "dev-secret";

// Store temporal para resultados de procesamiento
interface ProcessingResult {
  bubbles: Array<{
    original: string;
    english: string;
    spanish: string;
    language: 'japanese' | 'korean';
  }>;
  email: string;
  timestamp: number;
}

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
}, 5 * 60 * 1000); // Ejecutar cada 5 minutos

// Tipos para las sesiones
interface SessionPayload {
  email: string;
  name: string;
  iat: number;
  exp: number;
  iss: string;
}

// Utilidades de sesión
function createSession(email: string, name?: string): string {
  const now = Math.floor(Date.now() / 1000);
  const customName = getUserName(email);
  const sessionName = name ?? customName ?? email.split('@')[0];
  const payload: SessionPayload = {
    email,
    name: sessionName,
    iat: now,
    exp: now + (7 * 24 * 60 * 60), // 7 días
    iss: "komikai"
  };
  
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  
  const dataToSign = `${encodedHeader}.${encodedPayload}.${tokenSecret}`;
  const signature = Bun.hash(dataToSign);
  const encodedSignature = Buffer.from(signature.toString(), 'utf8').toString("base64url");
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

function validateSession(token: string | null): SessionPayload | null {
  if (!token) return null;
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // Verificar firma
    const dataToVerify = `${encodedHeader}.${encodedPayload}.${tokenSecret}`;
    const expectedSignature = Bun.hash(dataToVerify);
    const providedSignature = encodedSignature;
    const expectedSignatureString = Buffer.from(expectedSignature.toString()).toString("base64url");
    
    if (providedSignature !== expectedSignatureString) return null;
    
    // Decodificar payload
    const payload = JSON.parse(Buffer.from(encodedPayload!, "base64url").toString("utf8"));
    
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.log("Token expirado");
      return null;
    }
    
    if (typeof payload.email !== "string") return null;
    
    console.log(`Token válido para: ${payload.email}, expira en: ${new Date(payload.exp * 1000).toLocaleString()}`);
    return payload as SessionPayload;
  } catch (error) {
    console.log("Error validando token:", error);
    return null;
  }
}

function generateCode(): string {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
}

function generateResultId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function storeProcessingResult(id: string, result: ProcessingResult): void {
  processingResults.set(id, result);
}

function getProcessingResult(id: string, email: string): ProcessingResult | null {
  const result = processingResults.get(id);
  if (!result || result.email !== email) {
    return null;
  }
  
  // Eliminar después de usar (one-time use)
  processingResults.delete(id);
  return result;
}

// Utilidades de respuesta
function redirect(location: string, status: number = 302): Response {
  return new Response(null, {
    status,
    headers: { Location: location }
  });
}

function html(content: string, status: number = 200): Response {
  return new Response(content, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function json(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

// Servir archivos estáticos
const publicDir = join(process.cwd(), "public");

async function serveStatic(pathname: string): Promise<Response> {
  const filePath = join(publicDir, pathname);
  try {
    const content = await readFile(filePath);
    return new Response(content as BodyInit, {
      headers: {
        "Content-Type": getMimeType(extname(filePath)),
        "Cache-Control": "public, max-age=31536000"
      }
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

function getMimeType(ext: string): string {
  const mapping: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
  };
  return mapping[ext.toLowerCase()] ?? "application/octet-stream";
}

// Middleware de autenticación
function getSessionFromRequest(request: Request): SessionPayload | null {
  // Intentar obtener token de cookie primero
  const cookies = request.headers.get("cookie");
  let token: string | null = null;
  
  if (cookies) {
    const sessionCookie = cookies
      .split(';')
      .find(c => c.trim().startsWith('komikai_session='));
    
    if (sessionCookie) {
      token = sessionCookie.split('=')[1] ?? null;
    }
  }
  
  // Fallback a Authorization header (para compatibilidad)
  if (!token) {
    token = request.headers.get("authorization") ?? request.headers.get("Authorization");
  }
  
  return validateSession(token);
}

function setSessionCookie(token: string): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 días
  
  return `komikai_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}`;
}

function clearSessionCookie(): string {
  return `komikai_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// Handlers principales
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  console.log(`${method} ${pathname}`);

  try {
    // Archivos estáticos
    if (pathname.startsWith("/client.js") || pathname.startsWith("/styles.css")) {
      return await serveStatic(pathname);
    }

    // Rutas de autenticación
    if (pathname === "/login" && method === "GET") {
      return handleLoginPage(request);
    }
    
    if (pathname === "/login/request" && method === "POST") {
      return await handleRequestCode(request);
    }
    
    if (pathname === "/login/verify" && method === "POST") {
      return await handleVerifyCode(request);
    }
    
    if (pathname === "/logout" && method === "POST") {
      return handleLogout();
    }

    // Rutas protegidas
    if (pathname === "/" && method === "GET") {
      return handleDashboard(request);
    }
    
    if (pathname === "/process" && method === "POST") {
      return await handleProcessImage(request);
    }

    // API de estado (para monitoreo)
    if (pathname === "/api/status" && method === "GET") {
      return handleStatus();
    }

    return new Response("Not Found", { status: 404 });
    
  } catch (error) {
    console.error("Error en request handler:", error);
    return html(renderLayout(`
      <section class="panel">
        <h2>❌ Error interno</h2>
        <p>Ocurrió un error inesperado. Por favor intenta nuevamente.</p>
        <a href="/">🏠 Volver al inicio</a>
      </section>
    `, { title: "Error - KomiKAI" }), 500);
  }
}

function handleLoginPage(request: Request): Response {
  const session = getSessionFromRequest(request);
  
  // Si ya está autenticado, redirigir al dashboard
  if (session) {
    return redirect("/");
  }
  
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const success = url.searchParams.get("success");
  const email = url.searchParams.get("email");
  
  // Si hay un email, mostrar formulario de verificación
  if (email) {
    return html(renderVerifyCode(email, { error, success }));
  }
  
  return html(renderLogin({ error, success }));
}

async function handleRequestCode(request: Request): Promise<Response> {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").toLowerCase();

  if (!email || !email.includes("@")) {
    return redirect("/login?error=" + encodeURIComponent("Email inválido"));
  }

  if (!allowedUsers.has(email)) {
    return redirect("/login?error=" + encodeURIComponent("Usuario no habilitado"));
  }

  const rateKey = `login:${email}`;
  if (!checkRateLimit(rateKey)) {
    const { resetAt } = getRateLimitInfo(rateKey);
    return redirect("/login?error=" + encodeURIComponent(`Demasiados intentos. Intenta en ${Math.ceil((resetAt - Date.now()) / 60000)} minutos`));
  }

  const code = generateCode();
  setPendingCode(email, code);

  try {
    await sendLoginCodeEmail(email, code);
    return redirect(`/login?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error("Error enviando email:", error);
    return redirect("/login?error=" + encodeURIComponent("Error enviando código"));
  }
}

async function handleVerifyCode(request: Request): Promise<Response> {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").toLowerCase();
  const code = String(formData.get("code") ?? "");

  if (!email || !code) {
    return redirect(`/login?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Datos incompletos")}`);
  }

  const valid = consumePendingCode(email, code);
  if (!valid) {
    return redirect(`/login?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Código inválido o expirado")}`);
  }

  const token = createSession(email);
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": setSessionCookie(token)
    }
  });
}

function handleLogout(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
      "Set-Cookie": clearSessionCookie()
    }
  });
}

function handleDashboard(request: Request): Response {
  const session = getSessionFromRequest(request);
  
  if (!session) {
    return redirect("/login");
  }
  
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const success = url.searchParams.get("success");
  const resultId = url.searchParams.get("result");
  
  let bubbles: Array<{original: string; english: string; spanish: string; language: 'japanese' | 'korean'}> | undefined;
  let resultSuccess: string | undefined;
  
  // Si hay un resultId, intentar obtener los resultados
  if (resultId) {
    const result = getProcessingResult(resultId, session.email);
    if (result) {
      bubbles = result.bubbles;
      resultSuccess = `¡Listo! Encontramos ${result.bubbles.length} globos de diálogo`;
    }
  }
  
  const templateData: TemplateData = {
    user: {
      email: session.email,
      name: session.name,
      expiresIn: session.exp - Math.floor(Date.now() / 1000)
    },
    error: error ?? undefined,
    success: success ?? resultSuccess ?? undefined,
    bubbles: bubbles
  };
  
  return html(renderDashboard(templateData));
}

async function handleProcessImage(request: Request): Promise<Response> {
  const session = getSessionFromRequest(request);
  
  if (!session) {
    return redirect("/login");
  }

  // Rate limiting para procesamiento
  const rateKey = `process:${session.email}`;
  if (!checkRateLimit(rateKey)) {
    const { resetAt } = getRateLimitInfo(rateKey);
    const minutesLeft = Math.ceil((resetAt - Date.now()) / 60000);
    return redirect(`/?error=${encodeURIComponent(`Demasiadas solicitudes. Espera ${minutesLeft} minutos`)}`);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return redirect("/?error=" + encodeURIComponent("Formato inválido"));
  }

  const formData = await request.formData();
  const file = formData.get("image");
  
  if (!(file instanceof File)) {
    return redirect("/?error=" + encodeURIComponent("Imagen requerida"));
  }

  // Validaciones
  if (file.size > 10 * 1024 * 1024) {
    return redirect("/?error=" + encodeURIComponent("Imagen demasiado grande (máximo 10MB)"));
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return redirect("/?error=" + encodeURIComponent("Tipo de archivo no soportado"));
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await aiService.processImage(arrayBuffer, session.email);
    
    console.log(`✅ Procesado para ${session.email}: ${result.bubbles.length} globos encontrados`);
    
    if (result.bubbles.length === 0) {
      return redirect("/?success=" + encodeURIComponent("No se encontraron globos de diálogo en la imagen"));
    }
    
    // Guardar resultados en sesión temporal (en memoria)
    const resultId = generateResultId();
    storeProcessingResult(resultId, {
      bubbles: result.bubbles,
      email: session.email,
      timestamp: Date.now()
    });
    
    // Redirect para evitar reenvío con F5
    return redirect(`/?result=${resultId}`);
    
  } catch (error) {
    console.error("Error procesando imagen:", error);
    return redirect("/?error=" + encodeURIComponent("Error procesando imagen"));
  }
}

async function handleStatus(): Promise<Response> {
  const { getRateLimitStatus } = await import("./ratelimit");
  const { clearExpiredCodes } = await import("./auth-store");
  
  clearExpiredCodes();
  const rateLimitStatus = getRateLimitStatus();
  
  return json({
    app: appName,
    version: "2.0.0",
    uptime: process.uptime(),
    memory: rateLimitStatus.memoryUsage,
    rateLimit: {
      activeEntries: rateLimitStatus.totalEntries,
    },
    features: {
      openai: aiService.isAvailable(),
      smtp: !!(Bun.env.SMTP_HOST && Bun.env.SMTP_USER),
    },
    timestamp: new Date().toISOString(),
  });
}

// Iniciar servidor
const port = Number(Bun.env.PORT ?? 3000);

serve({
  fetch: handleRequest,
  port,
});

console.log(`🚀 ${appName} v2.0 server iniciado`);
console.log(`📍 URL: http://localhost:${port}`);
console.log(`🔧 Entorno: ${Bun.env.NODE_ENV ?? 'development'}`);
console.log(`🤖 OpenAI: ${aiService.isAvailable() ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`📧 SMTP: ${Bun.env.SMTP_HOST ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`👥 Usuarios permitidos: ${allowedUsers.size}`);
console.log(`⏰ Iniciado: ${new Date().toLocaleString('es-ES')}`);
console.log('─'.repeat(50));