/**
 * Servicio de IA para procesamiento de imágenes de manga o manhwa
 * Maneja toda la lógica relacionada con OpenAI
 */

import OpenAI from "openai";

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

export class AIService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = Bun.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY no está configurada");
    }
    
    this.openai = new OpenAI({ apiKey });
    this.model = "o4-mini";
  }

  /**
   * Procesa una imagen de manga o manhwa y extrae las traducciones de los globos de diálogo
   */
  async processImage(imageBuffer: ArrayBuffer, userEmail?: string): Promise<ProcessImageResult> {
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const prompt = this.buildPrompt();
    
    try {
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      // Log simple de tokens
      const usage = response.usage;
      if (usage) {
        console.log(`🤖 [${userEmail || 'Unknown'}] Tokens: ${usage.prompt_tokens} input + ${usage.completion_tokens} output = ${usage.total_tokens} total`);
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Respuesta vacía de OpenAI");
      }

      const parsed = this.parseResponse(content);
      const validTextElements = this.validateAndFilterTextElements(parsed.text_elements || []);
      const validBubbles = this.convertTextElementsToBubbles(validTextElements, parsed.language_detected || 'japanese');

      return {
        language_detected: parsed.language_detected || 'japanese',
        total_elements: parsed.total_elements || validTextElements.length,
        text_elements: validTextElements,
        bubbles: validBubbles
      };
      
    } catch (error) {
      console.error("Error procesando imagen con IA:", error);
      throw new Error("Error procesando imagen con IA");
    }
  }

  /**
   * Construye el prompt optimizado para extracción de texto de manga o manhwa
   */
  private buildPrompt(): string {
    return `
Eres KomiKAI, un asistente de IA especializado en la traducción de manga y manhwa.

Tu tarea:
1. Analizar cuidadosamente la imagen para identificar el idioma del texto (japonés o coreano).
2. Identificar y extraer TODO el texto visible en la imagen.
3. Proporcionar traducciones precisas al español latinoamericano e inglés estadounidense.

Ejemplos de textos a extraer:

- Burbujas de diálogo (normales, con bordes especiales, de colores).
- Burbujas de pensamiento.
- Cajas de narración y texto.
- Títulos y subtítulos.
- Texto fuera de viñetas.
- Efectos de sonido.
- Cualquier texto visible, incluso si está parcialmente cortado.

Orden de lectura:

- Leer las viñetas de derecha a izquierda, de arriba hacia abajo.
- Dentro de cada viñeta, leer el texto de derecha a izquierda, de arriba hacia abajo.
- Numerar los elementos en el orden correcto de lectura.

Requisitos de traducción:

- Preservar el texto original exactamente como aparece.
- Usar español latinoamericano: evitar "vosotros", usar "ustedes", expresiones latinoamericanas (Evita las expresiones de Venezuela, Bolivia y Perú).
- Usar inglés estadounidense: ortografía y expresiones americanas
- Traducciones naturales y contextualmente apropiadas

Formato de respuesta (solo JSON en inglés):

json{
  "language_detected": "japanese" | "korean",
  "total_elements": number,
  "text_elements": [
    {
      "id": number,
      "original": "texto original extraído",
      "english": "US English translation",
      "spanish": "traducción en español latinoamericano",
      "type": "dialogue" | "thought" | "narration" | "title" | "sound_effect" | "onomatopoeia" | "other",
      "location": "descripción de dónde se encuentra el texto (ej: 'burbuja superior derecha', 'título principal', 'texto cortado esquina inferior')",
      "notes": "notas adicionales si es necesario (opcional)"
    }
  ]
}

Instrucciones especiales que debes respetar:

- Si el texto está parcialmente cortado, extraer la parte visible e indicarlo en "location".
- Si una burbuja tiene diseño especial (color, forma), mencionarlo en "location".
- Si no estás seguro del idioma, hacer tu mejor estimación basándote en los caracteres.
- Si no se encuentra texto, devolver array vacío pero mantener la estructura JSON.
- Incluir TODOS los elementos de texto, sin importar su tamaño o ubicación.
- No incluir textos los textos de créditos de autor o editorial sin importar en que idioma estén, por ejemplo: "CC", "This comic strip is licensed under CC", "Illustrated by", "Art by", etc.
- No generas traducciones de traducciones cuando el texto son solo caracteres especiales o cualquier onomatopeya, por ejemplo: "?", "!", "!!", "¿?".
- Ignora los números de pagina.
- NO traduzcas cosas de otros idiomas que no sean Japonés o Coreano.
- La ubicacion y las notas que realices, deben ser en español.
    `;
  }

  /**
   * Parsea la respuesta JSON de OpenAI
   */
  private parseResponse(content: string): { language_detected?: 'japanese' | 'korean'; total_elements?: number; text_elements?: any[]; bubbles?: BubbleTranslation[] } {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Error parseando respuesta JSON:", error);
      console.error("Contenido recibido:", content);
      throw new Error("Formato de respuesta inválido");
    }
  }

  /**
   * Valida y filtra los elementos de texto para asegurar que tengan contenido válido
   */
  private validateAndFilterTextElements(textElements: any[]): TextElement[] {
    return textElements
      .filter((element): element is TextElement => {
        return (
          typeof element === 'object' &&
          element !== null &&
          typeof element.id === 'number' &&
          typeof element.original === 'string' &&
          typeof element.english === 'string' &&
          typeof element.spanish === 'string' &&
          typeof element.type === 'string' &&
          typeof element.location === 'string' &&
          element.original.trim().length > 0 &&
          element.english.trim().length > 0 &&
          element.spanish.trim().length > 0
        );
      })
      .map(element => ({
        id: element.id,
        original: element.original.trim(),
        english: element.english.trim(),
        spanish: element.spanish.trim(),
        type: element.type as 'dialogue' | 'thought' | 'narration' | 'title' | 'sound_effect' | 'onomatopoeia' | 'other',
        location: element.location.trim(),
        notes: element.notes ? element.notes.trim() : undefined
      }));
  }

  /**
   * Convierte elementos de texto a formato de burbujas para retrocompatibilidad
   */
  private convertTextElementsToBubbles(textElements: TextElement[], language: 'japanese' | 'korean'): BubbleTranslation[] {
    return textElements.map(element => ({
      original: element.original,
      english: element.english,
      spanish: element.spanish,
      language: language
    }));
  }

  /**
   * Valida y filtra las burbujas para asegurar que tengan contenido válido
   */
  private validateAndFilterBubbles(bubbles: any[]): BubbleTranslation[] {
    return bubbles
      .filter((bubble): bubble is BubbleTranslation => {
        return (
          typeof bubble === 'object' &&
          bubble !== null &&
          typeof bubble.original === 'string' &&
          typeof bubble.english === 'string' &&
          typeof bubble.spanish === 'string' &&
          typeof bubble.language === 'string' &&
          (bubble.language === 'japanese' || bubble.language === 'korean') &&
          bubble.original.trim().length > 0 &&
          bubble.english.trim().length > 0 &&
          bubble.spanish.trim().length > 0
        );
      })
      .map(bubble => ({
        original: bubble.original.trim(),
        english: bubble.english.trim(),
        spanish: bubble.spanish.trim(),
        language: bubble.language as 'japanese' | 'korean'
      }));
  }

  /**
   * Verifica si el servicio de IA está disponible
   */
  isAvailable(): boolean {
    return !!Bun.env.OPENAI_API_KEY;
  }

  /**
   * Obtiene información del modelo actual
   */
  getModelInfo(): { model: string; available: boolean } {
    return {
      model: this.model,
      available: this.isAvailable()
    };
  }
}

// Instancia singleton del servicio
export const aiService = new AIService();
