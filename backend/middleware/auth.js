const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'mindmapai_secret_dev_key';

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    // Verificar que el usuario exista en la base de datos
    const userExists = db.get('SELECT id FROM users WHERE id = ?', [decoded.id]);
    if (!userExists) {
      return res.status(401).json({ message: 'Sesión inválida. Por favor, inicia sesión de nuevo.' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
