/**
 * Tipos relacionados con la interfaz de usuario
 */

import type { ProcessImageResult } from './ai';
import type { User } from './auth';

export interface TemplateData {
  title?: string;
  user?: User;
  error?: string | null;
  success?: string | null;
  result?: ProcessImageResult;
  bubbles?: ProcessImageResult['bubbles'];
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
  };
}

export interface ProcessingResult {
  result?: ProcessImageResult;
  bubbles: ProcessImageResult['bubbles'];
  email: string;
  timestamp: number;
}