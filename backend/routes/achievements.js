const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { checkAchievements } = require('../achievementChecker');

const router = express.Router();

// Calcula el valor actual del usuario para cada tipo de criterio
function getUserProgress(userId) {
  const user = db.get('SELECT streak FROM users WHERE id = ?', [userId]);
  return {
    maps_created:   db.get('SELECT COUNT(*) as c FROM maps WHERE owner_id = ?', [userId])?.c ?? 0,
    streak:         user?.streak ?? 0,
    study_sessions: db.get('SELECT COUNT(*) as c FROM study_sessions WHERE user_id = ?', [userId])?.c ?? 0,
    total_likes:    db.get('SELECT COALESCE(SUM(like_count),0) as c FROM maps WHERE owner_id = ?', [userId])?.c ?? 0,
    comments_given: db.get('SELECT COUNT(*) as c FROM map_comments WHERE user_id = ?', [userId])?.c ?? 0,
  };
}

// GET /api/achievements — catálogo completo con progreso en tiempo real
router.get('/', auth, (req, res) => {
  // Ejecutar check para desbloquear logros alcanzados
  checkAchievements(req.user.id);

  const catalog = db.all('SELECT * FROM achievements ORDER BY id');

  // Progreso en tiempo real desde las tablas reales (no depende de user_achievements.progress)
  const liveProgress = getUserProgress(req.user.id);

  // Logros ya desbloqueados (para obtener unlocked_at)
  const unlockedRows = db.all(
    'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ? AND unlocked_at IS NOT NULL',
    [req.user.id]
  );
  const unlockedMap = {};
  for (const u of unlockedRows) unlockedMap[u.achievement_id] = u.unlocked_at;

  const result = catalog.map(a => {
    const currentProgress = liveProgress[a.criteria_type] ?? 0;
    const isUnlocked = !!unlockedMap[a.id];
    return {
      ...a,
      unlocked:    isUnlocked,
      unlocked_at: unlockedMap[a.id] ?? null,
      progress:    currentProgress,
    };
  });

  res.json(result);
});

// POST /api/achievements/check — evalúa y desbloquea logros automáticamente
router.post('/check', auth, (req, res) => {
  const newlyUnlocked = checkAchievements(req.user.id);
  res.json({ newly_unlocked: newlyUnlocked });
});

module.exports = router;
