require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/maps/generate', require('./routes/generate'));
app.use('/api/maps',         require('./routes/maps'));
app.use('/api/groups',       require('./routes/groups'));
app.use('/api/leaderboard',  require('./routes/leaderboard'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/sessions',     require('./routes/sessions'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/upload',       require('./routes/upload'));
app.use('/api/communities',  require('./routes/communities'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Almacén de usuarios activos por mapa en memoria: mapId -> { socketId: { userId, name, email } }
const activeUsersByMap = {};

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on('join-map', ({ mapId, userId, name, email }) => {
    socket.mapId = mapId;
    socket.user = { userId, name, email };
    socket.join(`map:${mapId}`);

    if (!activeUsersByMap[mapId]) {
      activeUsersByMap[mapId] = {};
    }
    activeUsersByMap[mapId][socket.id] = { userId, name, email, socketId: socket.id };

    // Emitir lista actualizada de usuarios activos a todos en la sala
    io.to(`map:${mapId}`).emit('active-users', Object.values(activeUsersByMap[mapId]));
  });

  socket.on('mouse-move', ({ x, y }) => {
    if (socket.mapId && socket.user) {
      socket.to(`map:${socket.mapId}`).emit('peer-mouse-move', {
        socketId: socket.id,
        userId: socket.user.userId,
        name: socket.user.name,
        x,
        y
      });
    }
  });

  socket.on('node-select', ({ nodeId }) => {
    if (socket.mapId && socket.user) {
      socket.to(`map:${socket.mapId}`).emit('peer-node-select', {
        socketId: socket.id,
        userId: socket.user.userId,
        nodeId
      });
    }
  });

  socket.on('node-drag', ({ nodeId, x, y }) => {
    if (socket.mapId) {
      socket.to(`map:${socket.mapId}`).emit('peer-node-drag', { nodeId, x, y });
    }
  });

  socket.on('map-changed', () => {
    if (socket.mapId) {
      socket.to(`map:${socket.mapId}`).emit('peer-map-changed');
    }
  });

  socket.on('disconnect', () => {
    const { mapId } = socket;
    if (mapId && activeUsersByMap[mapId]) {
      delete activeUsersByMap[mapId][socket.id];
      if (Object.keys(activeUsersByMap[mapId]).length === 0) {
        delete activeUsersByMap[mapId];
      } else {
        io.to(`map:${mapId}`).emit('active-users', Object.values(activeUsersByMap[mapId]));
      }
    }
    console.log(`Socket desconectado: ${socket.id}`);
  });
});

db.init().then(() => {
  server.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
}).catch((err) => {
  console.error('Error iniciando la base de datos:', err);
  process.exit(1);
});
