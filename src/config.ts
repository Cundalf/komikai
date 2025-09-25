import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const allowedUsersPath = join(root, "data", "allowed-users.json");

export function getAllowedUsers(): Set<string> {
  const content = readFileSync(allowedUsersPath, "utf8");
  const parsed = JSON.parse(content);
  
  // Si es un array (formato anterior), convertir a Set
  if (Array.isArray(parsed)) {
    return new Set(parsed.map((email) => email.toLowerCase()));
  }
  
  // Si es un objeto (formato nuevo), extraer las claves (emails)
  return new Set(Object.keys(parsed).map((email) => email.toLowerCase()));
}

export function getUserName(email: string): string | null {
  const content = readFileSync(allowedUsersPath, "utf8");
  const parsed = JSON.parse(content);
  
  // Si es un array (formato anterior), no hay nombres personalizados
  if (Array.isArray(parsed)) {
    return null;
  }
  
  // Si es un objeto (formato nuevo), buscar el nombre
  return parsed[email] || null;
}

