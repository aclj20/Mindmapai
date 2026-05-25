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
|---|---|
| Servidor | Express 4 |
| Base de datos | sql.js 1.12 (SQLite compilado a WASM — sin dependencias nativas) |
| Autenticación | JWT (7 días) + bcryptjs |
| Persistencia | Export a archivo `.db` con debounce de 150 ms |

---

## Base de datos — 16 tablas

### Usuarios y autenticación

#### `users`
Cuenta de cada usuario registrado.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | TEXT | Nombre visible |
| `email` | TEXT UNIQUE | Correo de acceso |
| `password_hash` | TEXT | Hash bcrypt |
| `role` | TEXT | `student` o `teacher` |
| `level` | INTEGER | Nivel gamificado (inicia en 1) |
| `xp` | INTEGER | XP acumulada en el nivel actual |
| `xp_to_next` | INTEGER | XP necesaria para subir de nivel (escala ×1.3) |
| `streak` | INTEGER | Días de actividad consecutivos |
| `total_points` | INTEGER | Puntos históricos totales (usados en leaderboard) |
| `last_activity_date` | TEXT | Fecha ISO de última actividad (para calcular racha) |
| `created_at` | TEXT | Fecha de registro |

---

### Mapas conceptuales

#### `maps`
Cabecera de cada mapa.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `title` | TEXT | Título del mapa |
| `owner_id` | INTEGER FK → users | Creador |
| `is_public` | INTEGER | `0` privado / `1` público en comunidad |
| `like_count` | INTEGER | Contador de me gusta (desnormalizado) |
| `view_count` | INTEGER | Visualizaciones por otros usuarios |
| `comment_count` | INTEGER | Total de comentarios |
| `node_count` | INTEGER | Cantidad de nodos (actualizado al guardar) |
| `created_at` | TEXT | |
| `updated_at` | TEXT | Se actualiza al guardar nodos |

#### `map_nodes`
Cada nodo dentro de un mapa.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `map_id` | INTEGER FK → maps | Cascade delete |
| `x`, `y` | REAL | Posición en el canvas |
| `label` | TEXT | Texto del nodo |
| `category` | TEXT | `concept`, `topic`, etc. |
| `description` | TEXT | Descripción opcional |
| `tags` | TEXT | JSON array de etiquetas |
| `icon` | TEXT | Nombre de icono Lucide |
| `image` | TEXT | URL de imagen |
| `stats` | TEXT | JSON con datos adicionales |
| `is_sticky` | INTEGER | Si es nota adhesiva |
| `color` | TEXT | Color personalizado |

#### `map_connections`
Aristas entre nodos.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `map_id` | INTEGER FK → maps | |
| `from_node_id` | INTEGER FK → map_nodes | |
| `to_node_id` | INTEGER FK → map_nodes | |
| — | UNIQUE | `(from_node_id, to_node_id)` evita duplicados |

#### `map_tags`
Etiquetas asignadas a un mapa completo.

| Columna | Tipo | Descripción |
|---|---|---|
| `map_id` | INTEGER FK → maps | |
| `tag` | TEXT | |
| — | UNIQUE | `(map_id, tag)` |

#### `map_likes`
Registro de me gusta por usuario/mapa (1 like por par).

| Columna | Tipo | Descripción |
|---|---|---|
| `map_id` | INTEGER FK → maps | |
| `user_id` | INTEGER FK → users | |
| `created_at` | TEXT | |
| — | UNIQUE | `(map_id, user_id)` |

#### `map_comments`
Comentarios en mapas públicos.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `map_id` | INTEGER FK → maps | |
| `user_id` | INTEGER FK → users | |
| `text` | TEXT | Contenido del comentario |
| `created_at` | TEXT | |

#### `node_notes`
Notas personales privadas que un usuario escribe sobre un nodo específico.

| Columna | Tipo | Descripción |
|---|---|---|
| `node_id` | INTEGER FK → map_nodes | |
| `user_id` | INTEGER FK → users | |
| `content` | TEXT | Contenido de la nota |
| `updated_at` | TEXT | |
| — | UNIQUE | `(node_id, user_id)` — UPSERT |

---

### Gamificación

#### `achievements`
Catálogo global de logros (sembrado automáticamente al crear la BD).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | TEXT | Nombre del logro |
| `description` | TEXT | |
| `icon` | TEXT | Nombre de icono Lucide |
| `color` | TEXT | Clases Tailwind |
| `xp_reward` | INTEGER | XP que otorga al desbloquearse |
| `criteria_type` | TEXT | Qué métrica mide (`maps_created`, `streak`, `study_sessions`, `total_likes`, `comments_given`) |
| `criteria_value` | INTEGER | Valor objetivo |

**Logros pre-cargados:** Explorador, Creador Pro, Racha 7 días, Top 10, Maestro de conceptos, Velocista, Rey del leaderboard, Popular, Erudito, Colaborador, Imparable.

#### `user_achievements`
Estado de cada logro por usuario.

| Columna | Tipo | Descripción |
|---|---|---|
| `user_id` | INTEGER FK → users | |
| `achievement_id` | INTEGER FK → achievements | |
| `progress` | INTEGER | Valor actual del criterio |
| `unlocked_at` | TEXT | NULL si aún no desbloqueado |
| — | UNIQUE | `(user_id, achievement_id)` |

#### `point_transactions`
Historial de cada ganancia de XP/puntos (usado para leaderboard por período).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `user_id` | INTEGER FK → users | |
| `points` | INTEGER | Puntos ganados |
| `reason` | TEXT | `map_created`, `comment_added`, `study_session`, `achievement_<nombre>` |
| `created_at` | TEXT | |

---

### Grupos y tareas

#### `groups`
Grupos/aulas creados por docentes.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | TEXT | Nombre del grupo |
| `teacher_id` | INTEGER FK → users | Docente dueño |
| `join_code` | TEXT UNIQUE | Código de 6 caracteres para unirse |

#### `group_members`
Tabla pivote usuarios ↔ grupos.

| Columna | Tipo | Descripción |
|---|---|---|
| `group_id` | INTEGER FK → groups | |
| `user_id` | INTEGER FK → users | |
| `joined_at` | TEXT | |
| — | UNIQUE | `(group_id, user_id)` |

#### `assignments`
Tareas asignadas a un grupo por el docente.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `group_id` | INTEGER FK → groups | |
| `created_by` | INTEGER FK → users | Docente |
| `title` | TEXT | Enunciado de la tarea |
| `due_date` | TEXT | Fecha límite (opcional) |

#### `assignment_submissions`
Entregas de alumnos a una tarea.

| Columna | Tipo | Descripción |
|---|---|---|
| `assignment_id` | INTEGER FK → assignments | |
| `student_id` | INTEGER FK → users | |
| `map_id` | INTEGER FK → maps | Mapa entregado (opcional) |
| `status` | TEXT | `pending` / `submitted` |
| `submitted_at` | TEXT | |
| — | UNIQUE | `(assignment_id, student_id)` — UPSERT |

---

### Sesiones de estudio

#### `study_sessions`
Registro de cada sesión de estudio cronometrada.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | |
| `user_id` | INTEGER FK → users | |
| `map_id` | INTEGER FK → maps | Mapa estudiado (opcional) |
| `started_at` | TEXT | Inicio de sesión |
| `ended_at` | TEXT | Fin de sesión |
| `duration_minutes` | INTEGER | Duración calculada al cerrar |

---

## API Endpoints

Todas las rutas marcadas con `🔒` requieren header `Authorization: Bearer <token>`.

### Autenticación — `/api/auth`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | — | Registra usuario nuevo. Body: `{ name, email, password, role }`. Devuelve JWT. |
| POST | `/api/auth/login` | — | Inicia sesión. Body: `{ email, password }`. Devuelve JWT + datos del usuario. |

---

### Usuarios — `/api/users`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/users/me` | 🔒 | Perfil del usuario autenticado con stats calculadas (`maps_created`, `study_sessions`, `total_likes`). |
| PUT | `/api/users/me` | 🔒 | Actualiza `name`, `email` y/o `password`. |

---

### Mapas — `/api/maps`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/maps` | 🔒 | Lista de mapas públicos (comunidad), ordenados por likes. |
| GET | `/api/maps/my` | 🔒 | Mapas del usuario autenticado. |
| POST | `/api/maps` | 🔒 | Crea mapa. Body: `{ title, is_public }`. Otorga 50 XP y actualiza racha. |
| GET | `/api/maps/:id` | 🔒 | Mapa completo con nodos, conexiones, tags y si el usuario ya lo likeó. |
| PUT | `/api/maps/:id` | 🔒 | Actualiza `title` y/o `is_public`. Solo el dueño. |
| DELETE | `/api/maps/:id` | 🔒 | Elimina mapa. Solo el dueño. Deduce 50 XP. |
| POST | `/api/maps/:id/like` | 🔒 | Alterna like (si ya existe lo quita). |
| GET | `/api/maps/:id/comments` | 🔒 | Lista de comentarios del mapa. |
| POST | `/api/maps/:id/comments` | 🔒 | Agrega comentario. Otorga 5 XP. |
| POST | `/api/maps/:id/nodes` | 🔒 | Guarda todos los nodos y conexiones (reemplaza). Solo el dueño. |
| GET | `/api/maps/:id/nodes/:nodeId/note` | 🔒 | Lee la nota personal del usuario en ese nodo. |
| PUT | `/api/maps/:id/nodes/:nodeId/note` | 🔒 | Guarda/actualiza nota personal (UPSERT). |

---

### Grupos — `/api/groups`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/groups/my` | 🔒 | Grupos a los que pertenece el usuario. |
| POST | `/api/groups` | 🔒 teacher | Crea grupo. Body: `{ name }`. Genera `join_code` único de 6 chars. |
| POST | `/api/groups/join` | 🔒 | Unirse a un grupo. Body: `{ join_code }`. |
| GET | `/api/groups/:id` | 🔒 miembro | Detalles del grupo con lista de miembros y sus stats. |
| GET | `/api/groups/:id/assignments` | 🔒 miembro | Lista de tareas del grupo con conteo de entregas. |
| POST | `/api/groups/:id/assignments` | 🔒 teacher | Crea tarea. Body: `{ title, due_date }`. Solo el docente del grupo. |
| POST | `/api/groups/assignments/:assignmentId/submit` | 🔒 | Entrega tarea. Body: `{ map_id }`. UPSERT si ya entregó. |

---

### Leaderboard — `/api/leaderboard`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/leaderboard` | 🔒 | Top 50 estudiantes. Query params: `period=alltime\|weekly\|monthly`, `group_id=X`. Incluye `rank` e `isCurrentUser`. |

---

### Logros — `/api/achievements`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/achievements` | 🔒 | Catálogo completo con progreso del usuario (`unlocked`, `unlocked_at`, `progress`). |
| POST | `/api/achievements/check` | 🔒 | Evalúa todas las condiciones y desbloquea los logros alcanzados. Devuelve `newly_unlocked[]`. |

---

### Sesiones de estudio — `/api/sessions`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/sessions/start` | 🔒 | Inicia sesión de estudio. Body: `{ map_id? }`. Devuelve `{ id, started_at }`. |
| POST | `/api/sessions/end` | 🔒 | Cierra sesión. Body: `{ session_id }`. Calcula duración y otorga 1 XP/minuto (máx 60). |
| GET | `/api/sessions/weekly-activity` | 🔒 | Actividad de los últimos 7 días agrupada por día. Los docentes ven la actividad de sus estudiantes. |
| GET | `/api/sessions/stats` | 🔒 | Resumen personal: `total_sessions` y `total_minutes`. |

---

### Health check

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | — | Devuelve `{ status: "ok" }`. |

---

## Sistema de XP y niveles

| Acción | XP ganada |
|---|---|
| Crear mapa | 50 |
| Agregar comentario | 5 |
| Sesión de estudio | 1 por minuto (máx 60) |
| Desbloquear logro | Variable (100 – 1500 según logro) |
| Eliminar mapa | −50 |

El nivel sube cuando `xp >= xp_to_next`. Al subir: `xp_to_next = round(xp_to_next × 1.3)`.

## Estructura de archivos

```
backend/
├── data/
│   └── mindmapai.db        # SQLite generado en runtime (no commitear)
├── middleware/
│   └── auth.js             # Verificación JWT
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── maps.js
│   ├── groups.js
│   ├── leaderboard.js
│   ├── achievements.js
│   └── sessions.js
├── db.js                   # sql.js wrapper con persistencia a disco
├── server.js               # Entry point
└── package.json
```
