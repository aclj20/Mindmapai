const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const { awardXP, updateStreak }     = require('../utils/gamification');
const { makeShortId }               = require('../utils/shortId');
const { checkAchievements }         = require('../achievementChecker');

const router = express.Router();

// Resuelve public_id → map row y lo pone en req.map
function resolveMap(req, res, next) {
  const map = db.get(
    `SELECT m.*, u.name as owner_name, u.email as owner_email
     FROM maps m
     JOIN users u ON u.id = m.owner_id
     WHERE m.public_id = ?`,
    [req.params.id]
  );
  if (!map) return res.status(404).json({ message: 'Mapa no encontrado' });
  req.map = map;

  // Encontrar el rol de colaborador del usuario actual para este mapa
  const col = db.get('SELECT role FROM map_collaborators WHERE map_id = ? AND user_id = ?', [map.id, req.user.id]);
  req.userMapRole = col ? col.role : (map.owner_id === req.user.id ? 'owner' : null);

  next();
}

function uniquePublicId() {
  let pid;
  do { pid = makeShortId(); } while (db.get('SELECT id FROM maps WHERE public_id = ?', [pid]));
  return pid;
}

// ── community ────────────────────────────────────────────────────────────────

router.get('/', auth, (_req, res) => {
  const maps = db.all(
    `SELECT m.id, m.public_id, m.title, m.like_count, m.view_count, m.comment_count,
            m.node_count, m.created_at, u.name as author, u.id as owner_id,
            GROUP_CONCAT(mt.tag, ',') as tags_raw
     FROM maps m
     JOIN users u ON u.id = m.owner_id
     LEFT JOIN map_tags mt ON mt.map_id = m.id
     WHERE m.is_public = 1
     GROUP BY m.id
     ORDER BY m.like_count DESC, m.created_at DESC
     LIMIT 50`
  );
  res.json(maps.map(m => ({ ...m, tags: m.tags_raw ? m.tags_raw.split(',') : [] })));
});

router.get('/my', auth, (req, res) => {
  const maps = db.all(
    `SELECT DISTINCT m.id, m.public_id, m.title, m.is_public, m.like_count, m.node_count, m.created_at, m.updated_at, m.owner_id, u.name as owner_name
     FROM maps m
     LEFT JOIN users u ON u.id = m.owner_id
     LEFT JOIN map_collaborators mc ON mc.map_id = m.id
     LEFT JOIN group_members gm ON gm.group_id = m.group_id
     WHERE m.owner_id = ? OR mc.user_id = ? OR (m.group_id IS NOT NULL AND gm.user_id = ?)
     ORDER BY m.updated_at DESC`,
    [req.user.id, req.user.id, req.user.id]
  );
  res.json(maps);
});

router.post('/', auth, (req, res) => {
  const { title, is_public = 0, group_id = null } = req.body;
  if (!title) return res.status(400).json({ message: 'Título requerido' });

  const groupId = group_id && group_id !== 'null' && group_id !== 'undefined' ? parseInt(group_id) : null;

  if (groupId) {
    const gm = db.get(
      "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.user.id]
    );
    if (!gm || !['admin', 'teacher'].includes(gm.role))
      return res.status(403).json({ message: 'Solo el administrador del grupo puede crear mapas en él' });
  }
  const public_id = uniquePublicId();
  const { lastInsertRowid: id } = db.run(
    'INSERT INTO maps (title, owner_id, is_public, public_id, group_id) VALUES (?,?,?,?,?)',
    [title, req.user.id, is_public ? 1 : 0, public_id, groupId]
  );

  awardXP(req.user.id, 50, 'map_created');
  updateStreak(req.user.id);
  checkAchievements(req.user.id);

  res.status(201).json({ id, public_id, title, is_public, owner_id: req.user.id, group_id: groupId });
});

// ── mapa individual ───────────────────────────────────────────────────────────

router.get('/:id', auth, resolveMap, (req, res) => {
  const map = req.map;
  let hasAccess = map.is_public || req.userMapRole !== null;
  if (!hasAccess && map.group_id) {
    const membership = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [map.group_id, req.user.id]);
    if (membership) hasAccess = true;
  }
  // Docente puede ver un mapa si un estudiante lo entregó como tarea en su grupo
  if (!hasAccess) {
    const teacherAccess = db.get(
      `SELECT 1 FROM assignment_submissions sub
       JOIN assignments a ON a.id = sub.assignment_id
       JOIN group_members gm ON gm.group_id = a.group_id
         AND gm.user_id = ? AND gm.role IN ('admin','teacher')
       WHERE sub.map_id = ? AND sub.status = 'submitted'
       LIMIT 1`,
      [req.user.id, map.id]
    );
    if (teacherAccess) hasAccess = true;
  }
  // Miembro de una comunidad puede ver el mapa si fue compartido como post en esa comunidad
  if (!hasAccess) {
    const communityAccess = db.get(
      `SELECT 1 FROM community_posts cp
       JOIN community_members cm ON cm.community_id = cp.community_id
       WHERE cp.map_id = ? AND cm.user_id = ? AND cm.is_blocked = 0
       LIMIT 1`,
      [map.id, req.user.id]
    );
    if (communityAccess) hasAccess = true;
  }
  if (!hasAccess) return res.status(403).json({ message: 'Sin acceso' });

  if (map.owner_id !== req.user.id)
    db.run('UPDATE maps SET view_count = view_count + 1 WHERE id = ?', [map.id]);

  const nodes = db.all('SELECT * FROM map_nodes WHERE map_id = ?', [map.id]);
  const connections = db.all(
    'SELECT id, from_node_id, to_node_id FROM map_connections WHERE map_id = ?', [map.id]
  );
  const tags  = db.all('SELECT tag FROM map_tags WHERE map_id = ?', [map.id]).map(r => r.tag);
  const liked = !!db.get(
    'SELECT id FROM map_likes WHERE map_id = ? AND user_id = ?', [map.id, req.user.id]
  );
  const collaborators = db.all(
    `SELECT mc.user_id, mc.role, u.name, u.email
     FROM map_collaborators mc
     JOIN users u ON u.id = mc.user_id
     WHERE mc.map_id = ?`,
    [map.id]
  );

  let is_group_admin = false;
  let group_public_id = null;
  if (map.group_id) {
    const gm = db.get(
      "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?",
      [map.group_id, req.user.id]
    );
    is_group_admin = !!(gm && ['admin', 'teacher'].includes(gm.role));
    const grp = db.get('SELECT public_id FROM groups WHERE id = ?', [map.group_id]);
    group_public_id = grp?.public_id || null;
  }

  res.json({
    ...map,
    userRole: req.userMapRole || (map.is_public ? 'viewer' : null),
    is_group_admin,
    group_public_id,
    nodes: nodes.map(n => ({
      ...n,
      tags: JSON.parse(n.tags || '[]'),
      stats: JSON.parse(n.stats || '{}'),
      is_sticky: !!n.is_sticky,
    })),
    connections,
    tags,
    liked,
    collaborators,
  });
});

router.put('/:id', auth, resolveMap, (req, res) => {
  const map = req.map;
  let hasAccess = req.userMapRole === 'owner';
  if (!hasAccess && map.group_id) {
    const membership = db.get("SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND role IN ('teacher','admin')", [map.group_id, req.user.id]);
    if (membership) hasAccess = true;
  }
  if (!hasAccess) return res.status(403).json({ message: 'Solo el propietario puede modificar la configuración del mapa' });

  const { title, is_public } = req.body;
  db.run(
    `UPDATE maps SET
       title      = COALESCE(?, title),
       is_public  = COALESCE(?, is_public),
       updated_at = datetime('now')
     WHERE id = ?`,
    [title ?? null, is_public != null ? (is_public ? 1 : 0) : null, req.map.id]
  );
  res.json({ message: 'Mapa actualizado' });
});

router.delete('/:id', auth, resolveMap, (req, res) => {
  const map = req.map;
  let canDelete = req.userMapRole === 'owner';
  if (!canDelete && map.group_id) {
    const membership = db.get("SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND role IN ('teacher','admin')", [map.group_id, req.user.id]);
    if (membership) canDelete = true;
  }
  if (!canDelete) return res.status(403).json({ message: 'Solo el propietario puede eliminar este mapa' });

  db.run('DELETE FROM maps WHERE id = ?', [req.map.id]);
  db.run('UPDATE users SET xp = MAX(0, xp - 50) WHERE id = ?', [req.user.id]);
  res.json({ message: 'Mapa eliminado' });
});

// ── likes ────────────────────────────────────────────────────────────────────

router.post('/:id/like', auth, resolveMap, (req, res) => {
  const { id, like_count } = req.map;
  const existing = db.get(
    'SELECT id FROM map_likes WHERE map_id = ? AND user_id = ?', [id, req.user.id]
  );

  if (existing) {
    db.run('DELETE FROM map_likes WHERE map_id = ? AND user_id = ?', [id, req.user.id]);
    db.run('UPDATE maps SET like_count = MAX(0, like_count - 1) WHERE id = ?', [id]);
    return res.json({ liked: false, like_count: like_count - 1 });
  }

  db.run('INSERT INTO map_likes (map_id, user_id) VALUES (?,?)', [id, req.user.id]);
  db.run('UPDATE maps SET like_count = like_count + 1 WHERE id = ?', [id]);
  checkAchievements(req.map.owner_id);
  res.json({ liked: true, like_count: like_count + 1 });
});

// ── comentarios ───────────────────────────────────────────────────────────────

router.get('/:id/comments', auth, resolveMap, (req, res) => {
  const comments = db.all(
    `SELECT c.id, c.text, c.created_at, u.name as user, u.id as user_id
     FROM map_comments c JOIN users u ON u.id = c.user_id
     WHERE c.map_id = ? ORDER BY c.created_at ASC`,
    [req.map.id]
  );
  res.json(comments);
});

router.post('/:id/comments', auth, resolveMap, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Comentario vacío' });

  db.run('INSERT INTO map_comments (map_id, user_id, text) VALUES (?,?,?)',
    [req.map.id, req.user.id, text.trim()]);
  db.run('UPDATE maps SET comment_count = comment_count + 1 WHERE id = ?', [req.map.id]);

  awardXP(req.user.id, 5, 'comment_added');
  checkAchievements(req.user.id);
  res.status(201).json({ message: 'Comentario agregado' });
});

// ── comentarios por nodo ─────────────────────────────────────────────────────

router.get('/:id/nodes/:nodeId/comments', auth, resolveMap, (req, res) => {
  const comments = db.all(
    `SELECT c.id, c.text, c.created_at, u.name as user, u.id as user_id
     FROM map_comments c JOIN users u ON u.id = c.user_id
     WHERE c.map_id = ? AND c.node_id = ? ORDER BY c.created_at ASC`,
    [req.map.id, req.params.nodeId]
  );
  res.json(comments);
});

router.post('/:id/nodes/:nodeId/comments', auth, resolveMap, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Comentario vacío' });

  db.run(
    'INSERT INTO map_comments (map_id, user_id, node_id, text) VALUES (?,?,?,?)',
    [req.map.id, req.user.id, req.params.nodeId, text.trim()]
  );
  awardXP(req.user.id, 5, 'node_comment_added');
  checkAchievements(req.user.id);
  res.status(201).json({ message: 'Comentario agregado al nodo' });
});

// ── nodos ────────────────────────────────────────────────────────────────────

router.post('/:id/nodes', auth, resolveMap, (req, res) => {
  const map = req.map;
  let hasAccess = req.userMapRole === 'owner' || req.userMapRole === 'editor';
  if (!hasAccess && map.group_id) {
    const membership = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [map.group_id, req.user.id]);
    if (membership) hasAccess = true;
  }
  if (!hasAccess) return res.status(403).json({ message: 'No tienes permisos de edición en este mapa' });

  const { nodes = [], connections = [] } = req.body;
  const mapId = req.map.id;

  db.run('DELETE FROM map_nodes WHERE map_id = ?', [mapId]);

  const idMap = {};
  for (const n of nodes) {
    const { lastInsertRowid } = db.run(
      `INSERT INTO map_nodes (map_id,x,y,label,category,description,tags,icon,image,stats,is_sticky,color)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        mapId, n.x, n.y, n.label, n.category || 'concept',
        n.description || null,
        JSON.stringify(n.tags || []),
        n.icon || null, n.image || null,
        JSON.stringify(n.stats || {}),
        n.is_sticky ? 1 : 0,
        n.color || null,
      ]
    );
    idMap[n.id] = lastInsertRowid;
  }

  for (const c of connections) {
    const fromId = idMap[c.from_node_id];
    const toId   = idMap[c.to_node_id];
    if (fromId && toId) {
      db.run(
        'INSERT OR IGNORE INTO map_connections (map_id, from_node_id, to_node_id) VALUES (?,?,?)',
        [mapId, fromId, toId]
      );
    }
  }

  db.run(
    `UPDATE maps SET node_count = ?, updated_at = datetime('now') WHERE id = ?`,
    [nodes.length, mapId]
  );

  res.json({ message: 'Nodos guardados', count: nodes.length });
});

router.put('/:id/nodes/:nodeId/note', auth, (req, res) => {
  const { content = '' } = req.body;
  db.run(
    `INSERT INTO node_notes (node_id, user_id, content, updated_at)
     VALUES (?,?,?,datetime('now'))
     ON CONFLICT(node_id, user_id) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at`,
    [req.params.nodeId, req.user.id, content]
  );
  res.json({ message: 'Nota guardada' });
});

router.get('/:id/nodes/:nodeId/note', auth, (req, res) => {
  const note = db.get(
    'SELECT content FROM node_notes WHERE node_id = ? AND user_id = ?',
    [req.params.nodeId, req.user.id]
  );
  res.json({ content: note?.content ?? '' });
});

// ── Tutor IA y Quizzes ────────────────────────────────────────────────────────
router.post('/:id/consult-ai', auth, resolveMap, async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return res.status(400).json({ message: 'Consulta vacía' });

  const map = req.map;
  let hasAccess = map.is_public || req.userMapRole !== null;
  if (!hasAccess && map.group_id) {
    const membership = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [map.group_id, req.user.id]);
    if (membership) hasAccess = true;
  }
  if (!hasAccess) return res.status(403).json({ message: 'Sin acceso' });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ message: 'GROQ_API_KEY no configurada en el servidor' });
  }

  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const nodes = db.all('SELECT label, description FROM map_nodes WHERE map_id = ?', [map.id]);
  const nodesContext = nodes.map(n => `- ${n.label}: ${n.description || ''}`).join('\n');

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres un tutor de aprendizaje de mapas conceptuales. Ayudas a expandir conceptos de manera didáctica. Planteas preguntas, explicas con ejemplos y sugieres nuevos conceptos para añadir.',
        },
        {
          role: 'user',
          content: `El usuario está estudiando el mapa conceptual titulado "${map.title}".
Conceptos actuales del mapa:
${nodesContext}

Consulta del usuario: "${query}"

Responde en formato JSON válido con la siguiente estructura exacta:
{
  "explanation": "Tu explicación didáctica y amigable (máximo 150 palabras), que responda su duda, sugiera qué aprender, plantee preguntas guía y ejemplos.",
  "suggested_nodes": [
    { "label": "Concepto Sugerido", "description": "Descripción didáctica breve para el nuevo nodo (1-2 frases)." }
  ],
  "suggested_connections": [
    { "from": "Nombre de un concepto existente del mapa o el nuevo concepto sugerido", "to": "Nombre de otro concepto existente del mapa o el nuevo concepto sugerido" }
  ]
}

Reglas:
- Sugiere entre 1 y 3 nuevos conceptos relevantes en "suggested_nodes".
- Las conexiones en "suggested_connections" deben usar los "labels" exactos de los conceptos.
- Devuelve ÚNICAMENTE el JSON sin formato Markdown adicional.`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1500,
    });

    const responseData = JSON.parse(completion.choices[0].message.content);
    res.json(responseData);
  } catch (err) {
    console.error('Error Groq consult-ai:', err.message);
    res.status(500).json({ message: 'Error al procesar la consulta con la IA' });
  }
});

router.post('/:id/quiz/generate', auth, resolveMap, async (req, res) => {
  const map = req.map;
  let hasAccess = map.is_public || req.userMapRole !== null;
  if (!hasAccess && map.group_id) {
    const membership = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [map.group_id, req.user.id]);
    if (membership) hasAccess = true;
  }
  if (!hasAccess) return res.status(403).json({ message: 'Sin acceso' });

  // Si el mapa pertenece a un grupo, solo el admin puede generar (no tomar) el quiz
  if (map.group_id) {
    const cached = db.get('SELECT questions_json FROM map_quizzes WHERE map_id = ?', [map.id]);
    if (!cached) {
      const gm = db.get(
        "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?",
        [map.group_id, req.user.id]
      );
      if (!gm || !['admin', 'teacher'].includes(gm.role))
        return res.status(403).json({ message: 'Solo el administrador del grupo puede generar el quiz' });
    }
    // Si ya existe caché, cualquier miembro puede obtenerlo (para tomarlo)
    if (cached) return res.json(JSON.parse(cached.questions_json));
  } else {
    // Mapa personal: devolver caché si existe
    const cached = db.get('SELECT questions_json FROM map_quizzes WHERE map_id = ?', [map.id]);
    if (cached) return res.json(JSON.parse(cached.questions_json));
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ message: 'GROQ_API_KEY no configurada en el servidor' });
  }

  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const nodes = db.all('SELECT label, description FROM map_nodes WHERE map_id = ?', [map.id]);
  if (nodes.length < 2) {
    return res.status(400).json({ message: 'El mapa debe tener al menos 2 conceptos para generar un quiz' });
  }
  const nodesContext = nodes.map(n => `- ${n.label}: ${n.description || ''}`).join('\n');

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres un profesor experto diseñando cuestionarios didácticos de opción múltiple. Generas preguntas que evalúan la comprensión profunda.',
        },
        {
          role: 'user',
          content: `Genera un cuestionario de opción múltiple de 4 preguntas basado en este mapa conceptual: "${map.title}".
Conceptos y descripciones del mapa:
${nodesContext}

Devuelve ÚNICAMENTE un JSON válido con este formato:
{
  "questions": [
    {
      "id": 1,
      "question": "¿Cuál es la pregunta?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answerIndex": 0,
      "explanation": "Explicación didáctica detallada de por qué esa opción es la correcta y cómo se relaciona con el tema."
    }
  ]
}
Nota: "answerIndex" es el índice (0 a 3) de la opción correcta.
Devuelve ÚNICAMENTE el JSON sin envoltorios markdown.`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const quizData = JSON.parse(completion.choices[0].message.content);

    // Guardar para que todos los estudiantes reciban las mismas preguntas
    db.run(
      'INSERT INTO map_quizzes (map_id, questions_json) VALUES (?, ?)',
      [map.id, JSON.stringify(quizData)]
    );

    res.json(quizData);
  } catch (err) {
    console.error('Error Groq quiz:', err.message);
    res.status(500).json({ message: 'Error al generar el quiz con la IA' });
  }
});

router.post('/:id/quiz/submit', auth, resolveMap, (req, res) => {
  const { score, total_questions, correct_answers } = req.body;
  if (score == null || !total_questions) {
    return res.status(400).json({ message: 'Puntaje y cantidad de preguntas requeridos' });
  }

  const map = req.map;
  db.run(
    'INSERT INTO quiz_scores (user_id, map_id, score, total_questions, correct_answers) VALUES (?,?,?,?,?)',
    [req.user.id, map.id, score, total_questions, correct_answers]
  );

  const xpReward = Math.round(score * 2.5);
  awardXP(req.user.id, xpReward, 'quiz_completed');

  res.status(201).json({
    message: 'Resultado guardado con éxito',
    score,
    xpReward
  });
});

// ── Transcripción de audio ────────────────────────────────────────────────────

const multerAudio = require('multer')({ storage: require('multer').memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const AUDIO_MIMES = ['audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg','audio/flac','audio/x-m4a','video/webm','video/mp4'];

router.post('/transcribe', auth, multerAudio.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo de audio' });
  if (!AUDIO_MIMES.includes(req.file.mimetype) && !req.file.originalname.match(/\.(mp3|mp4|wav|webm|ogg|flac|m4a)$/i))
    return res.status(400).json({ message: 'Formato de audio no soportado' });
  if (!process.env.GROQ_API_KEY)
    return res.status(503).json({ message: 'GROQ_API_KEY no configurada en el servidor' });

  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const audioFile = new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'text',
      language: 'es',
    });

    res.json({ text: transcription });
  } catch (err) {
    console.error('Error transcripción Groq:', err.message);
    res.status(500).json({ message: 'Error al transcribir el audio' });
  }
});

// ── Rutas de Colaboración de Mapas ──────────────────────────────────────────

router.post('/join', auth, (req, res) => {
  const { invite_code } = req.body;
  if (!invite_code) {
    return res.status(400).json({ message: 'Código de invitación requerido' });
  }

  const code = invite_code.trim().toUpperCase();

  const map = db.get('SELECT * FROM maps WHERE invite_code = ?', [code]);
  if (!map) {
    return res.status(404).json({ message: 'Código de invitación inválido' });
  }

  if (map.owner_id === req.user.id) {
    return res.json({ message: 'Ya eres el propietario de este mapa', public_id: map.public_id });
  }

  db.run(
    'INSERT OR IGNORE INTO map_collaborators (map_id, user_id, role) VALUES (?,?,?)',
    [map.id, req.user.id, 'editor']
  );

  res.json({ message: 'Te has unido al mapa conceptual con éxito', public_id: map.public_id });
});

router.get('/:id/sharing', auth, resolveMap, (req, res) => {
  const map = req.map;
  let hasAccess = req.userMapRole !== null;
  if (!hasAccess && map.group_id) {
    const membership = db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [map.group_id, req.user.id]);
    if (membership) hasAccess = true;
  }
  if (!hasAccess) {
    return res.status(403).json({ message: 'Sin acceso a los colaboradores de este mapa' });
  }

  const collaborators = db.all(
    `SELECT mc.user_id, mc.role, u.name, u.email
     FROM map_collaborators mc
     JOIN users u ON u.id = mc.user_id
     WHERE mc.map_id = ?`,
    [map.id]
  );

  res.json({
    is_public: map.is_public === 1,
    invite_code: req.userMapRole === 'owner' || req.userMapRole === 'editor' ? map.invite_code : null,
    collaborators,
  });
});

router.post('/:id/sharing/invite-code', auth, resolveMap, (req, res) => {
  const map = req.map;
  if (req.userMapRole !== 'owner') {
    return res.status(403).json({ message: 'Solo el propietario puede generar códigos de invitación' });
  }

  function makeCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  let code = makeCode();
  while (db.get('SELECT id FROM maps WHERE invite_code = ?', [code])) {
    code = makeCode();
  }

  db.run('UPDATE maps SET invite_code = ? WHERE id = ?', [code, map.id]);
  res.json({ invite_code: code });
});

router.post('/:id/collaborators', auth, resolveMap, (req, res) => {
  const map = req.map;
  if (req.userMapRole !== 'owner') {
    return res.status(403).json({ message: 'Solo el propietario puede agregar colaboradores' });
  }

  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ message: 'Email y rol son requeridos' });
  }
  if (!['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  const targetUser = db.get('SELECT id, name FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!targetUser) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  if (targetUser.id === map.owner_id) {
    return res.status(400).json({ message: 'El propietario del mapa ya tiene acceso completo' });
  }

  db.run(
    `INSERT INTO map_collaborators (map_id, user_id, role) VALUES (?,?,?)
     ON CONFLICT(map_id, user_id) DO UPDATE SET role=excluded.role`,
    [map.id, targetUser.id, role]
  );

  res.status(201).json({ message: `Usuario ${targetUser.name} agregado como colaborador`, user: targetUser });
});

router.put('/:id/collaborators/:userId', auth, resolveMap, (req, res) => {
  const map = req.map;
  if (req.userMapRole !== 'owner') {
    return res.status(403).json({ message: 'Solo el propietario puede cambiar roles' });
  }

  const { role } = req.body;
  if (!role || !['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  db.run(
    'UPDATE map_collaborators SET role = ? WHERE map_id = ? AND user_id = ?',
    [role, map.id, req.params.userId]
  );

  res.json({ message: 'Rol de colaborador actualizado' });
});

router.delete('/:id/collaborators/:userId', auth, resolveMap, (req, res) => {
  const map = req.map;
  if (req.userMapRole !== 'owner') {
    return res.status(403).json({ message: 'Solo el propietario puede remover colaboradores' });
  }

  db.run(
    'DELETE FROM map_collaborators WHERE map_id = ? AND user_id = ?',
    [map.id, req.params.userId]
  );

  res.json({ message: 'Colaborador removido con éxito' });
});

module.exports = router;
