const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { checkAchievements } = require('../achievementChecker');

const router = express.Router();

// POST /api/sessions/start
router.post('/start', auth, (req, res) => {
  const { map_id } = req.body;
  const { lastInsertRowid: id } = db.run(
    'INSERT INTO study_sessions (user_id, map_id) VALUES (?,?)',
    [req.user.id, map_id || null]
  );
  res.status(201).json({ id, started_at: new Date().toISOString() });
});

// POST /api/sessions/end
router.post('/end', auth, (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ message: 'session_id requerido' });

  const session = db.get(
    'SELECT id, started_at FROM study_sessions WHERE id = ? AND user_id = ?',
    [session_id, req.user.id]
  );
  if (!session) return res.status(404).json({ message: 'Sesión no encontrada' });

  const startedAt      = new Date(session.started_at);
  const duration       = Math.round((Date.now() - startedAt.getTime()) / 60000);
  const duration_final = Math.max(1, duration);

  db.run(
    `UPDATE study_sessions SET ended_at=datetime('now'), duration_minutes=? WHERE id=?`,
    [duration_final, session_id]
  );

  // XP por minuto de estudio (máx 60 min)
  const xpEarned = Math.min(duration_final, 60);
  db.run(
    'UPDATE users SET xp = xp + ?, total_points = total_points + ? WHERE id = ?',
    [xpEarned, xpEarned, req.user.id]
  );
  db.run(
    'INSERT INTO point_transactions (user_id, points, reason) VALUES (?,?,?)',
    [req.user.id, xpEarned, 'study_session']
  );

  checkAchievements(req.user.id);
  res.json({ duration_minutes: duration_final, xp_earned: xpEarned });
});

// GET /api/sessions/weekly-activity — actividad por día de la semana (docente)
router.get('/weekly-activity', auth, (req, res) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Si es docente, muestra actividad de todos sus estudiantes
  let userFilter = 'AND s.user_id = ?';
  let params     = [req.user.id];

  if (req.user.role === 'teacher') {
    userFilter = `AND s.user_id IN (
      SELECT gm.user_id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      WHERE g.teacher_id = ?
    )`;
  }

  const sessions = db.all(
    `SELECT strftime('%w', started_at) as dow,
            COUNT(*) as sesiones,
            COUNT(DISTINCT map_id) as mapas
     FROM study_sessions s
     WHERE s.started_at >= datetime('now', '-7 days') ${userFilter}
     GROUP BY dow`,
    params
  );

  // Construir array completo de 7 días
  const activity = days.map((day, i) => {
    const row = sessions.find(s => parseInt(s.dow) === i);
    return {
      day,
      sesiones: row ? parseInt(row.sesiones) : 0,
      mapas:    row ? parseInt(row.mapas)    : 0,
    };
  });

  // Rotar para empezar en Lunes
  const lunes = activity.slice(1).concat(activity[0]);
  res.json(lunes);
});

// GET /api/sessions/stats — resumen personal (para perfil / dashboard)
router.get('/stats', auth, (req, res) => {
  const total = db.get(
    'SELECT COUNT(*) as count, COALESCE(SUM(duration_minutes),0) as minutes FROM study_sessions WHERE user_id = ?',
    [req.user.id]
  );
  res.json({
    total_sessions: total?.count ?? 0,
    total_minutes:  total?.minutes ?? 0,
  });
});

module.exports = router;
