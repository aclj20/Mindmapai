const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me — perfil completo con stats calculadas
router.get('/me', auth, (req, res) => {
  const user = db.get(
    `SELECT id, name, email, role, level, xp, xp_to_next, streak, total_points,
            has_seen_tutorial, avatar_url, bio, created_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const mapsCreated   = db.get('SELECT COUNT(*) as c FROM maps WHERE owner_id = ?', [req.user.id])?.c ?? 0;
  const studySessions = db.get('SELECT COUNT(*) as c FROM study_sessions WHERE user_id = ?', [req.user.id])?.c ?? 0;
  const totalLikes    = db.get(
    'SELECT COALESCE(SUM(like_count),0) as c FROM maps WHERE owner_id = ?', [req.user.id]
  )?.c ?? 0;

  res.json({ ...user, maps_created: mapsCreated, study_sessions: studySessions, total_likes: totalLikes });
});

// PUT /api/users/me — actualizar nombre, bio y avatar
router.put('/me', auth, (req, res) => {
  const { name, bio, avatar_url } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'El nombre es requerido' });

  db.run(
    'UPDATE users SET name = ?, bio = ?, avatar_url = ? WHERE id = ?',
    [name.trim(), bio ?? null, avatar_url ?? null, req.user.id]
  );

  // Devolver usuario actualizado para sincronizar localStorage
  const updated = db.get('SELECT id, name, email, role, avatar_url, bio FROM users WHERE id = ?', [req.user.id]);
  res.json({ message: 'Perfil actualizado', user: updated });
});

// POST /api/users/me/tutorial-done — marcar tutorial como visto
router.post('/me/tutorial-done', auth, (req, res) => {
  db.run('UPDATE users SET has_seen_tutorial = 1 WHERE id = ?', [req.user.id]);
  res.json({ message: 'Tutorial marcado como visto' });
});

// GET /api/users/:id/public — perfil público de un usuario
router.get('/:id/public', auth, (req, res) => {
  const user = db.get(
    `SELECT id, name, avatar_url, bio, level, xp, xp_to_next, streak, total_points, created_at
     FROM users WHERE id = ?`,
    [req.params.id]
  );
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const achievements = db.all(
    `SELECT a.id, a.name, a.description, a.icon, a.color, a.xp_reward, ua.unlocked_at
     FROM user_achievements ua
     JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = ? AND ua.unlocked_at IS NOT NULL
     ORDER BY ua.unlocked_at DESC`,
    [req.params.id]
  );

  const maps = db.all(
    `SELECT id, public_id, title, node_count, like_count, view_count, updated_at
     FROM maps WHERE owner_id = ? AND is_public = 1
     ORDER BY updated_at DESC LIMIT 24`,
    [req.params.id]
  );

  const stats = {
    maps_public: maps.length,
    maps_total: db.get('SELECT COUNT(*) as c FROM maps WHERE owner_id = ?', [req.params.id])?.c ?? 0,
    total_likes: db.get('SELECT COALESCE(SUM(like_count),0) as c FROM maps WHERE owner_id = ?', [req.params.id])?.c ?? 0,
  };

  res.json({ ...user, achievements, maps, stats });
});

module.exports = router;
