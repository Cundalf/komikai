/**
 * Sistema de templates del lado del servidor
 * Maneja todo el renderizado HTML de forma segura
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

// Cache para la versión de la aplicación
let appVersion: string | null = null;

function getAppVersion(): string {
  if (!appVersion) {
    try {
      const packagePath = join(process.cwd(), "package.json");
      const packageContent = readFileSync(packagePath, "utf8");
      const packageData = JSON.parse(packageContent);
      appVersion = packageData.version || "unknown";
    } catch (error) {
      console.error("Error leyendo versión del package.json:", error);
      appVersion = "unknown";
    }
  }
  return appVersion ?? "unknown";
}

export interface TemplateData {
  title?: string;
  user?: {
    email: string;
    name: string;
    expiresIn?: number;
  };
  error?: string | null;
  success?: string | null;
  result?: {
    language_detected: 'japanese' | 'korean';
    total_elements: number;
    text_elements: Array<{
      id: number;
      original: string;
      english: string;
      spanish: string;
      type: 'dialogue' | 'thought' | 'narration' | 'title' | 'sound_effect' | 'onomatopoeia' | 'other';
      location: string;
      notes?: string;
    }>;
    bubbles: Array<{
      original: string;
      english: string;
      spanish: string;
      language: 'japanese' | 'korean';
    }>;
  };
  bubbles?: Array<{
    original: string;
    english: string;
    spanish: string;
    language: 'japanese' | 'korean';
  }>;
}

export function renderLayout(content: string, data: TemplateData = {}): string {
  const { title = "KomiKAI", user } = data;
  
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@picocss/pico@2.1.1/css/pico.min.css"
    />
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/styles.css?v=${Date.now()}" />
  </head>
  <body>
    <header class="hero${user ? ' logged-in' : ''}">
      <nav class="container-fluid">
        <ul>
          <li><strong>📚 KomiKAI</strong></li>
        </ul>
        <ul>
          <li class="tag-optional"><span class="tag">✨ Manhwa 📖 Manga ✨</span></li>
          ${user ? `
          <li class="tag-optional"><span class="tag">⏰ ${formatSessionTime(user.expiresIn)}</span></li>
          <li>
            <form method="POST" action="/logout" style="display: inline;">
              <button type="submit" class="logout-btn">Salir</button>
            </form>
          </li>
          ` : ''}
        </ul>
      </nav>
      ${user ? `
      <section class="container hero-content">
        <h1>¡Hola, ${user.name}! 👋</h1>
      </section>
      ` : `
      <section class="container hero-content">
        <h1>Traduce tus globos de diálogo al instante</h1>
        <p>🔐 Traducciones impulsadas por IA 🤖</p>
      </section>
      `}
    </header>

    <main class="container">
      ${content}
    </main>

    <footer class="app-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-left">
            <span>Creado por <a href="https://cundalf.com.ar" target="_blank" rel="noopener">Cundalf</a> para su Shunita hermosa ❤️</span>
          </div>
          <div class="footer-right">
            <span class="version">v${getAppVersion()}</span>
          </div>
        </div>
      </div>
    </footer>

    <script src="/client.js"></script>
  </body>
</html>`;
}

export function renderLogin(data: TemplateData = {}): string {
  const { error, success } = data;
  
  const content = `
    <section class="panel">
      <h2>🔑 Inicia sesión</h2>
      <p>📧 Ingresa tu correo habilitado y recibe un código mágico de 6 dígitos.</p>
      
      ${error ? `<div class="status error">❌ ${error}</div>` : ''}
      ${success ? `<div class="status success">✅ ${success}</div>` : ''}
      
      <form method="POST" action="/login/request">
        <label for="email">📨 Correo electrónico</label>
        <input type="email" id="email" name="email" required placeholder="demo@komikai.app" />
        <button type="submit">🚀 Enviar código</button>
      </form>
    </section>
  `;
  
  return renderLayout(content, data);
}

export function renderVerifyCode(email: string, data: TemplateData = {}): string {
  const { error } = data;
  
  const content = `
    <section class="panel">
      <h2>🔢 Verifica tu código</h2>
      <p>📧 Enviamos un código de 6 dígitos a <strong>${email}</strong></p>
      
      ${error ? `<div class="status error">❌ ${error}</div>` : ''}
      
      <form method="POST" action="/login/verify">
        <input type="hidden" name="email" value="${email}" />
        <label for="code">🔢 Código de 6 dígitos</label>
        <input type="text" id="code" name="code" maxlength="6" minlength="6" pattern="\\d{6}" required placeholder="123456" />
        <button type="submit">✅ Validar</button>
      </form>
      
      <p><a href="/login">⬅️ Volver al login</a></p>
    </section>
  `;
  
  return renderLayout(content, data);
}

export function renderDashboard(data: TemplateData): string {
  const { user, error, success, result, bubbles } = data;

  if (!user) {
    throw new Error("Usuario requerido para el dashboard");
  }

  const content = `
    <section class="panel">
      <h2>📖 Sube tu página de manga o manhwa</h2>
      <p>🤖 Analizamos automáticamente cada globo, detectamos el idioma (japonés/coreano) y te damos traducciones al inglés estadounidense y español latino.</p>

      ${error ? `<div class="status error">❌ ${error}</div>` : ''}
      ${success ? `<div class="status success">✅ ${success}</div>` : ''}

      <form id="uploadForm" method="POST" action="/process" enctype="multipart/form-data">
        <label class="file-label" for="imageInput">
          <span>📁 Selecciona una imagen (PNG/JPG/SVG)</span>
          <input id="imageInput" name="image" type="file" accept="image/*" required />
        </label>
        <button type="submit">🔍 Analizar manga</button>
      </form>
    </section>

    ${result ? renderDetailedResults(result) : bubbles && bubbles.length > 0 ? renderResults(bubbles) : ''}
  `;

  return renderLayout(content, { ...data, title: `KomiKAI - ${user.name}` });
}

function renderDetailedResults(result: { language_detected: 'japanese' | 'korean'; total_elements: number; text_elements: Array<{ id: number; original: string; english: string; spanish: string; type: string; location: string; notes?: string }> }): string {
  const languageFlag = result.language_detected === 'japanese' ? '🇯🇵' : '🇰🇷';
  const languageName = result.language_detected === 'japanese' ? 'Japonés' : 'Coreano';
  const contentType = result.language_detected === 'japanese' ? 'Manga' : 'Manhwa';

  return `
    <section class="results-grid">
      <div class="results-header">
        <h3>✅ ¡Análisis completo!</h3>
        <div class="analysis-info">
          <span class="info-item">${languageFlag} Idioma: ${languageName}</span>
          <span class="info-item">📊 Total elementos: ${result.total_elements}</span>
          <span class="info-item">📖 Tipo: ${contentType}</span>
        </div>
      </div>

      ${result.text_elements.map((element, index) => {
        const typeEmoji = getTypeEmoji(element.type);
        const typeLabel = getTypeLabel(element.type);

        return `
        <article class="element-card">
          <div class="element-header">
            <h4>${typeEmoji} ${typeLabel} #${element.id}</h4>
            <span class="location-tag">📍 ${escapeHtml(element.location)}</span>
          </div>

          <div class="translation-grid">
            <div class="translation-item">
              <strong>${languageFlag} ${languageName}</strong>
              <p>${escapeHtml(element.original)}</p>
              <button type="button" class="copy-btn" data-text="${escapeHtml(element.original)}">📋</button>
            </div>
            <div class="translation-item">
              <strong>🇺🇸 Inglés</strong>
              <p>${escapeHtml(element.english)}</p>
              <button type="button" class="copy-btn" data-text="${escapeHtml(element.english)}">📋</button>
            </div>
            <div class="translation-item">
              <strong>🇪🇸 Español</strong>
              <p>${escapeHtml(element.spanish)}</p>
              <button type="button" class="copy-btn" data-text="${escapeHtml(element.spanish)}">📋</button>
            </div>
          </div>

          ${element.notes ? `<div class="element-notes">💡 ${escapeHtml(element.notes)}</div>` : ''}
        </article>
        `;
      }).join('')}
    </section>
  `;
}

function renderResults(bubbles: Array<{ original: string; english: string; spanish: string; language: 'japanese' | 'korean' }>): string {
  return `
    <section class="results-grid">
      <h3>✅ ¡Listo! Encontramos ${bubbles.length} globos 🗨️</h3>
      ${bubbles.map(bubble => {
        const originalLabel = bubble.language === 'japanese' ? '🇯🇵 Japonés' : '🇰🇷 Coreano';
        return `
        <article class="bubble-card">
          <h4>💬 Traducción (${bubble.language === 'japanese' ? 'Manga' : 'Manhwa'})</h4>
          <div class="translation-grid">
            <div class="translation-item">
              <strong>${originalLabel}</strong>
              <p>${escapeHtml(bubble.original)}</p>
              <button type="button" class="copy-btn" data-text="${escapeHtml(bubble.original)}">📋</button>
            </div>
            <div class="translation-item">
              <strong>🇺🇸 Inglés</strong>
              <p>${escapeHtml(bubble.english)}</p>
              <button type="button" class="copy-btn" data-text="${escapeHtml(bubble.english)}">📋</button>
            </div>
            <div class="translation-item">
              <strong>🇪🇸 Español</strong>
              <p>${escapeHtml(bubble.spanish)}</p>
              <button type="button" class="copy-btn" data-text="${escapeHtml(bubble.spanish)}">📋</button>
            </div>
          </div>
        </article>
        `;
      }).join('')}
    </section>
  `;
}

function getTypeEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    dialogue: '💬',
    thought: '💭',
    narration: '📝',
    title: '📚',
    sound_effect: '🔊',
    onomatopoeia: '💥',
    other: '❓'
  };
  return emojiMap[type] || '❓';
}

function getTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    dialogue: 'Diálogo',
    thought: 'Pensamiento',
    narration: 'Narración',
    title: 'Título',
    sound_effect: 'Efecto de sonido',
    onomatopoeia: 'Onomatopeya',
    other: 'Otro'
  };
  return labelMap[type] || 'Otro';
}

function formatSessionTime(expiresIn?: number): string {
  if (!expiresIn) return "Activa";
  
  const hoursLeft = Math.floor(expiresIn / 3600);
  const daysLeft = Math.floor(hoursLeft / 24);
  
  if (daysLeft > 0) return `${daysLeft} días`;
  if (hoursLeft > 0) return `${hoursLeft}h`;
  return "< 1h";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
