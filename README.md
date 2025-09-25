# 📚 KomiKAI

**🎌 Traductor de manga o manhwa con IA - Traduce globos de diálogo al instante**

Una aplicación web minimalista y responsive que extrae texto de mangas o manhwa y proporciona traducciones automáticas al inglés y español usando OpenAI.

## ✨ Características

- 🔐 **Autenticación segura**: Login con código de 6 dígitos por email + JWT de 7 días
- 🤖 **IA avanzada**: Usa OpenAI GPT-4o para extracción y traducción
- 📱 **Totalmente responsive**: Optimizado para móviles y desktop
- 🎨 **Diseño moderno**: UI minimalista con PicoCSS + Design System personalizado
- ⚡ **Súper rápido**: Construido con Bun para máximo rendimiento
- 🛡️ **Rate limiting**: Protección contra abuso de API
- 📋 **Copia fácil**: Click para copiar cualquier traducción
- 🎯 **Sesión persistente**: No necesitas hacer login por 7 días

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd komikai

# Instalar dependencias con Bun
bun install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

## ⚙️ Configuración

Crea un archivo `.env` con:

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# SMTP para emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=KomiKAI <no-reply@komikai.app>

# Servidor
PORT=3000
SESSION_SECRET=tu-secreto-super-seguro
NODE_ENV=production
```

## 👥 Usuarios Permitidos

Edita `data/allowed-users.json`:

```json
[
  "usuario1@ejemplo.com",
  "usuario2@ejemplo.com"
]
```

## 🎮 Uso

```bash
# Desarrollo
bun run dev

# Producción
bun run start

# Verificar tipos
bun run type-check

# Compilar cliente
bun run build
```

## 📖 Cómo usar

1. **Login**: Ingresa tu email habilitado
2. **Código**: Recibe y verifica el código de 6 dígitos
3. **Subir**: Arrastra una imagen
4. **Traducir**: La IA extrae y traduce automáticamente
5. **Copiar**: Hover sobre cualquier texto para copiarlo

## 🛠️ Tecnologías

- **Backend**: Bun + TypeScript
- **Frontend**: Vanilla JS + PicoCSS
- **IA**: OpenAI GPT-4o
- **Email**: Nodemailer
- **Tipado**: TypeScript strict

## 📝 API Endpoints

- `POST /api/login/request` - Solicitar código
- `POST /api/login/verify` - Verificar código
- `POST /api/logout` - Cerrar sesión
- `GET /api/session` - Estado de sesión
- `POST /api/process` - Procesar imagen
- `GET /api/status` - Estado del servidor

## 🔒 Seguridad

- Rate limiting por usuario
- Validación de tipos de archivo
- Límite de tamaño (10MB)
- Tokens de sesión seguros
- Solo usuarios permitidos

## 📱 Responsive

- **Desktop**: Grid de 3 columnas
- **Tablet**: Grid de 2 columnas  
- **Móvil**: Grid de 1 columna + botones full-width

## 🎨 Design System

Colores, tipografía y componentes siguiendo el design system en `design_system.md`.

---

**Hecho con ❤️**