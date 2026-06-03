const db = require('../db');

function getLevelDetails(totalXp) {
  let level = 1;
  let levelStart = 0;
  let levelRange = 1000; // rango del nivel 1 (0 a 999)

  while (true) {
    let nextLevelStart = levelStart + levelRange;
    if (totalXp < nextLevelStart) {
      break;
    }
    levelStart = nextLevelStart;
    level += 1;
    if (level === 2) {
      levelRange = 1500; // 1000 a 2499
    } else if (level === 3) {
      levelRange = 2000; // 2500 a 4499
    } else if (level === 4) {
      levelRange = 2500; // 4500 a 6999
    } else if (level === 5) {
      levelRange = 3000; // 7000 a 9999
    } else {
      // nivel 6+: incremento progresivo de 500 por cada nivel
      levelRange = 3000 + (level - 5) * 500;
    }
  }

  const xpInLevel = totalXp - levelStart;
  const xpNeeded = levelRange;
  return {
    level,
    xpInLevel,
    xpNeeded
  };
}

function awardXP(userId, xp, reason) {
  const user = db.get('SELECT total_points FROM users WHERE id = ?', [userId]);
  if (!user) return;

  const newTotalPoints = (user.total_points || 0) + xp;
  const { level, xpInLevel, xpNeeded } = getLevelDetails(newTotalPoints);

  db.run(
    'UPDATE users SET xp=?, level=?, xp_to_next=?, total_points=? WHERE id=?',
    [xpInLevel, level, xpNeeded, newTotalPoints, userId]
  );
  db.run(
    'INSERT INTO point_transactions (user_id, points, reason) VALUES (?,?,?)',
    [userId, xp, reason]
  );
}

function updateStreak(userId) {
  const today     = new Date().toISOString().slice(0, 10);
  const user      = db.get('SELECT streak, last_activity_date FROM users WHERE id = ?', [userId]);
  if (!user) return;

  const last      = user.last_activity_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const streak = last === today ? user.streak : last === yesterday ? user.streak + 1 : 1;
  db.run('UPDATE users SET streak=?, last_activity_date=? WHERE id=?', [streak, today, userId]);
}

module.exports = { awardXP, updateStreak, getLevelDetails };

