/**
 * Componente para mostrar resultados de procesamiento
 */

import type { ProcessImageResult, BubbleTranslation } from '../../types';

const TYPE_EMOJIS = {
  dialogue: '💬',
  thought: '💭',
  narration: '📖',
  title: '🏷️',
  sound_effect: '🎵',
  onomatopoeia: '💥',
  other: '📝'
} as const;

const LANGUAGE_EMOJIS = {
  japanese: '🇯🇵',
  korean: '🇰🇷'
} as const;

function renderCopyButton(text: string, title: string = 'Copiar al portapapeles'): string {
  return `<button
    type="button"
    class="copy-btn"
    data-text="${text.replace(/"/g, '&quot;')}"
    title="${title}"
    aria-label="${title}"
  >📋</button>`;
}

export function renderTextElements(result: ProcessImageResult): string {
  if (!result.text_elements || result.text_elements.length === 0) {
    return '<p>No se encontraron elementos de texto en la imagen.</p>';
  }

  const elementsHtml = result.text_elements
    .map((element, index) => {
      const typeEmoji = TYPE_EMOJIS[element.type] || TYPE_EMOJIS.other;

      return `
        <article class="text-element">
          <header>
            <h4>${typeEmoji} Elemento ${element.id}</h4>
            <small>${element.location}</small>
            ${element.notes ? `<small class="notes">📝 ${element.notes}</small>` : ''}
          </header>

          <div class="translations">
            <div class="original">
              <label>
                <strong>${LANGUAGE_EMOJIS[result.language_detected]} Original:</strong>
                ${renderCopyButton(element.original)}
              </label>
              <div class="text-content original-text">${element.original}</div>
            </div>

            <div class="translation">
              <label>
                <strong>🇪🇸 Español:</strong>
                ${renderCopyButton(element.spanish)}
              </label>
              <div class="text-content spanish-text">${element.spanish}</div>
            </div>

            <div class="translation">
              <label>
                <strong>🇺🇸 English:</strong>
                ${renderCopyButton(element.english)}
              </label>
              <div class="text-content english-text">${element.english}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <details open>
      <summary>📝 Elementos de Texto Detectados (${result.text_elements.length})</summary>
      <div class="text-elements-grid">
        ${elementsHtml}
      </div>
    </details>
  `;
}

export function renderBubbleTranslations(bubbles: BubbleTranslation[]): string {
  if (!bubbles || bubbles.length === 0) {
    return '';
  }

  const bubblesHtml = bubbles
    .map((bubble, index) => `
      <tr>
        <td class="text-cell original-text">
          ${bubble.original}
          ${renderCopyButton(bubble.original, 'Copiar texto original')}
        </td>
        <td class="text-cell spanish-text">
          ${bubble.spanish}
          ${renderCopyButton(bubble.spanish, 'Copiar traducción al español')}
        </td>
        <td class="text-cell english-text">
          ${bubble.english}
          ${renderCopyButton(bubble.english, 'Copiar traducción al inglés')}
        </td>
      </tr>
    `)
    .join('');

  return `
    <details>
      <summary>🗣️ Resumen de Traducciones (${bubbles.length})</summary>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>🇯🇵🇰🇷 Original</th>
              <th>🇪🇸 Español</th>
              <th>🇺🇸 English</th>
            </tr>
          </thead>
          <tbody>
            ${bubblesHtml}
          </tbody>
        </table>
      </div>
    </details>
  `;
}

export function renderProcessingResult(result: ProcessImageResult, bubbles?: BubbleTranslation[]): string {
  const languageFlag = LANGUAGE_EMOJIS[result.language_detected];

  return `
    <section class="result-section">
      <header>
        <h2>✅ Procesamiento Completado</h2>
        <p>
          <strong>Idioma detectado:</strong> ${languageFlag} ${result.language_detected === 'japanese' ? 'Japonés' : 'Coreano'} |
          <strong>Total de elementos:</strong> ${result.total_elements}
        </p>
      </header>

      <div class="result-actions">
        <a href="/dashboard" role="button" class="secondary">
          🔄 Procesar otra imagen
        </a>
        <button
          type="button"
          onclick="window.print()"
          class="secondary"
        >
          🖨️ Imprimir resultados
        </button>
      </div>

      ${renderTextElements(result)}
      ${renderBubbleTranslations(bubbles || result.bubbles)}
    </section>
  `;
}