/**
 * Utilidades de validación
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>'"]/g, '');
}

export function isValidVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function validateImageProcessingResult(result: unknown): boolean {
  if (!result || typeof result !== 'object') return false;

  const r = result as any;
  return (
    typeof r.language_detected === 'string' &&
    typeof r.total_elements === 'number' &&
    Array.isArray(r.text_elements) &&
    Array.isArray(r.bubbles)
  );
}