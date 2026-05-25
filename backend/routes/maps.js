const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// ── helpers ─────────────────────────────────────────────────────────────────

function awardXP(userId, xp, reason) {
  const user = db.get('SELECT level, xp, xp_to_next, total_points FROM users WHERE id = ?', [userId]);
  if (!user) return;

  let newXp     = user.xp + xp;
  let level     = user.level;
  let xpToNext  = user.xp_to_next;

  while (newXp >= xpToNext) {
    newXp   -= xpToNext;
    level   += 1;
    xpToNext = Math.round(xpToNext * 1.3);
  }

  db.run(
    'UPDATE users SET xp=?, level=?, xp_to_next=?, total_points=total_points+? WHERE id=?',
    [newXp, level, xpToNext, xp, userId]
  );
  db.run(
    'INSERT INTO point_transactions (user_id, points, reason) VALUES (?,?,?)',
    [userId, xp, reason]
  );
}

function updateStreak(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const user  = db.get('SELECT streak, last_activity_date FROM users WHERE id = ?', [userId]);
  if (!user) return;

  const last = user.last_activity_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = last === today ? user.streak : last === yesterday ? user.streak + 1 : 1;
  db.run('UPDATE users SET streak=?, last_activity_date=? WHERE id=?', [streak, today, userId]);
}

// ── community ────────────────────────────────────────────────────────────────

// GET /api/maps  — mapas públicos (comunidad)
router.get('/', auth, (_req, res) => {
  const maps = db.all(
    `SELECT m.id, m.title, m.like_count, m.view_count, m.comment_count, m.node_count,
            m.created_at, u.name as author, u.id as owner_id,
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

// GET /api/maps/my — mapas del usuario autenticado
router.get('/my', auth, (req, res) => {
  const maps = db.all(
    `SELECT id, title, is_public, like_count, node_count, created_at, updated_at
     FROM maps WHERE owner_id = ? ORDER BY updated_at DESC`,
    [req.user.id]
  );
  res.json(maps);
});

// POST /api/maps — crear mapa
router.post('/', auth, (req, res) => {
  const { title, is_public = 0 } = req.body;
  if (!title) return res.status(400).json({ message: 'Título requerido' });

  const { lastInsertRowid: id } = db.run(
    'INSERT INTO maps (title, owner_id, is_public) VALUES (?,?,?)',
    [title, req.user.id, is_public ? 1 : 0]
  );

  awardXP(req.user.id, 50, 'map_created');
  updateStreak(req.user.id);

  res.status(201).json({ id, title, is_public, owner_id: req.user.id });
});

// GET /api/maps/:id — mapa completo con nodos y conexiones
router.get('/:id', auth, (req, res) => {
  const map = db.get('SELECT * FROM maps WHERE id = ?', [req.params.id]);
  if (!map) return res.status(404).json({ message: 'Mapa no encontrado' });
  if (!map.is_public && map.owner_id !== req.user.id)
    return res.status(403).json({ message: 'Sin acceso' });

  // incrementar vistas si no es el dueño
  if (map.owner_id !== req.user.id)
    db.run('UPDATE maps SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);

  const nodes = db.all('SELECT * FROM map_nodes WHERE map_id = ?', [req.params.id]);
  const connections = db.all(
    'SELECT id, from_node_id, to_node_id FROM map_connections WHERE map_id = ?',
    [req.params.id]
  );
  const tags = db.all('SELECT tag FROM map_tags WHERE map_id = ?', [req.params.id]).map(r => r.tag);

  const liked = !!db.get(
    'SELECT id FROM map_likes WHERE map_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );

  res.json({
    ...map,
    nodes: nodes.map(n => ({
      ...n,
      tags: JSON.parse(n.tags || '[]'),
      stats: JSON.parse(n.stats || '{}'),
      is_sticky: !!n.is_sticky,
    })),
    connections,
    tags,
    liked,
  });
});

// PUT /api/maps/:id — actualizar título / visibilidad
router.put('/:id', auth, (req, res) => {
  const map = db.get('SELECT id, owner_id FROM maps WHERE id = ?', [req.params.id]);
  if (!map) return res.status(404).json({ message: 'Mapa no encontrado' });
  if (map.owner_id !== req.user.id) return res.status(403).json({ message: 'Sin acceso' });

  const { title, is_public } = req.body;
  db.run(
    `UPDATE maps SET
       title     = COALESCE(?, title),
       is_public = COALESCE(?, is_public),
       updated_at = datetime('now')
     WHERE id = ?`,
    [title ?? null, is_public != null ? (is_public ? 1 : 0) : null, req.params.id]
  );
  res.json({ message: 'Mapa actualizado' });
});

// DELETE /api/maps/:id
router.delete('/:id', auth, (req, res) => {
  const map = db.get('SELECT owner_id FROM maps WHERE id = ?', [req.params.id]);
  if (!map) return res.status(404).json({ message: 'Mapa no encontrado' });
  if (map.owner_id !== req.user.id) return res.status(403).json({ message: 'Sin acceso' });

  db.run('DELETE FROM maps WHERE id = ?', [req.params.id]);
  db.run('UPDATE users SET xp = MAX(0, xp - 50) WHERE id = ?', [req.user.id]);
  res.json({ message: 'Mapa eliminado' });
});

// ── likes ────────────────────────────────────────────────────────────────────

router.post('/:id/like', auth, (req, res) => {
  const map = db.get('SELECT id, like_count FROM maps WHERE id = ?', [req.params.id]);
  if (!map) return res.status(404).json({ message: 'Mapa no encontrado' });

  const existing = db.get(
    'SELECT id FROM map_likes WHERE map_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );

  if (existing) {
    db.run('DELETE FROM map_likes WHERE map_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    db.run('UPDATE maps SET like_count = MAX(0, like_count - 1) WHERE id = ?', [req.params.id]);
    return res.json({ liked: false, like_count: map.like_count - 1 });
  }

  db.run('INSERT INTO map_likes (map_id, user_id) VALUES (?,?)', [req.params.id, req.user.id]);
  db.run('UPDATE maps SET like_count = like_count + 1 WHERE id = ?', [req.params.id]);
  res.json({ liked: true, like_count: map.like_count + 1 });
});

// ── comentarios ───────────────────────────────────────────────────────────────

router.get('/:id/comments', auth, (req, res) => {
  const comments = db.all(
    `SELECT c.id, c.text, c.created_at, u.name as user, u.id as user_id
     FROM map_comments c JOIN users u ON u.id = c.user_id
     WHERE c.map_id = ? ORDER BY c.created_at ASC`,
    [req.params.id]
  );
  res.json(comments);
});

router.post('/:id/comments', auth, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Comentario vacío' });

  const map = db.get('SELECT id FROM maps WHERE id = ?', [req.params.id]);
  if (!map) return res.status(404).json({ message: 'Mapa no encontrado' });

  db.run('INSERT INTO map_comments (map_id, user_id, text) VALUES (?,?,?)',
    [req.params.id, req.user.id, text.trim()]);
  db.run('UPDATE maps SET comment_count = comment_count + 1 WHERE id = ?', [req.params.id]);

  awardXP(req.user.id, 5, 'comment_added');
  res.status(201).json({ message: 'Comentario agregado' });
});

// ── nodos ────────────────────────────────────────────────────────────────────

// POST /api/maps/:id/nodes — guardar todos los nodos (reemplaza)
router.post('/:id/nodes', auth, (req, res) => {
  const map = db.get('SELECT owner_id FROM maps WHERE id = ?', [req.params.id]);
  if (!map) return res.status(404).json({ message: 'Mapa no encontrado' });
  if (map.owner_id !== req.user.id) return res.status(403).json({ message: 'Sin acceso' });

  const { nodes = [], connections = [] } = req.body;

  db.run('DELETE FROM map_nodes WHERE map_id = ?', [req.params.id]);

  const idMap = {};
  for (const n of nodes) {
    const { lastInsertRowid } = db.run(
      `INSERT INTO map_nodes (map_id,x,y,label,category,description,tags,icon,image,stats,is_sticky,color)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.params.id, n.x, n.y, n.label, n.category || 'concept',
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
        [req.params.id, fromId, toId]
      );
    }
  }

  db.run(
    `UPDATE maps SET node_count = ?, updated_at = datetime('now') WHERE id = ?`,
    [nodes.length, req.params.id]
  );

  res.json({ message: 'Nodos guardados', count: nodes.length });
});

// PUT /api/maps/:id/nodes/:nodeId/note — nota personal
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

// GET /api/maps/:id/nodes/:nodeId/note
router.get('/:id/nodes/:nodeId/note', auth, (req, res) => {
  const note = db.get(
    'SELECT content FROM node_notes WHERE node_id = ? AND user_id = ?',
    [req.params.nodeId, req.user.id]
  );
  res.json({ content: note?.content ?? '' });
});

module.exports = router;
