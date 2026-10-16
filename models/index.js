const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define(
  'User',
  {
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: { msg: 'Email invalide' } },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'user',
      validate: { isIn: { args: [['user', 'admin']], msg: 'Rôle invalide' } },
    },
  },
  { tableName: 'users', createdAt: 'created_at', updatedAt: false }
);

const Category = sequelize.define(
  'Category',
  {
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: { notEmpty: { msg: 'Le nom de catégorie est requis' } },
    },
  },
  { tableName: 'categories', timestamps: false }
);

const Product = sequelize.define(
  'Product',
  {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'Le nom du produit est requis' } },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0], msg: 'Le prix doit être positif' } },
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: { msg: 'La quantité doit être un entier' },
        min: { args: [0], msg: 'La quantité doit être positive' },
      },
    },
  },
  {
    tableName: 'products',
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ fields: ['category_id'] }, { fields: ['name'] }],
  }
);

Category.hasMany(Product, {
  foreignKey: { name: 'categoryId', field: 'category_id', allowNull: true },
  onDelete: 'SET NULL',
});
Product.belongsTo(Category, {
  foreignKey: { name: 'categoryId', field: 'category_id', allowNull: true },
});

module.exports = { sequelize, User, Category, Product };