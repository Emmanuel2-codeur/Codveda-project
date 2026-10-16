const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' },
  });

  // Authentification du socket via le token JWT (optionnelle : les anonymes peuvent regarder)
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next();
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    // Salles : une par utilisateur + une pour les admins
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      if (socket.user.role === 'admin') socket.join('admins');
    }

    io.emit('online:count', io.engine.clientsCount);

    // Communication bidirectionnelle : chat (réservé aux connectés)
    socket.on('chat:send', (text) => {
      if (!socket.user || typeof text !== 'string' || !text.trim()) return;
      io.emit('chat:message', {
        email: socket.user.email,
        text: text.trim().slice(0, 300),
        at: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      io.emit('online:count', io.engine.clientsCount);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };