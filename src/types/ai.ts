/**
 * Tipos relacionados con el servicio de IA
 */

export interface TextElement {
  id: number;
  original: string;
  english: string;
  spanish: string;
  type: 'dialogue' | 'thought' | 'narration' | 'title' | 'sound_effect' | 'onomatopoeia' | 'other';
  location: string;
  notes?: string;
}

export interface BubbleTranslation {
  original: string;
  english: string;
  spanish: string;
  language: 'japanese' | 'korean';
}

export interface ProcessImageResult {
  language_detected: 'japanese' | 'korean';
  total_elements: number;
  text_elements: TextElement[];
  bubbles: BubbleTranslation[];
}

// Tipos específicos para parsing - eliminando 'any'
export interface RawTextElement {
  id: number;
  original: string;
  english: string;
  spanish: string;
  type: string;
  location: string;
  notes?: string;
}

export interface RawBubble {
  original: string;
  english: string;
  spanish: string;
  language: string;
}

export interface RawParseResponse {
  language_detected?: string;
  total_elements?: number;
  text_elements?: RawTextElement[];
  bubbles?: RawBubble[];
}