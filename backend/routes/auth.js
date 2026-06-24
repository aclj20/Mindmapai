const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mindmapai_secret_dev_key';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Todos los campos son requeridos' });

  if (db.get('SELECT id FROM users WHERE email = ?', [email]))
    return res.status(409).json({ message: 'El email ya está registrado' });

  const password_hash = await bcrypt.hash(password, 10);
  const { lastInsertRowid: id } = db.run(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, password_hash]
  );

  const user = { id, name, email };
  res.status(201).json({ token: signToken(user), user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });

  const row = db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!row) return res.status(401).json({ message: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });

  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  res.json({ token: signToken(user), user });
});

module.exports = router;
