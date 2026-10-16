require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { sequelize } = require('./models');
const { initSocket } = require('./socket');
const { setupGraphQL } = require('./graphql');

const app = express();
app.use(compression());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

sequelize
  .sync(process.env.NODE_ENV === 'production' ? {} : { alter: true })
  .then(async () => {
    console.log('Base de données synchronisée');
    await setupGraphQL(app);
    server.listen(PORT, () => {
      console.log(`Serveur REST + WebSocket : http://localhost:${PORT}`);
      console.log(`GraphQL : http://localhost:${PORT}/graphql`);
    });
  })
  .catch((err) => {
    console.error('Erreur de démarrage :', err.message);
  });