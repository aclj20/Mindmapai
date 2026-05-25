const db = require('../db');
const { makeShortId } = require('../utils/shortId');

function uniquePublicId() {
  let pid;
  do { pid = makeShortId(); } while (db.get('SELECT id FROM maps WHERE public_id = ?', [pid]));
  return pid;
}

const MAPS = [
  {
    title: 'Sistema Solar',
    nodes: [
      { label: 'Sistema Solar',  x: 400, y: 300 },
      { label: 'Sol',            x: 400, y: 150 },
      { label: 'Mercurio',       x: 200, y: 200 },
      { label: 'Venus',          x: 250, y: 350 },
      { label: 'Tierra',         x: 550, y: 200 },
      { label: 'Marte',          x: 600, y: 380 },
      { label: 'Júpiter',        x: 150, y: 450 },
      { label: 'Saturno',        x: 500, y: 500 },
      { label: 'Urano',          x: 300, y: 520 },
      { label: 'Neptuno',        x: 680, y: 500 },
      { label: 'Luna',           x: 620, y: 130 },
      { label: 'Gravedad',       x: 100, y: 300 },
    ],
    connections: [
      [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[4,10],[0,11],
    ],
  },
  {
    title: 'Revolución Francesa',
    nodes: [
      { label: 'Revolución Francesa',  x: 400, y: 300 },
      { label: 'Causas',               x: 200, y: 150 },
      { label: 'Crisis económica',     x: 100, y: 250 },
      { label: 'Desigualdad social',   x: 150, y: 380 },
      { label: 'Ideas ilustradas',     x: 300, y: 100 },
      { label: 'Consecuencias',        x: 600, y: 150 },
      { label: 'Declaración DDHH',     x: 700, y: 250 },
      { label: 'Fin monarquía',        x: 650, y: 380 },
      { label: 'Código Napoleónico',   x: 750, y: 480 },
      { label: 'Fases',                x: 400, y: 500 },
      { label: 'La Bastilla',          x: 250, y: 480 },
      { label: 'El Terror',            x: 350, y: 580 },
      { label: 'Directorio',           x: 500, y: 560 },
    ],
    connections: [
      [0,1],[0,5],[0,9],[1,2],[1,3],[1,4],[5,6],[5,7],[5,8],[9,10],[9,11],[9,12],
    ],
  },
  {
    title: 'Ciclo del Agua',
    nodes: [
      { label: 'Ciclo del Agua',  x: 400, y: 300 },
      { label: 'Evaporación',     x: 200, y: 150 },
      { label: 'Condensación',    x: 600, y: 150 },
      { label: 'Precipitación',   x: 650, y: 350 },
      { label: 'Infiltración',    x: 500, y: 480 },
      { label: 'Escorrentía',     x: 300, y: 480 },
      { label: 'Océanos',         x: 150, y: 350 },
      { label: 'Nubes',           x: 400, y: 100 },
      { label: 'Agua subterránea',x: 550, y: 570 },
    ],
    connections: [
      [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,7],[2,7],[3,4],[3,5],[4,8],[5,6],
    ],
  },
];

async function main() {
  await db.init();

  // Buscar usuario
  const user = db.get(
    `SELECT id, name FROM users WHERE name LIKE ?`,
    ['%Fernando%']
  );

  if (!user) {
    const all = db.all('SELECT id, name, email FROM users');
    console.log('\nNo se encontró a Fernando Castillo. Usuarios en la BD:');
    all.forEach(u => console.log(`  [${u.id}] ${u.name} — ${u.email}`));
    process.exit(1);
  }

  console.log(`\nInsertando mapas para: ${user.name} (id=${user.id})`);

  for (const map of MAPS) {
    // Evitar duplicados
    const exists = db.get(
      'SELECT id FROM maps WHERE owner_id = ? AND title = ?',
      [user.id, map.title]
    );
    if (exists) {
      console.log(`  ⚠  "${map.title}" ya existe, se omite`);
      continue;
    }

    // Crear mapa
    const { lastInsertRowid: mapId } = db.run(
      `INSERT INTO maps (title, owner_id, is_public, public_id, node_count, updated_at)
       VALUES (?, ?, 0, ?, ?, datetime('now', '-' || ? || ' hours'))`,
      [map.title, user.id, uniquePublicId(), map.nodes.length, Math.floor(Math.random() * 72)]
    );

    // Insertar nodos y guardar mapa de ids temporales → reales
    const idMap = {};
    map.nodes.forEach((n, i) => {
      const { lastInsertRowid: nodeId } = db.run(
        `INSERT INTO map_nodes (map_id, x, y, label, category, tags, stats)
         VALUES (?, ?, ?, ?, 'concept', '[]', '{}')`,
        [mapId, n.x, n.y, n.label]
      );
      idMap[i] = nodeId;
    });

    // Insertar conexiones
    for (const [from, to] of map.connections) {
      if (idMap[from] && idMap[to]) {
        db.run(
          'INSERT OR IGNORE INTO map_connections (map_id, from_node_id, to_node_id) VALUES (?,?,?)',
          [mapId, idMap[from], idMap[to]]
        );
      }
    }

    console.log(`  ✓  "${map.title}" — ${map.nodes.length} nodos, ${map.connections.length} conexiones`);
  }

  console.log('\nDatos insertados correctamente.\n');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
