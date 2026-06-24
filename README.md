# MindMap AI

Plataforma educativa para crear y estudiar con mapas conceptuales generados por inteligencia artificial. Los usuarios pueden escribir un tema, subir un documento o dictar audio, y la IA genera un mapa conceptual interactivo. Incluye colaboración en tiempo real (WebSockets), grupos, comunidades, ranking, logros y panel de administración.

---

## Estructura del proyecto

```text
Mindmapai/
├── backend/               API REST con Node.js y Express
│   ├── data/              Base de datos SQLite
│   ├── middleware/        Autenticación JWT
│   ├── routes/            Endpoints de la API
│   ├── scripts/           Scripts de seedeo de datos
│   ├── utils/             Utilidades (gamificación, IDs)
│   ├── achievementChecker.js  Lógica de desbloqueo de logros
│   ├── db.js              Inicialización y conexión a la base de datos
│   └── server.js          Punto de entrada del servidor
│
└── frontend/              Aplicación web con React y Vite
    ├── src/
    │   ├── app/
    │   │   ├── components/    Páginas y componentes de la UI
    │   │   ├── hooks/         Custom hooks (autenticación, etc.)
    │   │   └── routes.tsx     Definición de rutas
    │   ├── styles/            Estilos globales y tema
    │   └── main.tsx           Punto de entrada de React
    ├── dist/                  Build de producción (generado)
    └── index.html             HTML base
```

---

## Requisitos

- Node.js 18+
- npm
- Una API key de [Groq](https://console.groq.com/)
- Cuenta AWS S3 (opcional, para subida de imágenes y archivos)

---

## Configuración

Antes de arrancar, crea el archivo `.env` dentro de `backend/`:

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` y añade tus claves:

```env
GROQ_API_KEY=tu_api_key_aqui

# Opcional — S3 para subida de archivos
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
AWS_S3_PUBLIC_URL=

# Opcional — cuenta de administrador
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secreto
```

---

## Cómo ejecutar el proyecto

El proyecto tiene dos partes que corren en paralelo: el backend en el puerto `3001` y el frontend en el `5173`.

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

Desde la raíz del proyecto (en otra terminal):

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

---

## Endpoints principales de la API

| Módulo | Prefijo |
| --- | --- |
| Autenticación | `/api/auth` |
| Usuarios | `/api/users` |
| Mapas conceptuales | `/api/maps` |
| Grupos / Aulas | `/api/groups` |
| Comunidades | `/api/communities` |
| Leaderboard | `/api/leaderboard` |
| Logros | `/api/achievements` |
| Sesiones de estudio | `/api/sessions` |
| Subida de archivos | `/api/upload` |
| Panel de administración | `/api/admin` |

Consulta [`backend/README.md`](backend/README.md) para la referencia completa de cada endpoint.

---

## Licencia

MIT — consulta el archivo [LICENSE](LICENSE) para más detalles.
