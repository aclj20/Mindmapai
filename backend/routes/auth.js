const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mindmapai_secret_dev_key';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function codeExpiresAt() {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString();
}

// ── Registro ────────────────────────────────────────────────────────────────

// Paso 1: envía código de verificación al email
router.post('/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  if (db.get('SELECT id FROM users WHERE email = ?', [email]))
    return res.status(409).json({ message: 'El email ya está registrado' });

  const code = generateCode();
  db.run("DELETE FROM email_verification_codes WHERE email = ? AND type = 'register'", [email]);
  db.run(
    "INSERT INTO email_verification_codes (email, code, expires_at, type) VALUES (?, ?, ?, 'register')",
    [email, code, codeExpiresAt()]
  );

  try {
    await sendVerificationEmail(email, code);
    res.json({ message: 'Código enviado' });
  } catch (err) {
    console.error('Error al enviar email:', err.message);
    res.status(500).json({ message: 'No se pudo enviar el correo de verificación' });
  }
});

// Paso 2: verifica el código (sin consumirlo todavía)
router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email y código requeridos' });

  const record = db.get(
    "SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND type = 'register'",
    [email, code]
  );
  if (!record) return res.status(400).json({ message: 'Código inválido' });

  if (new Date(record.expires_at) < new Date()) {
    db.run("DELETE FROM email_verification_codes WHERE email = ? AND type = 'register'", [email]);
    return res.status(400).json({ message: 'El código ha expirado, solicita uno nuevo' });
  }

  res.json({ message: 'Código válido' });
});

// Paso 3: crea la cuenta
router.post('/register', async (req, res) => {
  const { name, email, password, code } = req.body;
  if (!name || !email || !password || !code)
    return res.status(400).json({ message: 'Todos los campos son requeridos' });

  if (db.get('SELECT id FROM users WHERE email = ?', [email]))
    return res.status(409).json({ message: 'El email ya está registrado' });

  const record = db.get(
    "SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND type = 'register'",
    [email, code]
  );
  if (!record) return res.status(400).json({ message: 'Código inválido' });

  if (new Date(record.expires_at) < new Date()) {
    db.run("DELETE FROM email_verification_codes WHERE email = ? AND type = 'register'", [email]);
    return res.status(400).json({ message: 'El código ha expirado, solicita uno nuevo' });
  }

  db.run("DELETE FROM email_verification_codes WHERE email = ? AND type = 'register'", [email]);

  const password_hash = await bcrypt.hash(password, 10);
  const { lastInsertRowid: id } = db.run(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, password_hash]
  );

  const user = { id, name, email, role: 'student' };
  res.status(201).json({ token: signToken(user), user });
});

// ── Recuperación de contraseña ───────────────────────────────────────────────

// Paso 1: envía código de recuperación
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  const user = db.get('SELECT id FROM users WHERE email = ?', [email]);
  // Respuesta genérica para no revelar si el email existe
  if (!user) return res.json({ message: 'Si ese correo está registrado, recibirás un código' });

  const code = generateCode();
  db.run("DELETE FROM email_verification_codes WHERE email = ? AND type = 'reset'", [email]);
  db.run(
    "INSERT INTO email_verification_codes (email, code, expires_at, type) VALUES (?, ?, ?, 'reset')",
    [email, code, codeExpiresAt()]
  );

  try {
    await sendPasswordResetEmail(email, code);
    res.json({ message: 'Si ese correo está registrado, recibirás un código' });
  } catch (err) {
    console.error('Error al enviar email:', err.message);
    res.status(500).json({ message: 'No se pudo enviar el correo de recuperación' });
  }
});

// Paso 2: valida código y actualiza contraseña
router.post('/reset-password', async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password)
    return res.status(400).json({ message: 'Todos los campos son requeridos' });

  const record = db.get(
    "SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND type = 'reset'",
    [email, code]
  );
  if (!record) return res.status(400).json({ message: 'Código inválido' });

  if (new Date(record.expires_at) < new Date()) {
    db.run("DELETE FROM email_verification_codes WHERE email = ? AND type = 'reset'", [email]);
    return res.status(400).json({ message: 'El código ha expirado, solicita uno nuevo' });
  }

  db.run("DELETE FROM email_verification_codes WHERE email = ? AND type = 'reset'", [email]);

  const password_hash = await bcrypt.hash(password, 10);
  db.run('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash, email]);

  res.json({ message: 'Contraseña actualizada correctamente' });
});

// ── Login ────────────────────────────────────────────────────────────────────

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
