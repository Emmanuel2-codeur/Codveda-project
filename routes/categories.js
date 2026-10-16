const express = require('express');
const { Category, Product } = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { handleError } = require('../utils/errors');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: { model: Product },
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const category = await Category.create({ name: req.body.name });
    res.status(201).json(category);
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Category.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json({ message: 'Catégorie supprimée' });
  } catch (err) {
    handleError(err, res);
  }
});

module.exports = router;