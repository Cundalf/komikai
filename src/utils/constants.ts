/**
 * Constantes de la aplicación
 */

export const APP_NAME = "KomiKAI";

export const MIME_TYPES = {
  HTML: "text/html",
  CSS: "text/css",
  JS: "application/javascript",
  JSON: "application/json",
  PNG: "image/png",
  JPEG: "image/jpeg",
  WEBP: "image/webp"
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  FOUND: 302,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const PATHS = {
  LOGIN: "/",
  VERIFY: "/verify",
  DASHBOARD: "/dashboard",
  PROCESS: "/process",
  RESULT: "/result",
  STATIC: "/static"
} as const;