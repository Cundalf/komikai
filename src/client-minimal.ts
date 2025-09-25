/**
 * Cliente JavaScript minimalista
 * Solo maneja interacciones básicas del lado del cliente
 */

// Funcionalidad de copiar al portapapeles
document.addEventListener('DOMContentLoaded', () => {
  // Manejar botones de copiar
  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('copy-btn')) {
      event.preventDefault();
      const text = target.getAttribute('data-text');
      
      if (text) {
        try {
          await navigator.clipboard.writeText(text);
          const originalContent = target.innerHTML;
          target.innerHTML = '✅';
          target.title = '¡Copiado!';
          
          setTimeout(() => {
            target.innerHTML = originalContent;
            target.title = 'Copiar al portapapeles';
          }, 2000);
        } catch (error) {
          target.innerHTML = '⚠️';
          target.title = 'Error al copiar';
          
          setTimeout(() => {
            target.innerHTML = '📋';
            target.title = 'Copiar al portapapeles';
          }, 2000);
        }
      }
    }
  });

  // Mejorar UX del input de archivo usando delegación de eventos
  document.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    
    if (target.id === 'imageInput') {
      const fileLabel = document.querySelector('.file-label') as HTMLElement;
      const file = target.files?.[0];
      
      if (file && fileLabel) {
        const fileName = file.name;
        const fileSize = (file.size / 1024 / 1024).toFixed(1);
        
        // Actualizar el texto del label
        const span = fileLabel.querySelector('span');
        if (span) {
          span.textContent = `📁 ${fileName} (${fileSize}MB)`;
        }
        
        // Cambiar estilos para indicar archivo seleccionado
        fileLabel.style.borderColor = 'var(--color-primary)';
        fileLabel.style.backgroundColor = 'rgba(79, 163, 255, 0.1)';
      } else if (fileLabel) {
        // Restaurar estado original
        const span = fileLabel.querySelector('span');
        if (span) {
          span.textContent = '📁 Selecciona una imagen (PNG/JPG/SVG)';
        }
        
        fileLabel.style.borderColor = 'rgba(79, 163, 255, 0.4)';
        fileLabel.style.backgroundColor = 'rgba(79, 163, 255, 0.05)';
      }
    }
  });

  // Manejar el formulario de análisis con spinner usando delegación de eventos
  document.addEventListener('submit', (event) => {
    const target = event.target as HTMLElement;
    
    if (target.id === 'uploadForm') {
      const submitButton = target.querySelector('button[type="submit"]') as HTMLButtonElement;
      
      if (submitButton) {
        // Deshabilitar el botón y mostrar spinner
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <span class="spinner"></span>
          Analizando...
        `;
        submitButton.style.cursor = 'not-allowed';
        submitButton.style.opacity = '0.7';
      }
    }
  });

  // Funcionalidad de click en tarjetas para móviles
  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const translationItem = target.closest('.translation-item');
    
    if (translationItem && window.innerWidth <= 767) {
      const copyBtn = translationItem.querySelector('.copy-btn') as HTMLElement;
      const text = copyBtn?.getAttribute('data-text');
      
      if (text && copyBtn) {
        event.preventDefault();
        try {
          await navigator.clipboard.writeText(text);
          const originalContent = copyBtn.innerHTML;
          const originalTitle = copyBtn.title;
          
          copyBtn.innerHTML = '✅';
          copyBtn.title = '¡Copiado!';
          
          setTimeout(() => {
            copyBtn.innerHTML = originalContent;
            copyBtn.title = originalTitle;
          }, 2000);
        } catch (error) {
          copyBtn.innerHTML = '⚠️';
          copyBtn.title = 'Error al copiar';
          
          setTimeout(() => {
            copyBtn.innerHTML = '📋';
            copyBtn.title = 'Copiar al portapapeles';
          }, 2000);
        }
      }
    }
  });
});
