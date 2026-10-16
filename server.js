require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // frontend vanilla (Niveau 1)

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));

const PORT = process.env.PORT || 5000;

sequelize
  .sync({ alter: true }) // crée / met à jour les tables automatiquement
  .then(() => {
    console.log('Base de données synchronisée');
    app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Erreur de connexion à la base :', err.message);
  });
