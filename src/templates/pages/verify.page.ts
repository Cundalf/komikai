/**
 * Página de verificación de código
 */

import type { TemplateData } from '../../types';

interface VerifyPageData {
  error?: string | null;
  success?: string | null;
}

export function renderVerifyPage(data: VerifyPageData = {}): string {
  const { error, success } = data;

  return `
    <div class="hero-content">
      <section class="auth-card">
        <hgroup>
          <h1>Verificación</h1>
          <p>Ingresa el código que enviamos a tu correo</p>
        </hgroup>

        ${error ? `<div class="alert error" role="alert">${error}</div>` : ""}
        ${success ? `<div class="alert success" role="alert">${success}</div>` : ""}

        <form method="post">
          <label for="code">
            🔑 Código de verificación
            <input
              type="text"
              id="code"
              name="code"
              placeholder="123456"
              maxlength="6"
              pattern="[0-9]{6}"
              required
              autocomplete="one-time-code"
              inputmode="numeric"
            />
            <small>Código de 6 dígitos enviado por correo</small>
          </label>
          <button type="submit">✅ Verificar</button>
        </form>

        <p style="text-align: center;">
          <a href="/" style="color: var(--pico-primary);">⬅️ Volver al inicio</a>
        </p>
      </section>
    </div>
  `;
}