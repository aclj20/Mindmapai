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
    `SELECT u.id, u.name, u.avatar_url, u.level, u.streak, gm.role,
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
  const membership = db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [gid, req.user.id]);
  if (!membership) return res.status(403).json({ message: 'Sin acceso' });

  const isTeacher = ['admin', 'teacher'].includes(membership.role);

  const assignments = db.all(
    `SELECT a.id, a.title, a.description, a.due_date, a.created_at,
            COUNT(DISTINCT s.student_id) as submitted,
            (SELECT COUNT(*) FROM group_members
             WHERE group_id = a.group_id AND role NOT IN ('admin','teacher')) as total
     FROM assignments a
     LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.status = 'submitted'
     WHERE a.group_id = ?
     GROUP BY a.id
     ORDER BY a.due_date ASC, a.created_at DESC`,
    [gid]
  );

  // Para estudiantes, agregar si ya entregaron y con qué mapa
  const result = assignments.map(a => {
    if (isTeacher) return { ...a, is_teacher: true };
    const sub = db.get(
      `SELECT s.status, s.submitted_at, m.title as map_title, m.public_id as map_public_id
       FROM assignment_submissions s
       LEFT JOIN maps m ON m.id = s.map_id
       WHERE s.assignment_id = ? AND s.student_id = ?`,
      [a.id, req.user.id]
    );
    return { ...a, my_submission: sub ?? null };
  });

  res.json(result);
});

// POST /api/groups/:id/assignments — crear tarea (solo docente)
router.post('/:id/assignments', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;
  const membership = db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [gid, req.user.id]);
  if (!membership || !['admin', 'teacher'].includes(membership.role))
    return res.status(403).json({ message: 'Solo el docente puede crear tareas' });

  const { title, description, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Título requerido' });

  const { lastInsertRowid: id } = db.run(
    'INSERT INTO assignments (group_id, created_by, title, description, due_date) VALUES (?,?,?,?,?)',
    [gid, req.user.id, title, description || null, due_date || null]
  );

  res.status(201).json({ id, title, description, due_date });
});

// PUT /api/groups/:id/assignments/:assignmentId — editar tarea (solo docente)
router.put('/:id/assignments/:assignmentId', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;
  const membership = db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [gid, req.user.id]);
  if (!membership || !['admin', 'teacher'].includes(membership.role))
    return res.status(403).json({ message: 'Sin permiso' });

  const a = db.get('SELECT id FROM assignments WHERE id = ? AND group_id = ?', [req.params.assignmentId, gid]);
  if (!a) return res.status(404).json({ message: 'Tarea no encontrada' });

  const { title, description, due_date } = req.body;
  if (!title) return res.status(400).json({ message: 'Título requerido' });

  db.run(
    'UPDATE assignments SET title = ?, description = ?, due_date = ? WHERE id = ?',
    [title, description || null, due_date || null, req.params.assignmentId]
  );
  res.json({ id: a.id, title, description: description || null, due_date: due_date || null });
});

// DELETE /api/groups/:id/assignments/:assignmentId — eliminar tarea (solo docente)
router.delete('/:id/assignments/:assignmentId', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;
  const membership = db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [gid, req.user.id]);
  if (!membership || !['admin', 'teacher'].includes(membership.role))
    return res.status(403).json({ message: 'Sin permiso' });

  const a = db.get('SELECT id FROM assignments WHERE id = ? AND group_id = ?', [req.params.assignmentId, gid]);
  if (!a) return res.status(404).json({ message: 'Tarea no encontrada' });

  db.run('DELETE FROM assignment_submissions WHERE assignment_id = ?', [req.params.assignmentId]);
  db.run('DELETE FROM assignments WHERE id = ?', [req.params.assignmentId]);
  res.json({ message: 'Tarea eliminada' });
});

// GET /api/groups/assignments/:assignmentId/submissions — todos los estudiantes con su estado
router.get('/assignments/:assignmentId/submissions', auth, (req, res) => {
  const assignment = db.get('SELECT id, group_id FROM assignments WHERE id = ?', [req.params.assignmentId]);
  if (!assignment) return res.status(404).json({ message: 'Tarea no encontrada' });

  const membership = db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [assignment.group_id, req.user.id]);
  if (!membership || !['admin', 'teacher'].includes(membership.role))
    return res.status(403).json({ message: 'Sin permiso' });

  // Todos los estudiantes del grupo + su entrega (si existe)
  const submissions = db.all(
    `SELECT u.id as student_id, u.name as student_name,
            s.status, s.submitted_at,
            m.title as map_title, m.public_id as map_public_id
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     LEFT JOIN assignment_submissions s ON s.assignment_id = ? AND s.student_id = u.id
     LEFT JOIN maps m ON m.id = s.map_id
     WHERE gm.group_id = ? AND gm.role NOT IN ('admin','teacher')
     ORDER BY s.submitted_at DESC NULLS LAST, u.name ASC`,
    [req.params.assignmentId, assignment.group_id]
  );
  res.json(submissions);
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

// ── TABLÓN DE ANUNCIOS ────────────────────────────────────────────────────────

// GET /api/groups/:id/announcements
router.get('/:id/announcements', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;
  const membership = db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [gid, req.user.id]);
  if (!membership) return res.status(403).json({ message: 'Sin acceso' });

  const announcements = db.all(
    `SELECT a.id, a.content, a.created_at, u.id as author_id, u.name as author_name, u.avatar_url as author_avatar
     FROM group_announcements a
     JOIN users u ON u.id = a.author_id
     WHERE a.group_id = ?
     ORDER BY a.created_at DESC`,
    [gid]
  );

  const result = announcements.map(a => ({
    ...a,
    attachments: db.all(
      'SELECT id, file_url, file_name, file_type, file_size FROM announcement_attachments WHERE announcement_id = ?',
      [a.id]
    ),
    maps: db.all(
      'SELECT map_id, map_title, map_public_id FROM announcement_maps WHERE announcement_id = ?',
      [a.id]
    ),
  }));

  res.json(result);
});

// POST /api/groups/:id/announcements
router.post('/:id/announcements', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;
  const membership = db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [gid, req.user.id]);
  if (!membership || !['admin', 'teacher'].includes(membership.role))
    return res.status(403).json({ message: 'Solo el docente puede publicar anuncios' });

  const { content, attachments = [], maps = [] } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'El contenido es requerido' });

  const { lastInsertRowid: announcementId } = db.run(
    'INSERT INTO group_announcements (group_id, author_id, content) VALUES (?,?,?)',
    [gid, req.user.id, content.trim()]
  );

  const savedAttachments = [];
  for (const att of attachments) {
    db.run(
      'INSERT INTO announcement_attachments (announcement_id, file_url, file_name, file_type, file_size) VALUES (?,?,?,?,?)',
      [announcementId, att.file_url, att.file_name, att.file_type || null, att.file_size || null]
    );
    savedAttachments.push(att);
  }

  const savedMaps = [];
  for (const m of maps) {
    const mapRow = db.get('SELECT title, public_id FROM maps WHERE id = ?', [m.map_id]);
    if (mapRow) {
      db.run(
        'INSERT INTO announcement_maps (announcement_id, map_id, map_title, map_public_id) VALUES (?,?,?,?)',
        [announcementId, m.map_id, mapRow.title, mapRow.public_id]
      );
      savedMaps.push({ map_id: m.map_id, map_title: mapRow.title, map_public_id: mapRow.public_id });
    }
  }

  const author = db.get('SELECT name, avatar_url FROM users WHERE id = ?', [req.user.id]);
  res.status(201).json({
    id: announcementId, content: content.trim(),
    attachments: savedAttachments, maps: savedMaps,
    created_at: new Date().toISOString(),
    author_id: req.user.id, author_name: author.name, author_avatar: author.avatar_url,
  });
});

// DELETE /api/groups/:id/announcements/:announcementId
router.delete('/:id/announcements/:announcementId', auth, resolveGroup, (req, res) => {
  const gid = req.groupId;
  const membership = db.get('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [gid, req.user.id]);
  if (!membership || !['admin', 'teacher'].includes(membership.role))
    return res.status(403).json({ message: 'Sin permiso' });

  const a = db.get('SELECT id FROM group_announcements WHERE id = ? AND group_id = ?', [req.params.announcementId, gid]);
  if (!a) return res.status(404).json({ message: 'Anuncio no encontrado' });

  db.run('DELETE FROM announcement_attachments WHERE announcement_id = ?', [req.params.announcementId]);
  db.run('DELETE FROM group_announcements WHERE id = ?', [req.params.announcementId]);
  res.json({ message: 'Anuncio eliminado' });
});

module.exports = router;
