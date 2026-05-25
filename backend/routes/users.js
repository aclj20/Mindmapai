const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me — perfil completo con stats calculadas
router.get('/me', auth, (req, res) => {
  const user = db.get(
    `SELECT id, name, email, role, level, xp, xp_to_next, streak, total_points, created_at
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

// PUT /api/users/me — actualizar nombre
router.put('/me', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Nombre requerido' });

  db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
  res.json({ message: 'Perfil actualizado' });
});

module.exports = router;
