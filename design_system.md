# 🎨 Design System

## 1. Colores

```css
/* Paleta principal */
--color-primary: #4FA3FF;   /* Azul cielo */
--color-secondary: #FF8FAB; /* Rosa sakura */
--color-accent: #FFD93D;    /* Amarillo brillante */
--color-neutral: #2E2E2E;   /* Negro suave */
--color-background: #FFFFFF;/* Blanco puro */
--color-surface: #F7F7F7;   /* Fondo gris claro */
```

🔹 **Uso recomendado:**

* **Primary (azul)** → botones principales, enlaces destacados.
* **Secondary (rosa)** → acentos en UI (tags, highlights, íconos).
* **Accent (amarillo)** → llamadas a la acción, notificaciones.
* **Neutral (negro/gris)** → texto y contenedores.
* **Background/surface** → fondos limpios para lectura.

---

## 2. Tipografía

* **Titulares:** `Poppins` (moderno, geométrico, juvenil).
* **Texto largo:** `Noto Sans JP` o `Inter` (buena lectura en japonés y español/inglés).

### Jerarquía

* `h1`: 32px bold
* `h2`: 24px semibold
* `h3`: 18px medium
* `body`: 16px regular
* `caption`: 14px light

---

## 3. Botones

### Botón primario

* Fondo: `--color-primary`
* Texto: `--color-background`
* Hover: `#3B82F6`

### Botón secundario

* Fondo: `--color-secondary`
* Texto: `--color-background`
* Hover: `#FF6F91`

### Botón fantasma

* Borde: `--color-primary`
* Texto: `--color-primary`
* Hover: `--color-primary` con 10% de opacidad de fondo.

---

## 4. Componentes clave

### Cards (frames de manga o manhwa)

* Fondo: `--color-surface`
* Bordes: radius 16px
* Sombra: `0px 4px 10px rgba(0,0,0,0.1)`

### Burbujas de traducción

* Fondo: `--color-background`
* Borde: `--color-primary`
* Texto: `--color-neutral`
* Código de color opcional: azul para inglés, rosa para español.

### Navbar

* Fondo: `--color-neutral`
* Texto: `--color-background`
* Acentos (hover/activo): `--color-accent`

---

## 5. Ejemplo de CSS Utility Classes

```css
.bg-primary { background-color: var(--color-primary); }
.bg-secondary { background-color: var(--color-secondary); }
.bg-accent { background-color: var(--color-accent); }
.bg-surface { background-color: var(--color-surface); }

.text-primary { color: var(--color-primary); }
.text-secondary { color: var(--color-secondary); }
.text-accent { color: var(--color-accent); }
.text-neutral { color: var(--color-neutral); }

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-background);
}

.btn-primary:hover {
  background: #3B82F6;
}
```
