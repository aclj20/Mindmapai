const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard?period=weekly|monthly|alltime&group_id=X
router.get('/', auth, (req, res) => {
  const { period = 'alltime', group_id } = req.query;

  // Filtro de fecha para los quizzes según período
  let dateFilter = '';
  if (period === 'weekly')  dateFilter = `AND qs.created_at >= datetime('now', '-7 days')`;
  if (period === 'monthly') dateFilter = `AND qs.created_at >= datetime('now', '-30 days')`;

  let rows;

  if (group_id) {
    rows = db.all(
      `SELECT u.id, u.name, u.level, u.streak,
              COALESCE((
                SELECT SUM(max_score) 
                FROM (
                  SELECT qs.map_id, MAX(qs.score) as max_score 
                  FROM quiz_scores qs 
                  JOIN maps m ON m.id = qs.map_id 
                  WHERE qs.user_id = u.id AND m.group_id = ? ${dateFilter}
                  GROUP BY qs.map_id
                )
              ), 0) as points,
              COUNT(DISTINCT ua.achievement_id) as badges
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
       WHERE gm.group_id = ?
       GROUP BY u.id
       ORDER BY points DESC
       LIMIT 50`,
      [group_id, group_id]
    );
  } else {
    rows = db.all(
      `SELECT u.id, u.name, u.level, u.streak,
              COALESCE((
                SELECT SUM(max_score) 
                FROM (
                  SELECT qs.user_id, MAX(qs.score) as max_score 
                  FROM quiz_scores qs 
                  WHERE 1=1 ${dateFilter}
                  GROUP BY qs.user_id, qs.map_id
                )
                WHERE user_id = u.id
              ), 0) as points,
              COUNT(DISTINCT ua.achievement_id) as badges
       FROM users u
       LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
       GROUP BY u.id
       ORDER BY points DESC
       LIMIT 50`
    );
  }

  const ranked = rows.map((r, i) => ({
    ...r,
    rank: r.points > 0 ? i + 1 : null,
    isCurrentUser: r.id === req.user.id,
  }));

  res.json(ranked);
});

module.exports = router;
