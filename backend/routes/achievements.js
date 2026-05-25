const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/achievements — catálogo completo con progreso del usuario
router.get('/', auth, (req, res) => {
  const catalog = db.all('SELECT * FROM achievements ORDER BY id');
  const unlocked = db.all(
    'SELECT achievement_id, progress, unlocked_at FROM user_achievements WHERE user_id = ?',
    [req.user.id]
  );

  const unlockedMap = {};
  for (const u of unlocked) unlockedMap[u.achievement_id] = u;

  const result = catalog.map(a => {
    const ua = unlockedMap[a.id];
    return {
      ...a,
      unlocked:    !!ua?.unlocked_at,
      unlocked_at: ua?.unlocked_at ?? null,
      progress:    ua?.progress ?? 0,
    };
  });

  res.json(result);
});

// POST /api/achievements/check — evalúa y desbloquea logros automáticamente
router.post('/check', auth, (req, res) => {
  const userId = req.user.id;
  const user   = db.get(
    'SELECT streak, level FROM users WHERE id = ?', [userId]
  );

  const mapsCreated   = db.get('SELECT COUNT(*) as c FROM maps WHERE owner_id = ?', [userId])?.c ?? 0;
  const studySessions = db.get('SELECT COUNT(*) as c FROM study_sessions WHERE user_id = ?', [userId])?.c ?? 0;
  const totalLikes    = db.get('SELECT COALESCE(SUM(like_count),0) as c FROM maps WHERE owner_id = ?', [userId])?.c ?? 0;
  const commentsGiven = db.get('SELECT COUNT(*) as c FROM map_comments WHERE user_id = ?', [userId])?.c ?? 0;

  const values = {
    maps_created:    mapsCreated,
    streak:          user?.streak ?? 0,
    study_sessions:  studySessions,
    total_likes:     totalLikes,
    comments_given:  commentsGiven,
  };

  const catalog = db.all('SELECT * FROM achievements');
  const newlyUnlocked = [];

  for (const a of catalog) {
    const current = values[a.criteria_type] ?? 0;

    const existing = db.get(
      'SELECT id, unlocked_at FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, a.id]
    );

    if (!existing) {
      db.run(
        'INSERT INTO user_achievements (user_id, achievement_id, progress) VALUES (?,?,?)',
        [userId, a.id, current]
      );
    } else if (!existing.unlocked_at) {
      db.run(
        'UPDATE user_achievements SET progress = ? WHERE user_id = ? AND achievement_id = ?',
        [current, userId, a.id]
      );
    }

    if (current >= a.criteria_value && !existing?.unlocked_at) {
      db.run(
        `UPDATE user_achievements SET progress=?, unlocked_at=datetime('now')
         WHERE user_id=? AND achievement_id=?`,
        [current, userId, a.id]
      );
      // otorgar XP del logro
      db.run(
        'UPDATE users SET xp = xp + ?, total_points = total_points + ? WHERE id = ?',
        [a.xp_reward, a.xp_reward, userId]
      );
      db.run(
        'INSERT INTO point_transactions (user_id, points, reason) VALUES (?,?,?)',
        [userId, a.xp_reward, `achievement_${a.name}`]
      );
      newlyUnlocked.push({ id: a.id, name: a.name, xp: a.xp_reward });
    }
  }

  res.json({ newly_unlocked: newlyUnlocked });
});

module.exports = router;
