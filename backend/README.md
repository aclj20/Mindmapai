# MindMap AI — Backend

API REST construida con **Express.js** y **sql.js** (SQLite en WebAssembly).
Puerto por defecto: **3001**. Frontend esperado en `http://localhost:5173`.

## Inicio rápido

```bash
cd backend
npm install
npm run dev        # node --watch server.js
```

La base de datos se crea automáticamente en `backend/data/mindmapai.db` al primer arranque.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Servidor | Express 4 |
| Base de datos | sql.js 1.12 (SQLite compilado a WASM — sin dependencias nativas) |
| Autenticación | JWT (7 días) + bcryptjs |
| Persistencia | Export a archivo `.db` con debounce de 150 ms |
| Almacenamiento | AWS S3 (avatares, banners, adjuntos) |

---

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```env
GROQ_API_KEY=          # Obligatorio — generación de mapas con IA
JWT_SECRET=            # Opcional — por defecto usa una clave aleatoria

# AWS S3 — Opcional, necesario para subida de archivos
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
AWS_S3_PUBLIC_URL=

# Cuenta de administrador — Opcional
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

---

## Base de datos — tablas principales

### Usuarios y autenticación

#### `users`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `name` | TEXT | Nombre visible |
| `email` | TEXT UNIQUE | Correo de acceso |
| `password_hash` | TEXT | Hash bcrypt |
| `role` | TEXT | `student`, `teacher` o `admin` |
| `avatar_url` | TEXT | URL de foto de perfil |
| `level` | INTEGER | Nivel gamificado (inicia en 1) |
| `xp` | INTEGER | XP acumulada en el nivel actual |
| `xp_to_next` | INTEGER | XP necesaria para subir de nivel (escala ×1.3) |
| `streak` | INTEGER | Días de actividad consecutivos |
| `total_points` | INTEGER | Puntos históricos totales (leaderboard) |
| `last_activity_date` | TEXT | Fecha ISO de última actividad |
| `tutorial_done` | INTEGER | `1` si completó el tutorial interactivo |
| `created_at` | TEXT | Fecha de registro |

---

### Mapas conceptuales

#### `maps`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `public_id` | TEXT UNIQUE | ID público ofuscado (usado en URLs) |
| `title` | TEXT | Título del mapa |
| `owner_id` | INTEGER FK → users | Creador |
| `is_public` | INTEGER | `0` privado / `1` público |
| `like_count` | INTEGER | Contador de me gusta |
| `view_count` | INTEGER | Visualizaciones por otros usuarios |
| `comment_count` | INTEGER | Total de comentarios |
| `node_count` | INTEGER | Cantidad de nodos |
| `group_id` | INTEGER FK → groups | Grupo al que pertenece (opcional) |
| `created_at` | TEXT | |
| `updated_at` | TEXT | Se actualiza al guardar nodos |

#### `map_nodes` / `map_connections` / `map_tags` / `map_likes` / `map_comments`

Igual que antes. Ver esquema en `db.js`.

#### `map_collaborators`

Colaboradores con acceso de edición o solo lectura a un mapa.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `map_id` | INTEGER FK → maps | |
| `user_id` | INTEGER FK → users | |
| `role` | TEXT | `editor` o `viewer` |
| `invited_at` | TEXT | |

#### `map_invite_codes`

Códigos de invitación para unirse a un mapa colaborativo.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `map_id` | INTEGER FK → maps | |
| `code` | TEXT UNIQUE | Código de 8 caracteres |
| `role` | TEXT | `editor` o `viewer` |
| `created_at` | TEXT | |

#### `node_comments`

Comentarios adjuntos a un nodo específico del mapa.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `node_id` | INTEGER FK → map_nodes | |
| `user_id` | INTEGER FK → users | |
| `text` | TEXT | |
| `created_at` | TEXT | |

---

### Comunidades

#### `communities`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `name` | TEXT | Nombre de la comunidad |
| `slug` | TEXT UNIQUE | Identificador en URL |
| `description` | TEXT | Descripción opcional |
| `icon_url` | TEXT | URL del ícono |
| `banner_url` | TEXT | URL del banner |
| `creator_id` | INTEGER FK → users | Fundador |
| `member_count` | INTEGER | Contador desnormalizado |
| `post_count` | INTEGER | Contador desnormalizado |
| `created_at` | TEXT | |

#### `community_members`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `community_id` | INTEGER FK → communities | |
| `user_id` | INTEGER FK → users | |
| `role` | TEXT | `member`, `mod` o `admin` |
| `is_blocked` | INTEGER | `1` si el usuario está bloqueado |
| `joined_at` | TEXT | |

#### `community_posts`

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `public_id` | TEXT UNIQUE | ID ofuscado para URLs |
| `community_id` | INTEGER FK → communities | |
| `author_id` | INTEGER FK → users | |
| `title` | TEXT | |
| `content` | TEXT | Cuerpo del post (opcional) |
| `post_type` | TEXT | `discussion`, `map` o `resource` |
| `map_id` | INTEGER FK → maps | Mapa adjunto (opcional) |
| `link_url` | TEXT | URL de recurso externo (opcional) |
| `attachment_url` | TEXT | URL de documento adjunto (S3) |
| `attachment_name` | TEXT | Nombre original del archivo |
| `attachment_size` | INTEGER | Tamaño en bytes |
| `upvote_count` | INTEGER | |
| `comment_count` | INTEGER | |
| `created_at` | TEXT | |

#### `community_post_votes` / `community_post_comments`

Votos y comentarios de posts de comunidad.

---

### Gamificación

#### `achievements` / `user_achievements` / `point_transactions`

Ver esquema completo en `db.js`.

#### `challenges`

Retos temporales creados desde el panel de administración.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `title` | TEXT | Título del reto |
| `description` | TEXT | |
| `criteria_type` | TEXT | Métrica medida (`maps_created`, `study_sessions`, etc.) |
| `criteria_value` | INTEGER | Valor objetivo |
| `xp_reward` | INTEGER | XP al completar |
| `starts_at` | TEXT | Inicio del reto |
| `ends_at` | TEXT | Fin del reto |

#### `user_challenge_progress`

Progreso de cada usuario en retos activos.

---

### Grupos, tareas y sesiones

#### `groups` / `group_members` / `assignments` / `assignment_submissions` / `study_sessions`

Igual que antes. Ver esquema en `db.js`.

---

## API Endpoints

Todas las rutas marcadas con 🔒 requieren header `Authorization: Bearer <token>`.
Las rutas marcadas con 🔑 requieren además `role = admin`.

---

### Autenticación — `/api/auth`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Registra usuario. Body: `{ name, email, password, role }`. Devuelve JWT. |
| POST | `/api/auth/login` | — | Inicia sesión. Body: `{ email, password }`. Devuelve JWT + datos del usuario. |

---

### Usuarios — `/api/users`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/users/me` | 🔒 | Perfil del usuario autenticado con stats. |
| PUT | `/api/users/me` | 🔒 | Actualiza `name`, `email` y/o `password`. |
| POST | `/api/users/me/tutorial-done` | 🔒 | Marca el tutorial interactivo como completado. |
| GET | `/api/users/:id/public` | 🔒 | Perfil público de otro usuario (mapas, logros, stats). |

---

### Mapas — `/api/maps`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/maps` | 🔒 | Mapas públicos ordenados por likes. |
| GET | `/api/maps/my` | 🔒 | Mapas del usuario autenticado (propios + colaboraciones). |
| POST | `/api/maps` | 🔒 | Crea mapa. Body: `{ title, is_public, group_id? }`. Otorga 50 XP. |
| GET | `/api/maps/:id` | 🔒 | Mapa completo con nodos, conexiones, tags y rol del usuario. |
| PUT | `/api/maps/:id` | 🔒 | Actualiza `title` y/o `is_public`. Solo el dueño. |
| DELETE | `/api/maps/:id` | 🔒 | Elimina mapa. Solo el dueño. Deduce 50 XP. |
| POST | `/api/maps/:id/like` | 🔒 | Alterna like. |
| GET | `/api/maps/:id/comments` | 🔒 | Comentarios del mapa. |
| POST | `/api/maps/:id/comments` | 🔒 | Agrega comentario. Otorga 5 XP. |
| POST | `/api/maps/:id/nodes` | 🔒 | Guarda todos los nodos y conexiones (reemplaza). Owner o editor. |
| GET | `/api/maps/:id/nodes/:nodeId/note` | 🔒 | Lee nota personal del usuario en ese nodo. |
| PUT | `/api/maps/:id/nodes/:nodeId/note` | 🔒 | Guarda/actualiza nota personal (UPSERT). |
| GET | `/api/maps/:id/nodes/:nodeId/comments` | 🔒 | Comentarios de un nodo específico. |
| POST | `/api/maps/:id/nodes/:nodeId/comments` | 🔒 | Agrega comentario a un nodo. |
| POST | `/api/maps/:id/consult-ai` | 🔒 | Consulta a la IA sobre el mapa. Body: `{ question }`. |
| POST | `/api/maps/:id/quiz/generate` | 🔒 | Genera quiz de 5 preguntas con IA a partir del mapa. |
| POST | `/api/maps/:id/quiz/submit` | 🔒 | Envía respuestas del quiz. Otorga XP según aciertos. |
| POST | `/api/maps/join` | 🔒 | Unirse a un mapa con código de invitación. Body: `{ code }`. |
| GET | `/api/maps/:id/sharing` | 🔒 owner | Info de colaboradores y código de invitación activo. |
| POST | `/api/maps/:id/sharing/invite-code` | 🔒 owner | Genera código de invitación. Body: `{ role }`. |
| POST | `/api/maps/:id/collaborators` | 🔒 owner | Agrega colaborador por email. Body: `{ email, role }`. |
| PUT | `/api/maps/:id/collaborators/:userId` | 🔒 owner | Cambia rol de colaborador. Body: `{ role }`. |
| DELETE | `/api/maps/:id/collaborators/:userId` | 🔒 owner | Elimina colaborador. |

---

### Grupos — `/api/groups`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/groups/my` | 🔒 | Grupos a los que pertenece el usuario. |
| POST | `/api/groups` | 🔒 teacher | Crea grupo. Body: `{ name }`. Genera `join_code` único. |
| POST | `/api/groups/join` | 🔒 | Unirse a un grupo. Body: `{ join_code }`. |
| GET | `/api/groups/:id` | 🔒 miembro | Detalles del grupo con miembros y sus stats. |
| GET | `/api/groups/:id/assignments` | 🔒 miembro | Tareas del grupo con conteo de entregas. |
| POST | `/api/groups/:id/assignments` | 🔒 teacher | Crea tarea. Body: `{ title, due_date? }`. |
| POST | `/api/groups/assignments/:id/submit` | 🔒 | Entrega tarea. Body: `{ map_id }`. UPSERT. |

---

### Comunidades — `/api/communities`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/communities` | 🔒 | Lista comunidades. Query: `?q=texto` para buscar. |
| POST | `/api/communities` | 🔒 | Crea comunidad. Body: `{ name, description? }`. |
| GET | `/api/communities/posts/:postId` | 🔒 | Post individual con detalle completo. |
| POST | `/api/communities/posts/:postId/vote` | 🔒 | Alterna voto (upvote) en un post. |
| GET | `/api/communities/posts/:postId/comments` | 🔒 | Comentarios del post. |
| POST | `/api/communities/posts/:postId/comments` | 🔒 | Agrega comentario. Body: `{ content, parent_id? }`. |
| DELETE | `/api/communities/posts/:postId` | 🔒 autor | Elimina post. |
| DELETE | `/api/communities/comments/:commentId` | 🔒 autor | Elimina comentario. |
| GET | `/api/communities/:slug` | 🔒 | Info de la comunidad (nombre, stats, rol del usuario). |
| PUT | `/api/communities/:slug` | 🔒 admin | Edita nombre, descripción, icon_url, banner_url. |
| POST | `/api/communities/:slug/join` | 🔒 | Unirse a la comunidad. |
| DELETE | `/api/communities/:slug/leave` | 🔒 | Salir de la comunidad. |
| GET | `/api/communities/:slug/posts` | 🔒 | Posts de la comunidad. Query: `?sort=new\|top`. |
| POST | `/api/communities/:slug/posts` | 🔒 miembro | Crea post. Body: `{ title, content?, post_type, map_id?, link_url?, attachment_url?, attachment_name?, attachment_size? }`. |
| GET | `/api/communities/:slug/members` | 🔒 | Miembros (primeros 30). Query: `?all=1` para todos (solo admins/mods). |
| PUT | `/api/communities/:slug/members/:userId/role` | 🔒 admin | Cambia rol de un miembro. Body: `{ role }`. |
| POST | `/api/communities/:slug/members/:userId/block` | 🔒 admin/mod | Bloquea o desbloquea un miembro. |
| DELETE | `/api/communities/:slug/members/:userId` | 🔒 admin/mod | Expulsa a un miembro. |

---

### Leaderboard — `/api/leaderboard`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/leaderboard` | 🔒 | Top 50 estudiantes. Query: `?period=alltime\|weekly\|monthly`, `?group_id=X`. |

---

### Logros — `/api/achievements`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/achievements` | 🔒 | Catálogo con progreso del usuario (`unlocked`, `progress`). |
| POST | `/api/achievements/check` | 🔒 | Evalúa condiciones y desbloquea logros alcanzados. |

---

### Sesiones de estudio — `/api/sessions`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/api/sessions/start` | 🔒 | Inicia sesión. Body: `{ map_id? }`. |
| POST | `/api/sessions/end` | 🔒 | Cierra sesión. Body: `{ session_id }`. Otorga 1 XP/min (máx 60). |
| GET | `/api/sessions/weekly-activity` | 🔒 | Actividad de los últimos 7 días por día. |
| GET | `/api/sessions/stats` | 🔒 | Resumen: `total_sessions` y `total_minutes`. |

---

### Subida de archivos — `/api/upload`

Requieren S3 configurado. Body: `multipart/form-data`.

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/api/upload/avatar` | 🔒 | Sube foto de perfil. Campo: `avatar`. Actualiza `users.avatar_url`. |
| POST | `/api/upload/community-image` | 🔒 | Sube ícono o banner de comunidad. Campo: `file`. Query: `?type=icon\|banner`. |
| POST | `/api/upload/attachment` | 🔒 | Sube documento adjunto (PDF, DOCX, etc.). Campo: `file`. Devuelve `{ file_url, file_name, file_type, file_size }`. |

---

### Panel de administración — `/api/admin`

Todas requieren 🔒 + 🔑 `role = admin`, excepto las marcadas.

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/admin/achievements` | 🔒🔑 | Lista todos los logros del catálogo. |
| POST | `/api/admin/achievements` | 🔒🔑 | Crea logro. Body: `{ name, description, icon, color, xp_reward, criteria_type, criteria_value }`. |
| PUT | `/api/admin/achievements/:id` | 🔒🔑 | Edita logro. |
| DELETE | `/api/admin/achievements/:id` | 🔒🔑 | Elimina logro. |
| GET | `/api/admin/challenges` | 🔒🔑 | Lista todos los retos. |
| GET | `/api/admin/challenges/active` | 🔒 | Retos activos en este momento (cualquier usuario autenticado). |
| POST | `/api/admin/challenges` | 🔒🔑 | Crea reto. Body: `{ title, description, criteria_type, criteria_value, xp_reward, starts_at, ends_at }`. |
| PUT | `/api/admin/challenges/:id` | 🔒🔑 | Edita reto. |
| DELETE | `/api/admin/challenges/:id` | 🔒🔑 | Elimina reto. |
| POST | `/api/admin/challenges/:id/progress` | 🔒 | Registra progreso del usuario en un reto activo. Body: `{ value }`. |
| GET | `/api/admin/stats` | 🔒🔑 | Estadísticas globales: usuarios, mapas, comunidades, sesiones. |

---

### Health check

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Devuelve `{ status: "ok" }`. |

---

## Sistema de XP y niveles

| Acción | XP ganada |
| --- | --- |
| Crear mapa | 50 |
| Agregar comentario | 5 |
| Sesión de estudio | 1 por minuto (máx 60) |
| Quiz — respuesta correcta | 20 |
| Desbloquear logro | 100 – 1500 según logro |
| Completar reto | Variable según reto |
| Eliminar mapa | −50 |

El nivel sube cuando `xp >= xp_to_next`. Al subir: `xp_to_next = round(xp_to_next × 1.3)`.

---

## Estructura de archivos

```
backend/
├── data/
│   └── mindmapai.db            # SQLite generado en runtime
├── middleware/
│   └── auth.js                 # Verificación JWT
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── maps.js
│   ├── groups.js
│   ├── communities.js
│   ├── leaderboard.js
│   ├── achievements.js
│   ├── sessions.js
│   ├── upload.js
│   └── admin.js
├── achievementChecker.js        # Lógica de desbloqueo de logros
├── db.js                        # sql.js wrapper con persistencia a disco
├── server.js                    # Entry point
└── package.json
```
