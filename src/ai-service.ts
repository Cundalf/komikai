/**
 * Servicio de IA para procesamiento de imágenes de manga o manhwa
 * Maneja toda la lógica relacionada con OpenAI
 */

import OpenAI from "openai";

export interface BubbleTranslation {
  original: string;
  english: string;
  spanish: string;
  language: 'japanese' | 'korean';
}

export interface ProcessImageResult {
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
    this.model = Bun.env.OPENAI_MODEL ?? "gpt-4o-mini";
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
      const validBubbles = this.validateAndFilterBubbles(parsed.bubbles || []);
      
      return {
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
    return `You are KomiKAI, a specialized AI assistant for manga and manhwa translation.

Your task:
1. Analyze the image carefully to determine if it's a manga (Japanese) or manhwa (Korean)
2. Identify ALL speech bubbles and text boxes containing text
3. Extract the original text exactly as written
4. Provide accurate translations to Latin American Spanish and US English

Requirements:
- Extract text in proper reading order:
  * Manga (Japanese): top to bottom, right to left
  * Manhwa (Korean): top to bottom, left to right
- Include ALL text found in speech bubbles, thought bubbles, and text boxes
- Preserve the original text exactly as it appears (Japanese hiragana/katakana/kanji or Korean hangul)
- Provide natural, contextually appropriate translations
- Use Latin American Spanish (not Spain Spanish) - avoid "vosotros", use "ustedes", use Latin American expressions
- Use US English (not British English) - use American spelling and expressions
- If no text is found, return an empty array

Response format (JSON only):
{
  "bubbles": [
    {
      "original": "extracted original text (Japanese or Korean)",
      "english": "US English translation",
      "spanish": "Latin American Spanish translation",
      "language": "japanese" or "korean"
    }
  ]
}`;
  }

  /**
   * Parsea la respuesta JSON de OpenAI
   */
  private parseResponse(content: string): { bubbles?: BubbleTranslation[] } {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Error parseando respuesta JSON:", error);
      console.error("Contenido recibido:", content);
      throw new Error("Formato de respuesta inválido");
    }
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
