const express = require('express');
const Groq    = require('groq-sdk');
const db      = require('../db');
const auth    = require('../middleware/auth');
const { awardXP, updateStreak } = require('../utils/gamification');
const { makeShortId }           = require('../utils/shortId');

function uniquePublicId() {
  let pid;
  do { pid = makeShortId(); } while (db.get('SELECT id FROM maps WHERE public_id = ?', [pid]));
  return pid;
}

const router = express.Router();

// Radial tree layout — nivel 0 en el centro, niveles siguientes en círculos concéntricos
function computeLayout(nodes, connections) {
  const CENTER = { x: 500, y: 350 };
  const RADII  = [0, 220, 400, 540];

  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const c of connections) {
    if (adj[c.from] !== undefined) adj[c.from].push(c.to);
  }

  const levels  = {};
  const queue   = [nodes[0].id];
  const visited = new Set([nodes[0].id]);
  levels[nodes[0].id] = 0;

  while (queue.length) {
    const cur = queue.shift();
    for (const next of (adj[cur] || [])) {
      if (!visited.has(next)) {
        visited.add(next);
        levels[next] = (levels[cur] || 0) + 1;
        queue.push(next);
      }
    }
  }

  for (const n of nodes) {
    if (levels[n.id] === undefined) levels[n.id] = 1;
  }

  const byLevel = {};
  for (const [id, level] of Object.entries(levels)) {
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(id);
  }

  const positions = {};
  for (const [levelStr, ids] of Object.entries(byLevel)) {
    const level  = parseInt(levelStr);
    const radius = RADII[Math.min(level, RADII.length - 1)];

    if (level === 0) {
      positions[ids[0]] = CENTER;
      continue;
    }

    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2;
      positions[id] = {
        x: Math.round(CENTER.x + radius * Math.cos(angle)),
        y: Math.round(CENTER.y + radius * Math.sin(angle)),
      };
    });
  }

  return positions;
}

// POST /api/maps/generate
router.post('/', auth, async (req, res) => {
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
- Etiquetas: máx 4 palabras
- Descripciones: opcionales, máx 20 palabras
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
      const { lastInsertRowid: mapId } = db.run(
        `INSERT INTO maps (title, owner_id, is_public, public_id, node_count, updated_at)
         VALUES (?, ?, 0, ?, ?, datetime('now'))`,
        [title, req.user.id, uniquePublicId(), aiNodes.length]
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
});

module.exports = router;
