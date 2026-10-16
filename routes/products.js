const express = require('express');
const { Product, Category } = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { handleError } = require('../utils/errors');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const where = {};
    if (req.query.categoryId) where.categoryId = req.query.categoryId;
    const products = await Product.findAll({
      where,
      include: { model: Category },
      order: [['id', 'ASC']],
    });
    res.json(products);
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, { include: { model: Category } });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(product);
  } catch (err) {
    handleError(err, res);
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, price, quantity, categoryId } = req.body;
    const product = await Product.create({ name, price, quantity, categoryId: categoryId || null });
    const full = await Product.findByPk(product.id, { include: { model: Category } });
    res.status(201).json(full);
  } catch (err) {
    handleError(err, res);
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    const { name, price, quantity, categoryId } = req.body;
    await product.update({ name, price, quantity, categoryId: categoryId || null });
    const full = await Product.findByPk(product.id, { include: { model: Category } });
    res.json(full);
  } catch (err) {
    handleError(err, res);
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    handleError(err, res);
  }
});

module.exports = router;