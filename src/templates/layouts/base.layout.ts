/**
 * Layout base de la aplicación
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TemplateData } from '../../types';
import { APP_NAME } from '../../utils/constants';

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

export function renderLayout(content: string, data: TemplateData = {}): string {
  const { title = APP_NAME, user } = data;

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
    <header class="hero${user ? " logged-in" : ""}">
      <nav class="container-fluid">
        <ul>
          <li><strong>📚 ${APP_NAME}</strong></li>
        </ul>
        <ul>
          <li class="tag-optional"><span class="tag">✨ Manhwa 📖 Manga ✨</span></li>
          ${
            user
              ? `<li>
                   <details class="dropdown">
                     <summary aria-haspopup="listbox" role="button" class="secondary">
                       👋 ${user.name}
                     </summary>
                     <ul dir="rtl">
                       <li><a href="/dashboard">📊 Dashboard</a></li>
                       <li><a href="/?logout=1">🚪 Cerrar sesión</a></li>
                     </ul>
                   </details>
                 </li>`
              : ""
          }
        </ul>
      </nav>
    </header>
    <main class="container">
      ${content}
    </main>
    <footer class="container">
      <p style="text-align: center; color: var(--pico-muted-color); font-size: 0.875rem;">
        <strong>${APP_NAME}</strong> v${getAppVersion()} - Traductor de manga y manhwa con IA<br>
        Desarrollado con ❤️ para la comunidad otaku
      </p>
    </footer>
    <script src="/client.js"></script>
  </body>
</html>`;
}