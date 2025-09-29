/**
 * Página de login
 */

import type { TemplateData } from '../../types';

interface LoginPageData {
  error?: string | null;
  success?: string | null;
}

export function renderLoginPage(data: LoginPageData = {}): string {
  const { error, success } = data;

  return `
    <div class="hero-content">
      <section class="auth-card">
        <hgroup>
          <h1>Bienvenido a KomiKAI</h1>
          <p>Tu traductor inteligente de manga y manhwa</p>
        </hgroup>

        ${error ? `<div class="alert error" role="alert">${error}</div>` : ""}
        ${success ? `<div class="alert success" role="alert">${success}</div>` : ""}

        <form method="post">
          <label for="email">
            📧 Correo electrónico
            <input
              type="email"
              id="email"
              name="email"
              placeholder="tu.email@dominio.com"
              required
              autocomplete="email"
            />
          </label>
          <button type="submit">🚀 Continuar</button>
        </form>

        <div class="features-grid">
          <div class="feature">
            <h3>🤖 IA Avanzada</h3>
            <p>Procesamiento inteligente con tecnología OpenAI para traducciones precisas</p>
          </div>
          <div class="feature">
            <h3>🌍 Multiidioma</h3>
            <p>Soporte para japonés y coreano con traducción a español e inglés</p>
          </div>
          <div class="feature">
            <h3>⚡ Rápido</h3>
            <p>Procesamiento optimizado para resultados en segundos</p>
          </div>
        </div>
      </section>
    </div>
  `;
}