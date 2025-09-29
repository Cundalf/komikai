/**
 * Tipos relacionados con autenticación
 */

export interface User {
  email: string;
  name: string;
  expiresIn?: number;
}

export interface AuthToken {
  email: string;
  exp: number;
}

export interface SessionData extends AuthToken {
  name: string;
}