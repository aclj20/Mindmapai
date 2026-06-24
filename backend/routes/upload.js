const express = require('express');
const multer  = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const auth = require('../middleware/auth');
const db   = require('../db');

const router = express.Router();

// ── Cliente S3 ────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET     = process.env.S3_BUCKET_NAME || '';
const REGION     = process.env.AWS_REGION || 'us-east-1';
// Si no se define S3_PUBLIC_URL se construye automáticamente desde bucket + región
const PUBLIC_URL = (process.env.S3_PUBLIC_URL || `https://${BUCKET}.s3.${REGION}.amazonaws.com`).replace(/\/$/, '');

// ── Multer avatares (solo imágenes, máx 5 MB) ────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo se permiten imágenes'));
    cb(null, true);
  },
});

// ── Multer adjuntos (cualquier tipo, máx 20 MB) ───────────────────────────────

const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 },
});

// ── POST /api/upload/avatar ───────────────────────────────────────────────────

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });

  if (!BUCKET) {
    return res.status(503).json({ message: 'S3 no configurado: define las variables de entorno de AWS' });
  }

  try {
    // Eliminar avatar anterior si es de S3
    const current = db.get('SELECT avatar_url FROM users WHERE id = ?', [req.user.id]);
    if (current?.avatar_url && current.avatar_url.startsWith(PUBLIC_URL)) {
      const oldKey = current.avatar_url.replace(`${PUBLIC_URL}/`, '');
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey })).catch(() => {});
    }

    // Subir nueva imagen
    const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const key = `mindmapa/avatars/${req.user.id}-${Date.now()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const url = `${PUBLIC_URL}/${key}`;

    // Guardar URL en DB
    db.run('UPDATE users SET avatar_url = ? WHERE id = ?', [url, req.user.id]);

    res.json({ url });
  } catch (err) {
    console.error('S3 upload error:', err);
    res.status(500).json({ message: 'Error al subir la imagen a S3' });
  }
});

// ── POST /api/upload/community-image ─────────────────────────────────────────

router.post('/community-image', auth, uploadAttachment.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });
  if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ message: 'Solo se permiten imágenes' });
  if (!BUCKET) return res.status(503).json({ message: 'S3 no configurado' });
  try {
    const ext = req.file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const type = req.query.type === 'banner' ? 'banners' : 'icons';
    const key = `mindmapa/communities/${type}/${req.user.id}-${Date.now()}.${ext}`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype }));
    res.json({ url: `${PUBLIC_URL}/${key}` });
  } catch (err) {
    console.error('S3 community-image error:', err);
    res.status(500).json({ message: 'Error al subir la imagen' });
  }
});

// ── POST /api/upload/attachment ───────────────────────────────────────────────

router.post('/attachment', auth, uploadAttachment.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });
  if (!BUCKET) return res.status(503).json({ message: 'S3 no configurado: define las variables de entorno de AWS' });

  try {
    const originalName = req.file.originalname;
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const key = `mindmapa/attachments/${req.user.id}-${Date.now()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    res.json({
      file_url:  `${PUBLIC_URL}/${key}`,
      file_name: originalName,
      file_type: req.file.mimetype,
      file_size: req.file.size,
    });
  } catch (err) {
    console.error('S3 attachment upload error:', err);
    res.status(500).json({ message: 'Error al subir el archivo' });
  }
});

module.exports = router;
