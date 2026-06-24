const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard?period=weekly|monthly|alltime&group_id=X
router.get('/', auth, (req, res) => {
  const { period = 'alltime', group_id } = req.query;

  // Filtro de fecha sobre point_transactions
  let dateFilter = '';
  if (period === 'weekly')  dateFilter = `AND strftime('%Y-%W', pt.created_at) = strftime('%Y-%W', 'now')`;
  if (period === 'monthly') dateFilter = `AND strftime('%Y-%m', pt.created_at) = strftime('%Y-%m', 'now')`;

  let rows;

  if (group_id) {
    if (period === 'alltime') {
      rows = db.all(
        `SELECT u.id, u.name, u.avatar_url, u.level, u.streak, u.total_points as points,
                COUNT(DISTINCT ua.achievement_id) as badges
         FROM users u
         JOIN group_members gm ON gm.user_id = u.id
         LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
         WHERE gm.group_id = ?
         GROUP BY u.id
         ORDER BY points DESC
         LIMIT 50`,
        [group_id]
      );
    } else {
      // XP ganada en el período (todas las fuentes) para miembros del grupo
      rows = db.all(
        `SELECT u.id, u.name, u.avatar_url, u.level, u.streak,
                COALESCE(SUM(CASE WHEN pt.id IS NOT NULL ${dateFilter} THEN pt.points ELSE 0 END), 0) as points,
                COUNT(DISTINCT ua.achievement_id) as badges
         FROM users u
         JOIN group_members gm ON gm.user_id = u.id
         LEFT JOIN point_transactions pt ON pt.user_id = u.id
         LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
         WHERE gm.group_id = ?
         GROUP BY u.id
         ORDER BY points DESC
         LIMIT 50`,
        [group_id]
      );
    }
  } else {
    if (period === 'alltime') {
      rows = db.all(
        `SELECT u.id, u.name, u.avatar_url, u.level, u.streak, u.total_points as points,
                COUNT(DISTINCT ua.achievement_id) as badges
         FROM users u
         LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
         GROUP BY u.id
         ORDER BY points DESC
         LIMIT 50`
      );
    } else {
      // XP ganada en el período (mapas, sesiones, logros, quizzes, comentarios, etc.)
      rows = db.all(
        `SELECT u.id, u.name, u.avatar_url, u.level, u.streak,
                COALESCE(SUM(CASE WHEN pt.id IS NOT NULL ${dateFilter} THEN pt.points ELSE 0 END), 0) as points,
                COUNT(DISTINCT ua.achievement_id) as badges
         FROM users u
         LEFT JOIN point_transactions pt ON pt.user_id = u.id
         LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
         GROUP BY u.id
         ORDER BY points DESC
         LIMIT 50`
      );
    }
  }

  // Asignar ranks solo a quienes tienen puntos
  let rankCounter = 1;
  const ranked = rows.map((r) => {
    const rank = r.points > 0 ? rankCounter++ : null;
    return { ...r, rank, isCurrentUser: r.id === req.user.id };
  });

  // Si el usuario actual no aparece en el top 50, agregarlo con su posición real
  const currentUserInList = ranked.find(r => r.isCurrentUser);
  if (!currentUserInList) {
    const base = db.get(
      `SELECT id, name, avatar_url, level, streak,
              (SELECT COUNT(*) FROM user_achievements WHERE user_id = ? AND unlocked_at IS NOT NULL) as badges
       FROM users WHERE id = ?`,
      [req.user.id, req.user.id]
    );

    if (base) {
      let pts = 0;
      let myRank = null;

      if (period === 'alltime') {
        const row = db.get('SELECT total_points as points FROM users WHERE id = ?', [req.user.id]);
        pts = row?.points ?? 0;
        if (pts > 0) {
          const above = db.get('SELECT COUNT(*) as c FROM users WHERE total_points > ?', [pts]);
          myRank = (above?.c ?? 0) + 1;
        }
      } else {
        // dateFilter usa alias "pt" — reescribir para subconsulta directa
        const ptFilter = period === 'weekly'
          ? `strftime('%Y-%W', created_at) = strftime('%Y-%W', 'now')`
          : `strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`;

        const row = db.get(
          `SELECT COALESCE(SUM(points), 0) as points FROM point_transactions
           WHERE user_id = ? AND ${ptFilter}`,
          [req.user.id]
        );
        pts = row?.points ?? 0;
        if (pts > 0) {
          const above = db.get(
            `SELECT COUNT(DISTINCT user_id) as c FROM (
               SELECT user_id, SUM(points) as total
               FROM point_transactions WHERE ${ptFilter}
               GROUP BY user_id
             ) WHERE total > ?`,
            [pts]
          );
          myRank = (above?.c ?? 0) + 1;
        }
      }

      ranked.push({ ...base, points: pts, rank: myRank, isCurrentUser: true, isBelowCut: true });
    }
  }

  res.json(ranked);
});

module.exports = router;
