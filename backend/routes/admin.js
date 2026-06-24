const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware: sólo admin puede acceder
function requireAdmin(req, res, next) {
  const user = db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return res.status(403).json({ message: 'Solo administradores pueden acceder a este recurso' });
  }
  next();
}

// ── LOGROS ────────────────────────────────────────────────────────────────────

// GET /api/admin/achievements — listar todos los logros
router.get('/achievements', auth, requireAdmin, (_req, res) => {
  const achievements = db.all('SELECT * FROM achievements ORDER BY id');
  res.json(achievements);
});

// POST /api/admin/achievements — crear nuevo logro
router.post('/achievements', auth, requireAdmin, (req, res) => {
  const { name, description, icon, color, xp_reward, criteria_type, criteria_value } = req.body;
  if (!name || !criteria_type || criteria_value == null) {
    return res.status(400).json({ message: 'Faltan campos requeridos: name, criteria_type, criteria_value' });
  }
  const { lastInsertRowid } = db.run(
    'INSERT INTO achievements (name, description, icon, color, xp_reward, criteria_type, criteria_value) VALUES (?,?,?,?,?,?,?)',
    [name, description || '', icon || 'Award', color || 'text-primary bg-primary-subtle', xp_reward || 100, criteria_type, criteria_value]
  );
  res.status(201).json({ id: lastInsertRowid, message: 'Logro creado' });
});

// PUT /api/admin/achievements/:id — actualizar logro
router.put('/achievements/:id', auth, requireAdmin, (req, res) => {
  const { name, description, icon, color, xp_reward, criteria_type, criteria_value } = req.body;
  const existing = db.get('SELECT id FROM achievements WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ message: 'Logro no encontrado' });

  db.run(
    `UPDATE achievements SET name=?, description=?, icon=?, color=?, xp_reward=?, criteria_type=?, criteria_value=? WHERE id=?`,
    [name, description, icon, color, xp_reward, criteria_type, criteria_value, req.params.id]
  );
  res.json({ message: 'Logro actualizado' });
});

// DELETE /api/admin/achievements/:id — eliminar logro
router.delete('/achievements/:id', auth, requireAdmin, (req, res) => {
  const existing = db.get('SELECT id FROM achievements WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ message: 'Logro no encontrado' });
  db.run('DELETE FROM achievements WHERE id = ?', [req.params.id]);
  res.json({ message: 'Logro eliminado' });
});

// ── RETOS SEMANALES ────────────────────────────────────────────────────────────

// GET /api/admin/challenges — listar todos los retos
router.get('/challenges', auth, requireAdmin, (_req, res) => {
  const challenges = db.all('SELECT * FROM weekly_challenges ORDER BY week_start DESC');
  res.json(challenges);
});

// GET /api/challenges/active — retos activos para usuarios (no requiere admin)
router.get('/challenges/active', auth, (req, res) => {
  const now = new Date().toISOString();
  const challenges = db.all(
    `SELECT wc.*,
            COALESCE(ucp.progress, 0) as user_progress,
            COALESCE(ucp.completed, 0) as user_completed,
            ucp.completed_at
     FROM weekly_challenges wc
     LEFT JOIN user_challenge_progress ucp ON ucp.challenge_id = wc.id AND ucp.user_id = ?
     WHERE wc.is_active = 1 AND wc.week_start <= ? AND wc.week_end >= ?
     ORDER BY wc.created_at DESC`,
    [req.user.id, now, now]
  );
  res.json(challenges);
});

// POST /api/admin/challenges — crear reto semanal
router.post('/challenges', auth, requireAdmin, (req, res) => {
  const { title, description, challenge_type, target_value, xp_reward, week_start, week_end } = req.body;
  if (!title || !challenge_type || !target_value || !week_start || !week_end) {
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }
  const { lastInsertRowid } = db.run(
    `INSERT INTO weekly_challenges (title, description, challenge_type, target_value, xp_reward, week_start, week_end, created_by)
     VALUES (?,?,?,?,?,?,?,?)`,
    [title, description || '', challenge_type, target_value, xp_reward || 100, week_start, week_end, req.user.id]
  );
  res.status(201).json({ id: lastInsertRowid, message: 'Reto creado' });
});

// PUT /api/admin/challenges/:id — actualizar reto
router.put('/challenges/:id', auth, requireAdmin, (req, res) => {
  const { title, description, challenge_type, target_value, xp_reward, week_start, week_end, is_active } = req.body;
  const existing = db.get('SELECT id FROM weekly_challenges WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ message: 'Reto no encontrado' });

  db.run(
    `UPDATE weekly_challenges SET title=?, description=?, challenge_type=?, target_value=?, xp_reward=?, week_start=?, week_end=?, is_active=? WHERE id=?`,
    [title, description, challenge_type, target_value, xp_reward, week_start, week_end, is_active ?? 1, req.params.id]
  );
  res.json({ message: 'Reto actualizado' });
});

// DELETE /api/admin/challenges/:id — eliminar reto
router.delete('/challenges/:id', auth, requireAdmin, (req, res) => {
  const existing = db.get('SELECT id FROM weekly_challenges WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ message: 'Reto no encontrado' });
  db.run('DELETE FROM weekly_challenges WHERE id = ?', [req.params.id]);
  res.json({ message: 'Reto eliminado' });
});

// POST /api/admin/challenges/:id/progress — actualizar progreso del reto para el usuario actual
router.post('/challenges/:id/progress', auth, (req, res) => {
  const { progress } = req.body;
  const challenge = db.get('SELECT * FROM weekly_challenges WHERE id = ?', [req.params.id]);
  if (!challenge) return res.status(404).json({ message: 'Reto no encontrado' });

  const completed = progress >= challenge.target_value ? 1 : 0;
  const existing = db.get(
    'SELECT id, completed FROM user_challenge_progress WHERE user_id = ? AND challenge_id = ?',
    [req.user.id, req.params.id]
  );

  if (!existing) {
    db.run(
      `INSERT INTO user_challenge_progress (user_id, challenge_id, progress, completed, completed_at) VALUES (?,?,?,?,?)`,
      [req.user.id, req.params.id, progress, completed, completed ? new Date().toISOString() : null]
    );
  } else if (!existing.completed) {
    db.run(
      `UPDATE user_challenge_progress SET progress=?, completed=?, completed_at=? WHERE user_id=? AND challenge_id=?`,
      [progress, completed, completed ? new Date().toISOString() : null, req.user.id, req.params.id]
    );
    // Otorgar XP si se completó por primera vez
    if (completed) {
      db.run('UPDATE users SET xp = xp + ?, total_points = total_points + ? WHERE id = ?', [challenge.xp_reward, challenge.xp_reward, req.user.id]);
      db.run('INSERT INTO point_transactions (user_id, points, reason) VALUES (?,?,?)', [req.user.id, challenge.xp_reward, `challenge_${challenge.title}`]);
    }
  }

  res.json({ message: 'Progreso actualizado', completed });
});

// GET /api/admin/stats — estadísticas generales para el panel admin
router.get('/stats', auth, requireAdmin, (_req, res) => {
  const totalUsers    = db.get('SELECT COUNT(*) as c FROM users')?.c ?? 0;
  const totalMaps     = db.get('SELECT COUNT(*) as c FROM maps')?.c ?? 0;
  const totalSessions = db.get('SELECT COUNT(*) as c FROM study_sessions')?.c ?? 0;
  const totalQuizzes  = db.get('SELECT COUNT(*) as c FROM quiz_scores')?.c ?? 0;
  const activeChallenges = db.get(
    `SELECT COUNT(*) as c FROM weekly_challenges WHERE is_active=1 AND week_end >= datetime('now')`
  )?.c ?? 0;
  res.json({ totalUsers, totalMaps, totalSessions, totalQuizzes, activeChallenges });
});

module.exports = router;
