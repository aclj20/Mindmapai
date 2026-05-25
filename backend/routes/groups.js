const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// GET /api/groups/my — grupos del usuario
router.get('/my', auth, (req, res) => {
  const groups = db.all(
    `SELECT g.id, g.name, g.join_code, u.name as teacher,
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

// POST /api/groups — crear grupo (solo docente)
router.post('/', auth, (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Solo los docentes pueden crear grupos' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Nombre requerido' });

  let join_code = makeCode();
  while (db.get('SELECT id FROM groups WHERE join_code = ?', [join_code])) {
    join_code = makeCode();
  }

  const { lastInsertRowid: id } = db.run(
    'INSERT INTO groups (name, teacher_id, join_code) VALUES (?,?,?)',
    [name, req.user.id, join_code]
  );
  // el docente también es miembro
  db.run('INSERT INTO group_members (group_id, user_id) VALUES (?,?)', [id, req.user.id]);

  res.status(201).json({ id, name, join_code });
});

// POST /api/groups/join — unirse con código
router.post('/join', auth, (req, res) => {
  const { join_code } = req.body;
  if (!join_code) return res.status(400).json({ message: 'Código requerido' });

  const group = db.get('SELECT id, name FROM groups WHERE join_code = ?', [join_code.toUpperCase()]);
  if (!group) return res.status(404).json({ message: 'Código inválido' });

  if (db.get('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [group.id, req.user.id]))
    return res.status(409).json({ message: 'Ya eres miembro de este grupo' });

  db.run('INSERT INTO group_members (group_id, user_id) VALUES (?,?)', [group.id, req.user.id]);
  res.json({ message: `Te uniste a ${group.name}`, group });
});

// GET /api/groups/:id — detalles con miembros y ranking
router.get('/:id', auth, (req, res) => {
  const membership = db.get(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!membership) return res.status(403).json({ message: 'No eres miembro de este grupo' });

  const group = db.get(
    `SELECT g.id, g.name, g.join_code, u.name as teacher, u.id as teacher_id
     FROM groups g JOIN users u ON u.id = g.teacher_id WHERE g.id = ?`,
    [req.params.id]
  );
  if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

  const members = db.all(
    `SELECT u.id, u.name, u.level, u.total_points, u.streak, u.role,
            COUNT(DISTINCT m.id) as maps_created
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     LEFT JOIN maps m ON m.owner_id = u.id
     WHERE gm.group_id = ?
     GROUP BY u.id
     ORDER BY u.total_points DESC`,
    [req.params.id]
  );

  res.json({ ...group, members });
});

// GET /api/groups/:id/assignments — tareas del grupo
router.get('/:id/assignments', auth, (req, res) => {
  const membership = db.get(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
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
    [req.params.id]
  );

  res.json(assignments);
});

// POST /api/groups/:id/assignments — crear tarea (solo docente)
router.post('/:id/assignments', auth, (req, res) => {
  if (req.user.role !== 'teacher')
    return res.status(403).json({ message: 'Solo los docentes pueden crear tareas' });

  const group = db.get('SELECT teacher_id FROM groups WHERE id = ?', [req.params.id]);
  if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
  if (group.teacher_id !== req.user.id)
    return res.status(403).json({ message: 'No eres el docente de este grupo' });

  const { title, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Título requerido' });

  const { lastInsertRowid: id } = db.run(
    'INSERT INTO assignments (group_id, created_by, title, due_date) VALUES (?,?,?,?)',
    [req.params.id, req.user.id, title, due_date || null]
  );

  res.status(201).json({ id, title, due_date });
});

// POST /api/groups/assignments/:assignmentId/submit — entregar tarea
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
