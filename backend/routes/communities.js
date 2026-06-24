const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { makeShortId } = require('../utils/shortId');

const router = express.Router();

const RESERVED_SLUGS = new Set(['posts', 'comments', 'my', 'popular', 'new', 'top', 'create', 'search', 'admin']);

function makeSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'comunidad';
}

function uniqueSlug(name) {
  let base = makeSlug(name);
  let slug = base;
  let n = 2;
  while (RESERVED_SLUGS.has(slug) || db.get('SELECT id FROM communities WHERE slug = ?', [slug])) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function timeAgo(iso) {
  return iso; // frontend makes it human-readable
}

// ── Rutas estáticas PRIMERO (antes de /:slug) ────────────────────────────────

// GET /api/communities/posts/:postId — detalle de post
router.get('/posts/:postId', auth, (req, res) => {
  const post = db.get(
    `SELECT p.*, c.slug as community_slug, c.name as community_name, c.icon_url as community_icon,
            u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
            m.title as map_title, m.public_id as map_public_id, m.node_count as map_node_count,
            (SELECT 1 FROM community_post_votes WHERE post_id = p.id AND user_id = ?) as my_vote
     FROM community_posts p
     JOIN communities c ON c.id = p.community_id
     JOIN users u ON u.id = p.author_id
     LEFT JOIN maps m ON m.id = p.map_id
     WHERE p.public_id = ?`,
    [req.user.id, req.params.postId]
  );
  if (!post) return res.status(404).json({ message: 'Post no encontrado' });
  res.json(post);
});

// POST /api/communities/posts/:postId/vote — toggle upvote
router.post('/posts/:postId/vote', auth, (req, res) => {
  const post = db.get('SELECT id, upvote_count FROM community_posts WHERE public_id = ?', [req.params.postId]);
  if (!post) return res.status(404).json({ message: 'Post no encontrado' });
  const existing = db.get('SELECT id FROM community_post_votes WHERE post_id = ? AND user_id = ?', [post.id, req.user.id]);
  if (existing) {
    db.run('DELETE FROM community_post_votes WHERE post_id = ? AND user_id = ?', [post.id, req.user.id]);
    db.run('UPDATE community_posts SET upvote_count = MAX(0, upvote_count - 1) WHERE id = ?', [post.id]);
    return res.json({ voted: false, upvote_count: Math.max(0, post.upvote_count - 1) });
  }
  db.run('INSERT INTO community_post_votes (post_id, user_id) VALUES (?,?)', [post.id, req.user.id]);
  db.run('UPDATE community_posts SET upvote_count = upvote_count + 1 WHERE id = ?', [post.id]);
  res.json({ voted: true, upvote_count: post.upvote_count + 1 });
});

// GET /api/communities/posts/:postId/comments
router.get('/posts/:postId/comments', auth, (req, res) => {
  const post = db.get('SELECT id FROM community_posts WHERE public_id = ?', [req.params.postId]);
  if (!post) return res.status(404).json({ message: 'Post no encontrado' });
  const comments = db.all(
    `SELECT cc.id, cc.content, cc.parent_id, cc.created_at,
            u.id as author_id, u.name as author_name, u.avatar_url as author_avatar
     FROM community_comments cc
     JOIN users u ON u.id = cc.author_id
     WHERE cc.post_id = ? ORDER BY cc.created_at ASC`,
    [post.id]
  );
  res.json(comments);
});

// POST /api/communities/posts/:postId/comments
router.post('/posts/:postId/comments', auth, (req, res) => {
  const post = db.get('SELECT id, community_id FROM community_posts WHERE public_id = ?', [req.params.postId]);
  if (!post) return res.status(404).json({ message: 'Post no encontrado' });
  const mem = db.get('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?', [post.community_id, req.user.id]);
  if (!mem) return res.status(403).json({ message: 'Únete a la comunidad para comentar' });
  const { content, parent_id } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'El comentario no puede estar vacío' });
  const { lastInsertRowid: cid } = db.run(
    'INSERT INTO community_comments (post_id, author_id, content, parent_id) VALUES (?,?,?,?)',
    [post.id, req.user.id, content.trim(), parent_id || null]
  );
  db.run('UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ?', [post.id]);
  const u = db.get('SELECT name, avatar_url FROM users WHERE id = ?', [req.user.id]);
  res.status(201).json({ id: cid, content: content.trim(), parent_id: parent_id || null,
    created_at: new Date().toISOString(), author_id: req.user.id, author_name: u.name, author_avatar: u.avatar_url });
});

// DELETE /api/communities/posts/:postId
router.delete('/posts/:postId', auth, (req, res) => {
  const post = db.get(
    `SELECT p.*, c.creator_id FROM community_posts p JOIN communities c ON c.id = p.community_id WHERE p.public_id = ?`,
    [req.params.postId]
  );
  if (!post) return res.status(404).json({ message: 'Post no encontrado' });
  const mem = db.get('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?', [post.community_id, req.user.id]);
  if (post.author_id !== req.user.id && !(mem && ['admin', 'mod'].includes(mem.role)))
    return res.status(403).json({ message: 'Sin permiso' });
  db.run('DELETE FROM community_posts WHERE id = ?', [post.id]);
  db.run('UPDATE communities SET post_count = MAX(0, post_count - 1) WHERE id = ?', [post.community_id]);
  res.json({ message: 'Post eliminado' });
});

// DELETE /api/communities/comments/:commentId
router.delete('/comments/:commentId', auth, (req, res) => {
  const comment = db.get(
    `SELECT cc.*, p.community_id FROM community_comments cc JOIN community_posts p ON p.id = cc.post_id WHERE cc.id = ?`,
    [req.params.commentId]
  );
  if (!comment) return res.status(404).json({ message: 'Comentario no encontrado' });
  const mem = db.get('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?', [comment.community_id, req.user.id]);
  if (comment.author_id !== req.user.id && !(mem && ['admin', 'mod'].includes(mem.role)))
    return res.status(403).json({ message: 'Sin permiso' });
  db.run('DELETE FROM community_comments WHERE id = ?', [comment.id]);
  db.run('UPDATE community_posts SET comment_count = MAX(0, comment_count - 1) WHERE id = ?', [comment.post_id]);
  res.json({ message: 'Comentario eliminado' });
});

// ── Listado y creación ────────────────────────────────────────────────────────

// GET /api/communities
router.get('/', auth, (req, res) => {
  const { q } = req.query;
  let sql = `SELECT c.id, c.name, c.slug, c.description, c.icon_url, c.banner_url,
             c.member_count, c.post_count, c.created_at, u.name as creator_name,
             (SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = ?) as is_member,
             (SELECT role FROM community_members WHERE community_id = c.id AND user_id = ?) as my_role
             FROM communities c JOIN users u ON u.id = c.creator_id`;
  const params = [req.user.id, req.user.id];
  if (q) { sql += ` WHERE c.name LIKE ? OR c.description LIKE ?`; params.push(`%${q}%`, `%${q}%`); }
  sql += ` ORDER BY c.member_count DESC, c.created_at DESC LIMIT 60`;
  res.json(db.all(sql, params));
});

// POST /api/communities — crear comunidad
router.post('/', auth, (req, res) => {
  const { name, description, is_private = 0 } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Nombre requerido' });
  const slug = uniqueSlug(name.trim());
  const { lastInsertRowid: id } = db.run(
    'INSERT INTO communities (name, slug, description, creator_id, is_private) VALUES (?,?,?,?,?)',
    [name.trim(), slug, description || null, req.user.id, is_private ? 1 : 0]
  );
  db.run("INSERT INTO community_members (community_id, user_id, role) VALUES (?,?,'admin')", [id, req.user.id]);
  res.status(201).json({ id, slug, name: name.trim(), description, member_count: 1, post_count: 0 });
});

// ── Rutas dinámicas /:slug ────────────────────────────────────────────────────

// GET /api/communities/:slug
router.get('/:slug', auth, (req, res) => {
  const c = db.get(
    `SELECT c.*, u.name as creator_name,
            (SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = ?) as is_member,
            (SELECT role FROM community_members WHERE community_id = c.id AND user_id = ?) as my_role
     FROM communities c JOIN users u ON u.id = c.creator_id WHERE c.slug = ?`,
    [req.user.id, req.user.id, req.params.slug]
  );
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  res.json(c);
});

// PUT /api/communities/:slug — editar (mod/admin)
router.put('/:slug', auth, (req, res) => {
  const c = db.get('SELECT id FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  const mem = db.get('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.user.id]);
  if (!mem || !['admin', 'mod'].includes(mem.role)) return res.status(403).json({ message: 'Sin permiso' });
  const { name, description, icon_url, banner_url, is_private } = req.body;
  db.run(
    `UPDATE communities SET
       name = COALESCE(NULLIF(?, ''), name),
       description = ?,
       icon_url = ?,
       banner_url = ?,
       is_private = COALESCE(?, is_private)
     WHERE id = ?`,
    [name || null, description ?? null, icon_url ?? null, banner_url ?? null,
     is_private !== undefined ? (is_private ? 1 : 0) : null, c.id]
  );
  const updated = db.get(
    `SELECT c.*, (SELECT role FROM community_members WHERE community_id = c.id AND user_id = ?) as my_role
     FROM communities c WHERE c.id = ?`,
    [req.user.id, c.id]
  );
  res.json(updated);
});

// POST /api/communities/:slug/join
router.post('/:slug/join', auth, (req, res) => {
  const c = db.get('SELECT id, name FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  if (db.get('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.user.id]))
    return res.status(409).json({ message: 'Ya eres miembro' });
  db.run("INSERT INTO community_members (community_id, user_id, role) VALUES (?,?,'member')", [c.id, req.user.id]);
  db.run('UPDATE communities SET member_count = member_count + 1 WHERE id = ?', [c.id]);
  res.json({ message: `Te uniste a ${c.name}` });
});

// DELETE /api/communities/:slug/leave
router.delete('/:slug/leave', auth, (req, res) => {
  const c = db.get('SELECT id, creator_id FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  if (c.creator_id === req.user.id) return res.status(400).json({ message: 'El creador no puede abandonar la comunidad' });
  db.run('DELETE FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.user.id]);
  db.run('UPDATE communities SET member_count = MAX(1, member_count - 1) WHERE id = ?', [c.id]);
  res.json({ message: 'Saliste de la comunidad' });
});

// GET /api/communities/:slug/posts
router.get('/:slug/posts', auth, (req, res) => {
  const c = db.get('SELECT id FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  const sort = req.query.sort === 'top' ? 'p.upvote_count DESC, p.created_at DESC' : 'p.created_at DESC';
  const posts = db.all(
    `SELECT p.id, p.public_id, p.title, p.content, p.post_type, p.link_url,
            p.attachment_url, p.attachment_name, p.attachment_size,
            p.upvote_count, p.comment_count, p.created_at,
            u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
            m.title as map_title, m.public_id as map_public_id, m.node_count as map_node_count,
            (SELECT 1 FROM community_post_votes WHERE post_id = p.id AND user_id = ?) as my_vote
     FROM community_posts p
     JOIN users u ON u.id = p.author_id
     LEFT JOIN maps m ON m.id = p.map_id
     WHERE p.community_id = ?
     ORDER BY ${sort} LIMIT 50`,
    [req.user.id, c.id]
  );
  res.json(posts);
});

// POST /api/communities/:slug/posts — crear post
router.post('/:slug/posts', auth, (req, res) => {
  const c = db.get('SELECT id FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  const mem = db.get('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.user.id]);
  if (!mem) return res.status(403).json({ message: 'Únete a la comunidad para publicar' });
  const { title, content, post_type = 'discussion', map_id, link_url, attachment_url, attachment_name, attachment_size } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: 'Título requerido' });
  let pid;
  do { pid = makeShortId(); } while (db.get('SELECT id FROM community_posts WHERE public_id = ?', [pid]));
  const { lastInsertRowid: postId } = db.run(
    `INSERT INTO community_posts (community_id, author_id, title, content, post_type, map_id, link_url, public_id, attachment_url, attachment_name, attachment_size)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [c.id, req.user.id, title.trim(), content || null, post_type, map_id || null, link_url || null, pid,
     attachment_url || null, attachment_name || null, attachment_size || null]
  );
  db.run('UPDATE communities SET post_count = post_count + 1 WHERE id = ?', [c.id]);
  const u = db.get('SELECT name, avatar_url FROM users WHERE id = ?', [req.user.id]);
  res.status(201).json({ id: postId, public_id: pid, title: title.trim(), content, post_type,
    link_url, attachment_url: attachment_url || null, attachment_name: attachment_name || null, attachment_size: attachment_size || null,
    upvote_count: 0, comment_count: 0, my_vote: 0,
    created_at: new Date().toISOString(), author_id: req.user.id, author_name: u.name, author_avatar: u.avatar_url });
});

// GET /api/communities/:slug/members  (?all=1 para gestión — sin límite, incluye is_blocked)
router.get('/:slug/members', auth, (req, res) => {
  const c = db.get('SELECT id, creator_id FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  const myMem = db.get('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.user.id]);
  const isManager = myMem && ['admin', 'mod'].includes(myMem.role);
  const limit = (req.query.all === '1' && isManager) ? '' : 'LIMIT 30';
  const members = db.all(
    `SELECT u.id, u.name, u.avatar_url, u.level, cm.role, cm.joined_at, cm.is_blocked
     FROM community_members cm JOIN users u ON u.id = cm.user_id
     WHERE cm.community_id = ?
     ORDER BY CASE cm.role WHEN 'admin' THEN 0 WHEN 'mod' THEN 1 ELSE 2 END, cm.joined_at ASC ${limit}`,
    [c.id]
  );
  res.json(members);
});

// PUT /api/communities/:slug/members/:userId/role
router.put('/:slug/members/:userId/role', auth, (req, res) => {
  const c = db.get('SELECT id, creator_id FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  const myMem = db.get('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.user.id]);
  if (!myMem || myMem.role !== 'admin') return res.status(403).json({ message: 'Solo el admin puede cambiar roles' });
  if (Number(req.params.userId) === c.creator_id) return res.status(400).json({ message: 'No puedes cambiar el rol del creador' });
  const { role } = req.body;
  if (!['member', 'mod'].includes(role)) return res.status(400).json({ message: 'Rol inválido' });
  db.run('UPDATE community_members SET role = ? WHERE community_id = ? AND user_id = ?', [role, c.id, req.params.userId]);
  res.json({ message: 'Rol actualizado' });
});

// POST /api/communities/:slug/members/:userId/block  — bloquear / desbloquear
router.post('/:slug/members/:userId/block', auth, (req, res) => {
  const c = db.get('SELECT id, creator_id FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  const myMem = db.get('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.user.id]);
  if (!myMem || !['admin', 'mod'].includes(myMem.role)) return res.status(403).json({ message: 'Sin permiso' });
  if (Number(req.params.userId) === c.creator_id) return res.status(400).json({ message: 'No puedes bloquear al creador' });
  const target = db.get('SELECT is_blocked FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.params.userId]);
  if (!target) return res.status(404).json({ message: 'Integrante no encontrado' });
  const newBlocked = target.is_blocked ? 0 : 1;
  db.run('UPDATE community_members SET is_blocked = ? WHERE community_id = ? AND user_id = ?', [newBlocked, c.id, req.params.userId]);
  res.json({ blocked: !!newBlocked, message: newBlocked ? 'Usuario bloqueado' : 'Usuario desbloqueado' });
});

// DELETE /api/communities/:slug/members/:userId  — expulsar miembro
router.delete('/:slug/members/:userId', auth, (req, res) => {
  const c = db.get('SELECT id, creator_id FROM communities WHERE slug = ?', [req.params.slug]);
  if (!c) return res.status(404).json({ message: 'Comunidad no encontrada' });
  const myMem = db.get('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.user.id]);
  if (!myMem || !['admin', 'mod'].includes(myMem.role)) return res.status(403).json({ message: 'Sin permiso' });
  if (Number(req.params.userId) === c.creator_id) return res.status(400).json({ message: 'No puedes expulsar al creador' });
  db.run('DELETE FROM community_members WHERE community_id = ? AND user_id = ?', [c.id, req.params.userId]);
  db.run('UPDATE communities SET member_count = MAX(1, member_count - 1) WHERE id = ?', [c.id]);
  res.json({ message: 'Integrante expulsado' });
});

module.exports = router;
