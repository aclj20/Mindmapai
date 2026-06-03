const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { makeShortId } = require('../utils/shortId');

const router = express.Router();

function makeJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function uniqueGroupPublicId() {
  let pid;
  do { pid = makeShortId(); } while (db.get('SELECT id FROM groups WHERE public_id = ?', [pid]));
  return pid;
}

// Middleware: resuelve public_id → row numérico y pone req.groupId (número)
function resolveGroup(req, res, next) {
  const row = db.get('SELECT id FROM groups WHERE public_id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Grupo no encontrado' });
  req.groupId = row.id;
  next();
}

// GET /api/groups/my — grupos del usuario
router.get('/my', auth, (req, res) => {
  const groups = db.all(
    `SELECT g.id, g.public_id, g.name, g.join_code, g.teacher_id, u.name as teacher,
            COUNT(DISTINCT gm.user_id) as students
     FROM groups g
     JOIN users u ON u.id = g.teacher_id
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = ?
     GROUP BY g.id`,
    [req.user.id]
  );
  res.json(groups);
});

// POST /api/groups — crear grupo
router.post('/', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Nombre requerido' });

  let join_code = makeJoinCode();
  while (db.get('SELECT id FROM groups WHERE join_code = ?', [join_code])) {
    join_code = makeJoinCode();
  }

  const public_id = uniqueGroupPublicId();

  const { lastInsertRowid: id } = db.run(
    'INSERT INTO groups (name, teacher_id, join_code, public_id) VALUES (?,?,?,?)',
    [name, req.user.id, join_code, public_id]
  );
  db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?,?, 'admin')", [id, req.user.id]);

  res.status(201).json({ id, public_id, name, join_code });
});

// POST /api/groups/join — unirse con código
router.post('/join', auth, (req, res) => {
  const { join_code } = req.body;
  if (!join_code) return res.status(400).json({ message: 'Código requerido' });

  const group = db.get('SELECT id, public_id, name FROM groups WHERE join_code = ?', [join_code.toUpperCase()]);
  if (!group) return res.status(404).json({ message: 'Código inválido' });

  if (db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [group.id, req.user.id]))
    return res.status(409).json({ message: 'Ya eres miembro de este grupo' });

  db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?,?, 'student')", [group.id, req.user.id]);
  res.json({ message: `Te uniste a ${group.name}`, group });
});

// GET /api/groups/:id — detalles con miembros, mapas y ranking
router.get('/:id', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;

  const membership = db.get(
    'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
    [gid, req.user.id]
  );
  if (!membership) return res.status(403).json({ message: 'No eres miembro de este grupo' });

  const group = db.get(
    `SELECT g.id, g.public_id, g.name, g.join_code, u.name as teacher, u.id as teacher_id
     FROM groups g JOIN users u ON u.id = g.teacher_id WHERE g.id = ?`,
    [gid]
  );

  const members = db.all(
    `SELECT u.id, u.name, u.level, u.streak, gm.role,
            COALESCE((
              SELECT SUM(max_score)
              FROM (
                SELECT MAX(qs.score) as max_score
                FROM quiz_scores qs
                JOIN maps m ON m.id = qs.map_id
                WHERE qs.user_id = u.id AND m.group_id = ?
                GROUP BY qs.map_id
              )
            ), 0) as points,
            COUNT(DISTINCT ua.achievement_id) as badges
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     LEFT JOIN user_achievements ua ON ua.user_id = u.id AND ua.unlocked_at IS NOT NULL
     WHERE gm.group_id = ?
     GROUP BY u.id
     ORDER BY points DESC`,
    [gid, gid]
  );

  const maps = db.all(
    `SELECT m.id, m.public_id, m.title, m.node_count, m.created_at, u.name as owner_name, u.id as owner_id,
            COALESCE(MAX(qs.score), -1) as my_best_score
     FROM maps m
     JOIN users u ON u.id = m.owner_id
     LEFT JOIN quiz_scores qs ON qs.map_id = m.id AND qs.user_id = ?
     WHERE m.group_id = ?
     GROUP BY m.id
     ORDER BY m.updated_at DESC`,
    [req.user.id, gid]
  );

  res.json({ ...group, myRole: membership.role, members, maps });
});

// GET /api/groups/:id/assignments
router.get('/:id/assignments', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;

  const membership = db.get(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
    [gid, req.user.id]
  );
  if (!membership) return res.status(403).json({ message: 'Sin acceso' });

  const assignments = db.all(
    `SELECT a.id, a.title, a.due_date, a.created_at,
            COUNT(DISTINCT s.student_id) as submitted,
            COUNT(DISTINCT gm.user_id) - 1 as total
     FROM assignments a
     JOIN group_members gm ON gm.group_id = a.group_id AND gm.user_id != a.created_by
     LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.status = 'submitted'
     WHERE a.group_id = ?
     GROUP BY a.id
     ORDER BY a.due_date ASC`,
    [gid]
  );

  res.json(assignments);
});

// POST /api/groups/:id/assignments — crear tarea (solo admin)
router.post('/:id/assignments', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;

  const membership = db.get(
    'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
    [gid, req.user.id]
  );
  if (!membership || !['admin', 'teacher'].includes(membership.role))
    return res.status(403).json({ message: 'Solo el administrador del grupo puede crear tareas' });

  const { title, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Título requerido' });

  const { lastInsertRowid: id } = db.run(
    'INSERT INTO assignments (group_id, created_by, title, due_date) VALUES (?,?,?,?)',
    [gid, req.user.id, title, due_date || null]
  );

  res.status(201).json({ id, title, due_date });
});

// POST /api/groups/assignments/:assignmentId/submit
router.post('/assignments/:assignmentId/submit', auth, (req, res) => {
  const { map_id } = req.body;
  const assignment = db.get('SELECT id FROM assignments WHERE id = ?', [req.params.assignmentId]);
  if (!assignment) return res.status(404).json({ message: 'Tarea no encontrada' });

  db.run(
    `INSERT INTO assignment_submissions (assignment_id, student_id, map_id, status, submitted_at)
     VALUES (?,?,?,'submitted', datetime('now'))
     ON CONFLICT(assignment_id, student_id) DO UPDATE
       SET map_id=excluded.map_id, status='submitted', submitted_at=excluded.submitted_at`,
    [req.params.assignmentId, req.user.id, map_id || null]
  );

  res.json({ message: 'Tarea entregada' });
});

module.exports = router;
