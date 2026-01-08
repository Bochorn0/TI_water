# TI Water - Frontend

Sitio web de TI Water construido con React, TypeScript y Vite. Replica del sitio WordPress original en https://tiwater.com.mx/

## 🚀 Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Material-UI (MUI)** - Componentes de UI
- **Framer Motion** - Animaciones
- **React Router** - Navegación
- **React Toastify** - Notificaciones

## 📦 Instalación

```bash
# Instalar dependencias
yarn install
# o
npm install
```

## 🛠️ Desarrollo

```bash
# Iniciar servidor de desarrollo
yarn dev
# o
npm run dev
```

El sitio estará disponible en `http://localhost:3040`

## 🏗️ Build

```bash
# Crear build de producción
yarn build
# o
npm run build
```

Los archivos estáticos se generarán en la carpeta `dist/`

## 📁 Estructura del Proyecto

```
TI_water/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── header/         # Navegación principal
│   │   ├── footer/         # Pie de página
│   │   ├── hero/           # Sección hero
│   │   ├── sectors/        # Sección de sectores (Residencial, Comercial, Industrial)
│   │   ├── products/       # Sección de productos
│   │   ├── testimonials/   # Testimonios de clientes
│   │   └── contact-section/ # Formulario de contacto
│   ├── pages/              # Páginas de la aplicación
│   │   └── home/           # Página principal
│   ├── routes/             # Configuración de rutas
│   ├── theme/              # Configuración del tema MUI
│   ├── app.tsx             # Componente principal
│   ├── main.tsx            # Punto de entrada
│   └── global.css          # Estilos globales
├── public/                 # Archivos estáticos
├── index.html              # HTML principal
└── package.json            # Dependencias y scripts
```

## 🎨 Características

- ✅ Diseño responsive (mobile-first)
- ✅ Animaciones suaves con Framer Motion
- ✅ Navegación con scroll suave
- ✅ Formulario de contacto funcional
- ✅ Secciones principales del sitio original:
  - Hero section
  - Introducción
  - Tres sectores (Residencial, Comercial, Industrial)
  - Productos
  - Testimonios
  - Formulario de contacto
  - Footer con información de contacto

## 📝 Scripts Disponibles

- `yarn dev` - Inicia el servidor de desarrollo
- `yarn build` - Crea el build de producción
- `yarn lint` - Ejecuta el linter
- `yarn lint:fix` - Corrige errores de linting automáticamente
- `yarn fm:check` - Verifica formato con Prettier
- `yarn fm:fix` - Formatea el código con Prettier

## 🌐 Despliegue

El proyecto está listo para desplegarse en cualquier plataforma que soporte aplicaciones estáticas:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Cualquier servidor estático

## 📧 Contacto

Para más información, visita https://tiwater.com.mx/

---

Desarrollado con ❤️ para TI Water

