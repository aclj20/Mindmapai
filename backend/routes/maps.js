const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');
const { awardXP, updateStreak } = require('../utils/gamification');
const { makeShortId }           = require('../utils/shortId');

const router = express.Router();

// Resuelve public_id → map row y lo pone en req.map
function resolveMap(req, res, next) {
  const map = db.get('SELECT * FROM maps WHERE public_id = ?', [req.params.id]);
  if (!map) return res.status(404).json({ message: 'Mapa no encontrado' });
  req.map = map;
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
    `SELECT id, public_id, title, is_public, like_count, node_count, created_at, updated_at
     FROM maps WHERE owner_id = ? ORDER BY updated_at DESC`,
    [req.user.id]
  );
  res.json(maps);
});

router.post('/', auth, (req, res) => {
  const { title, is_public = 0 } = req.body;
  if (!title) return res.status(400).json({ message: 'Título requerido' });

  const public_id = uniquePublicId();
  const { lastInsertRowid: id } = db.run(
    'INSERT INTO maps (title, owner_id, is_public, public_id) VALUES (?,?,?,?)',
    [title, req.user.id, is_public ? 1 : 0, public_id]
  );

  awardXP(req.user.id, 50, 'map_created');
  updateStreak(req.user.id);

  res.status(201).json({ id, public_id, title, is_public, owner_id: req.user.id });
});

// ── mapa individual ───────────────────────────────────────────────────────────

router.get('/:id', auth, resolveMap, (req, res) => {
  const map = req.map;
  if (!map.is_public && map.owner_id !== req.user.id)
    return res.status(403).json({ message: 'Sin acceso' });

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

router.put('/:id', auth, resolveMap, (req, res) => {
  if (req.map.owner_id !== req.user.id) return res.status(403).json({ message: 'Sin acceso' });

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
  if (req.map.owner_id !== req.user.id) return res.status(403).json({ message: 'Sin acceso' });

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
  res.status(201).json({ message: 'Comentario agregado' });
});

// ── nodos ────────────────────────────────────────────────────────────────────

router.post('/:id/nodes', auth, resolveMap, (req, res) => {
  if (req.map.owner_id !== req.user.id) return res.status(403).json({ message: 'Sin acceso' });

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

module.exports = router;
