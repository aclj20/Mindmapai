# MindMap AI

Plataforma educativa para crear y estudiar con mapas conceptuales generados por inteligencia artificial. Los usuarios pueden subir documentos o escribir un tema, y la IA genera un mapa conceptual interactivo. Incluye sistema de autenticación, grupos colaborativos, ranking y logros.

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
- pnpm (o npm)
- Una API key de [Groq](https://console.groq.com/)

---

## Configuración

Antes de arrancar, crea el archivo `.env` dentro de `backend/`:

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` y añade tu clave:

```env
GROQ_API_KEY=tu_api_key_aqui
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

| Método | Ruta                   | Descripción                  |
| ------ | ---------------------- | ---------------------------- |
| POST   | `/api/auth/register`   | Registro de usuario          |
| POST   | `/api/auth/login`      | Login                        |
| GET    | `/api/maps`            | Obtener mapas del usuario    |
| POST   | `/api/maps/generate`   | Generar mapa con IA          |
| GET    | `/api/groups`          | Listar grupos                |
| GET    | `/api/leaderboard`     | Ranking global               |
| GET    | `/api/achievements`    | Logros del usuario           |

---

## Licencia

MIT — consulta el archivo [LICENSE](LICENSE) para más detalles.
