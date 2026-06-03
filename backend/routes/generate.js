const express  = require('express');
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const Groq     = require('groq-sdk');
const db       = require('../db');
const auth     = require('../middleware/auth');
const { awardXP, updateStreak } = require('../utils/gamification');
const { makeShortId }           = require('../utils/shortId');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['text/plain', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|pdf|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Usa TXT, PDF o DOCX.'));
    }
  },
});

function uniquePublicId() {
  let pid;
  do { pid = makeShortId(); } while (db.get('SELECT id FROM maps WHERE public_id = ?', [pid]));
  return pid;
}

const router = express.Router();

// 2-ring layout: root at center, level-1 nodes on inner ring, deeper nodes on outer ring.
// Radii adapt to the number of nodes so cards never overlap.
function computeLayout(nodes, connections) {
  if (nodes.length === 0) return {};
  const CENTER = { x: 500, y: 380 };
  if (nodes.length === 1) return { [nodes[0].id]: CENTER };

  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const c of connections) {
    if (adj[c.from] !== undefined) adj[c.from].push(c.to);
  }

  const levels = { [nodes[0].id]: 0 };
  const queue  = [nodes[0].id];
  const visited = new Set([nodes[0].id]);

  while (queue.length) {
    const cur = queue.shift();
    for (const next of adj[cur] || []) {
      if (!visited.has(next)) {
        visited.add(next);
        levels[next] = levels[cur] + 1;
        queue.push(next);
      }
    }
  }

  for (const n of nodes) {
    if (levels[n.id] === undefined) levels[n.id] = 1;
  }

  const inner = nodes.filter(n => levels[n.id] === 1).map(n => n.id);
  const outer = nodes.filter(n => levels[n.id] >  1).map(n => n.id);

  const NODE_W = 190; // approx max card width — determines min arc spacing
  const rInner = Math.max(190, Math.ceil((inner.length * NODE_W) / (2 * Math.PI)));
  const rOuter = Math.max(rInner + 200, Math.ceil((outer.length * NODE_W) / (2 * Math.PI)));

  const positions = { [nodes[0].id]: CENTER };

  inner.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / inner.length - Math.PI / 2;
    positions[id] = {
      x: Math.round(CENTER.x + rInner * Math.cos(angle)),
      y: Math.round(CENTER.y + rInner * Math.sin(angle)),
    };
  });

  outer.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / outer.length - Math.PI / 2;
    positions[id] = {
      x: Math.round(CENTER.x + rOuter * Math.cos(angle)),
      y: Math.round(CENTER.y + rOuter * Math.sin(angle)),
    };
  });

  return positions;
}

async function generateFromText(req, res) {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Texto requerido' });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ message: 'GROQ_API_KEY no configurada en el servidor' });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres un experto pedagógico que genera mapas conceptuales estructurados. Devuelve siempre JSON válido con el formato exacto solicitado, sin texto adicional.',
        },
        {
          role: 'user',
          content: `Analiza el siguiente texto y genera un mapa conceptual.

Devuelve ÚNICAMENTE JSON válido con esta estructura exacta:
{
  "title": "Título conciso del mapa (máx 5 palabras)",
  "nodes": [
    { "id": "n1", "label": "Concepto principal", "description": "Descripción breve" }
  ],
  "connections": [
    { "from": "n1", "to": "n2" }
  ]
}

Reglas:
- Extrae entre 8 y 15 conceptos clave
- El PRIMER nodo debe ser el concepto central/principal
- Etiquetas: máx 4 palabras, concisas
- Descripciones: OBLIGATORIAS para cada nodo, entre 2 y 4 oraciones. Explica qué es el concepto, por qué es relevante dentro del tema y cómo se relaciona con los demás nodos del mapa
- Crea conexiones que representen relaciones significativas entre conceptos
- Devuelve ÚNICAMENTE el JSON

Texto a analizar:
"""
${text.slice(0, 4000)}
"""`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const raw     = JSON.parse(completion.choices[0].message.content);
    const aiNodes = Array.isArray(raw.nodes)       ? raw.nodes       : [];
    const aiConns = Array.isArray(raw.connections) ? raw.connections : [];
    const title   = raw.title || 'Mapa conceptual';

    if (aiNodes.length === 0) {
      return res.status(422).json({ message: 'No se pudieron extraer conceptos del texto' });
    }

    const positions = computeLayout(aiNodes, aiConns);

    try {
      const rawGroupId = req.body.group_id;
      const groupId = rawGroupId && rawGroupId !== 'null' && rawGroupId !== 'undefined' ? parseInt(rawGroupId) : null;

      const { lastInsertRowid: mapId } = db.run(
        `INSERT INTO maps (title, owner_id, is_public, public_id, node_count, updated_at, group_id)
         VALUES (?, ?, 0, ?, ?, datetime('now'), ?)`,
        [title, req.user.id, uniquePublicId(), aiNodes.length, groupId]
      );

      const idMap = {};
      for (let i = 0; i < aiNodes.length; i++) {
        const n   = aiNodes[i];
        const pos = positions[n.id] || { x: 500, y: 350 };
        const { lastInsertRowid: nodeId } = db.run(
          `INSERT INTO map_nodes (map_id, x, y, label, category, description, tags, stats)
           VALUES (?, ?, ?, ?, ?, ?, '[]', '{}')`,
          [mapId, pos.x, pos.y, n.label, i === 0 ? 'main' : 'concept', n.description || null]
        );
        idMap[n.id] = nodeId;
      }

      for (const c of aiConns) {
        const fromId = idMap[c.from];
        const toId   = idMap[c.to];
        if (fromId && toId) {
          db.run(
            'INSERT OR IGNORE INTO map_connections (map_id, from_node_id, to_node_id) VALUES (?,?,?)',
            [mapId, fromId, toId]
          );
        }
      }

      awardXP(req.user.id, 50, 'map_created');
      updateStreak(req.user.id);

      const saved = db.get('SELECT public_id FROM maps WHERE id = ?', [mapId]);
      res.status(201).json({ id: mapId, public_id: saved.public_id, title });

    } catch (dbErr) {
      console.error('Error BD al guardar mapa generado:', dbErr.message);
      res.status(500).json({ message: 'El mapa se generó pero no se pudo guardar en la base de datos' });
    }

  } catch (err) {
    console.error('Error Groq:', err.message);
    res.status(500).json({ message: 'Error al conectar con la IA' });
  }
}

// POST /api/maps/generate
router.post('/', auth, generateFromText);

// POST /api/maps/generate/file
router.post('/file', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Archivo requerido' });

  let text = '';
  try {
    const mime = req.file.mimetype;
    const name = req.file.originalname.toLowerCase();

    if (mime === 'text/plain' || name.endsWith('.txt')) {
      text = req.file.buffer.toString('utf-8');
    } else if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text;
    } else if (name.endsWith('.docx') || mime.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else {
      return res.status(400).json({ message: 'Tipo de archivo no soportado' });
    }
  } catch (parseErr) {
    console.error('Error al leer archivo:', parseErr.message);
    return res.status(422).json({ message: 'No se pudo leer el archivo' });
  }

  text = text.trim();
  if (!text) return res.status(422).json({ message: 'El archivo está vacío o no contiene texto legible' });

  // Reusar la misma lógica de generación
  req.body.text = text;
  return generateFromText(req, res);
});

module.exports = router;
