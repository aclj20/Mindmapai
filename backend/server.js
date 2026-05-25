require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/maps',         require('./routes/maps'));
app.use('/api/groups',       require('./routes/groups'));
app.use('/api/leaderboard',  require('./routes/leaderboard'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/sessions',     require('./routes/sessions'));
app.use('/api/maps/generate', require('./routes/generate'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

db.init().then(() => {
  app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
}).catch((err) => {
  console.error('Error iniciando la base de datos:', err);
  process.exit(1);
});
