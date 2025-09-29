/**
 * Página de dashboard principal
 */

import type { TemplateData } from '../../types';

export function renderDashboardPage(data: TemplateData = {}): string {
  const { user, error, success, rateLimitInfo } = data;

  const rateLimitWarning = rateLimitInfo && rateLimitInfo.remaining <= 2 ? `
    <div class="alert warning" role="alert">
      ⚠️ Te quedan ${rateLimitInfo.remaining} procesamiento${rateLimitInfo.remaining !== 1 ? 's' : ''} antes del límite.
      Límite se restablece: ${rateLimitInfo.resetTime.toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })}
    </div>
  ` : '';

  return `
    <section>
      <hgroup>
        <h1>🎌 Dashboard de Traducción</h1>
        <p>Procesa tus imágenes de manga y manhwa con IA</p>
      </hgroup>

      ${error ? `<div class="alert error" role="alert">${error}</div>` : ""}
      ${success ? `<div class="alert success" role="alert">${success}</div>` : ""}
      ${rateLimitWarning}

      <form
        action="/process"
        method="post"
        enctype="multipart/form-data"
        class="upload-form"
      >
        <fieldset>
          <legend>📷 Subir Imagen</legend>

          <label for="image">
            🖼️ Selecciona una imagen de manga o manhwa
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              required
              aria-describedby="image-help"
            />
            <small id="image-help">
              Formatos soportados: JPEG, PNG, WebP. Tamaño máximo: 10MB
            </small>
          </label>

          <button type="submit" class="process-btn">
            🚀 Procesar con IA
          </button>
        </fieldset>
      </form>

      <div class="info-grid">
        <article>
          <header>📊 Estado de la Sesión</header>
          <p>
            <strong>Usuario:</strong> ${user?.name || 'No disponible'}<br>
            <strong>Email:</strong> ${user?.email || 'No disponible'}<br>
            ${rateLimitInfo ? `
              <strong>Procesamiento restantes:</strong> ${rateLimitInfo.remaining}<br>
              <strong>Límite se restablece:</strong> ${rateLimitInfo.resetTime.toLocaleString('es-ES')}
            ` : ''}
          </p>
        </article>

        <article>
          <header>ℹ️ Cómo Funciona</header>
          <ol>
            <li><strong>Sube</strong> una imagen de manga o manhwa</li>
            <li><strong>Procesa</strong> con IA para detectar y extraer texto</li>
            <li><strong>Obtén</strong> traducciones en español e inglés</li>
            <li><strong>Copia</strong> las traducciones con un clic</li>
          </ol>
        </article>
      </div>

      <details>
        <summary>🔧 Información Técnica</summary>
        <div class="technical-info">
          <h4>Idiomas Soportados:</h4>
          <ul>
            <li><strong>🇯🇵 Japonés:</strong> Manga tradicional</li>
            <li><strong>🇰🇷 Coreano:</strong> Manhwa y webtoons</li>
          </ul>

          <h4>Traducciones:</h4>
          <ul>
            <li><strong>🇪🇸 Español:</strong> Español latinoamericano</li>
            <li><strong>🇺🇸 Inglés:</strong> Inglés estadounidense</li>
          </ul>

          <h4>Tipos de Texto Detectados:</h4>
          <ul>
            <li>💬 Diálogos</li>
            <li>💭 Pensamientos</li>
            <li>📖 Narración</li>
            <li>🎵 Efectos de sonido</li>
            <li>📝 Títulos y texto general</li>
          </ul>
        </div>
      </details>
    </section>
  `;
}