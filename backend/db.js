const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'mindmapai.db');
const DATA_DIR = path.dirname(DB_PATH);

let _db = null;
let _saveTimer = null;

function save() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }, 150);
}

function flushSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

process.on('exit', flushSave);
process.on('SIGINT', () => { flushSave(); process.exit(0); });
process.on('SIGTERM', () => { flushSave(); process.exit(0); });

const db = {
  async init() {
    const SQL = await initSqlJs();
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    if (fs.existsSync(DB_PATH)) {
      const buf = fs.readFileSync(DB_PATH);
      _db = new SQL.Database(buf);
    } else {
      _db = new SQL.Database();
      createSchema();
      flushSave();
    }

    _db.run('PRAGMA foreign_keys = ON');
    console.log('Base de datos lista');
  },

  run(sql, params = []) {
    _db.run(sql, params);
    const res = _db.exec('SELECT last_insert_rowid()');
    const lastInsertRowid = res[0]?.values[0]?.[0] ?? null;
    save();
    return { lastInsertRowid };
  },

  get(sql, params = []) {
    const stmt = _db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  },

  all(sql, params = []) {
    const rows = [];
    const stmt = _db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  },

  exec(sql) {
    _db.exec(sql);
    save();
  },
};

function createSchema() {
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      xp_to_next INTEGER DEFAULT 1000,
      streak INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      last_activity_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      is_public INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      node_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS map_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      label TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'concept',
      description TEXT,
      tags TEXT DEFAULT '[]',
      icon TEXT,
      image TEXT,
      stats TEXT DEFAULT '{}',
      is_sticky INTEGER DEFAULT 0,
      color TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS map_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      from_node_id INTEGER NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
      to_node_id INTEGER NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
      UNIQUE(from_node_id, to_node_id)
    );

    CREATE TABLE IF NOT EXISTS map_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      UNIQUE(map_id, tag)
    );

    CREATE TABLE IF NOT EXISTS map_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(map_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS map_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      map_id INTEGER NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS node_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_id INTEGER NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(node_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      xp_reward INTEGER DEFAULT 0,
      criteria_type TEXT NOT NULL,
      criteria_value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      achievement_id INTEGER NOT NULL REFERENCES achievements(id),
      progress INTEGER DEFAULT 0,
      unlocked_at TEXT,
      UNIQUE(user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher_id INTEGER NOT NULL REFERENCES users(id),
      join_code TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      created_by INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id),
      map_id INTEGER REFERENCES maps(id),
      status TEXT DEFAULT 'pending',
      submitted_at TEXT,
      UNIQUE(assignment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      map_id INTEGER REFERENCES maps(id),
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      duration_minutes INTEGER DEFAULT 0
    );
  `);

  seedAchievements();
}

function seedAchievements() {
  const existing = db.get('SELECT id FROM achievements LIMIT 1');
  if (existing) return;

  const list = [
    ['Explorador',          'Crea tu primer mapa conceptual',        'Trophy',     'text-amber-500 bg-amber-100',   100,  'maps_created',    1],
    ['Creador Pro',         'Crea 20 mapas conceptuales',            'Star',       'text-blue-500 bg-blue-100',     500,  'maps_created',   20],
    ['Racha 7 días',        'Mantén una racha de 7 días',            'Flame',      'text-rose-500 bg-rose-100',     300,  'streak',          7],
    ['Top 10',              'Entra al top 10 del leaderboard',       'Award',      'text-fuchsia-500 bg-fuchsia-100', 400, 'leaderboard_rank', 10],
    ['Maestro de conceptos','Domina 500 conceptos',                  'Target',     'text-teal-500 bg-teal-100',     800,  'concepts_mastered', 500],
    ['Velocista',           'Crea un mapa en menos de 5 minutos',    'Zap',        'text-orange-500 bg-orange-100', 200,  'fast_map',        1],
    ['Rey del leaderboard', 'Alcanza el #1 en tu clase',             'Crown',      'text-amber-600 bg-amber-100',   1000, 'leaderboard_rank', 1],
    ['Popular',             'Recibe 100 me gusta en tus mapas',      'Heart',      'text-pink-500 bg-pink-100',     300,  'total_likes',    100],
    ['Erudito',             'Completa 100 sesiones de estudio',      'BookOpen',   'text-indigo-500 bg-indigo-100', 600,  'study_sessions', 100],
    ['Colaborador',         'Comenta en 50 mapas de otros',          'Users',      'text-cyan-600 bg-cyan-100',     400,  'comments_given',  50],
    ['Imparable',           'Mantén una racha de 30 días',           'TrendingUp', 'text-red-500 bg-red-100',       1500, 'streak',         30],
  ];

  for (const a of list) {
    _db.run(
      'INSERT INTO achievements (name,description,icon,color,xp_reward,criteria_type,criteria_value) VALUES (?,?,?,?,?,?,?)',
      a
    );
  }
}

module.exports = db;
