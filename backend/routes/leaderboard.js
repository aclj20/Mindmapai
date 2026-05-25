const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard?period=weekly|monthly|alltime&group_id=X
router.get('/', auth, (req, res) => {
  const { period = 'alltime', group_id } = req.query;

  // Filtro de fecha para puntos según período
  let dateFilter = '';
  if (period === 'weekly')  dateFilter = `AND pt.created_at >= datetime('now', '-7 days')`;
  if (period === 'monthly') dateFilter = `AND pt.created_at >= datetime('now', '-30 days')`;

  // Filtro de grupo
  let groupJoin   = '';
  let groupWhere  = '';
  let groupParams = [];
  if (group_id) {
    groupJoin  = 'JOIN group_members gm ON gm.user_id = u.id';
    groupWhere = 'AND gm.group_id = ?';
    groupParams.push(group_id);
  }

  let rows;

  if (period === 'alltime') {
    rows = db.all(
      `SELECT u.id, u.name, u.level, u.total_points as points, u.streak,
              COUNT(DISTINCT ua.achievement_id) as badges
       FROM users u
       ${groupJoin}
       LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
       WHERE u.role = 'student' ${groupWhere}
       GROUP BY u.id
       ORDER BY u.total_points DESC
       LIMIT 50`,
      groupParams
    );
  } else {
    rows = db.all(
      `SELECT u.id, u.name, u.level, u.streak,
              COALESCE(SUM(pt.points), 0) as points,
              COUNT(DISTINCT ua.achievement_id) as badges
       FROM users u
       ${groupJoin}
       LEFT JOIN point_transactions pt ON pt.user_id = u.id ${dateFilter}
       LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
       WHERE u.role = 'student' ${groupWhere}
       GROUP BY u.id
       ORDER BY points DESC
       LIMIT 50`,
      groupParams
    );
  }

  const ranked = rows.map((r, i) => ({
    ...r,
    rank: i + 1,
    isCurrentUser: r.id === req.user.id,
  }));

  res.json(ranked);
});

module.exports = router;
