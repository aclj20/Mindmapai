const db = require('../db');

function awardXP(userId, xp, reason) {
  const user = db.get('SELECT level, xp, xp_to_next, total_points FROM users WHERE id = ?', [userId]);
  if (!user) return;

  let newXp    = user.xp + xp;
  let level    = user.level;
  let xpToNext = user.xp_to_next;

  while (newXp >= xpToNext) {
    newXp   -= xpToNext;
    level   += 1;
    xpToNext = Math.round(xpToNext * 1.3);
  }

  db.run(
    'UPDATE users SET xp=?, level=?, xp_to_next=?, total_points=total_points+? WHERE id=?',
    [newXp, level, xpToNext, xp, userId]
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

module.exports = { awardXP, updateStreak };
