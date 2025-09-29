/**
 * Funciones principales de renderizado para el servidor
 * Solo exports las funciones wrapper que usa server.ts
 */

// Funciones de conveniencia para renderizado completo
import type { TemplateData } from '../types';


// Import necesarios para las funciones de conveniencia
import { renderLayout } from './layouts/base.layout';
import { renderLoginPage } from './pages/login.page';
import { renderVerifyPage } from './pages/verify.page';
import { renderDashboardPage } from './pages/dashboard.page';
import { renderProcessingResult } from './components/result.component';

export function renderLogin(data: TemplateData = {}): string {
  const content = renderLoginPage({
    error: data.error,
    success: data.success
  });
  return renderLayout(content, { ...data, title: 'Iniciar Sesión - KomiKAI' });
}

export function renderVerifyCode(data: TemplateData = {}): string {
  const content = renderVerifyPage({
    error: data.error,
    success: data.success
  });
  return renderLayout(content, { ...data, title: 'Verificación - KomiKAI' });
}

export function renderDashboard(data: TemplateData = {}): string {
  const content = renderDashboardPage(data);
  return renderLayout(content, { ...data, title: 'Dashboard - KomiKAI' });
}

export function renderResult(data: TemplateData = {}): string {
  const { result, bubbles } = data;
  if (!result) {
    // Evitar referencia circular - renderizar dashboard directamente
    const dashboardContent = renderDashboardPage({ ...data, error: 'No hay resultados para mostrar' });
    return renderLayout(dashboardContent, { ...data, title: 'Dashboard - KomiKAI' });
  }

  const content = renderProcessingResult(result, bubbles);
  return renderLayout(content, { ...data, title: 'Resultados - KomiKAI' });
}