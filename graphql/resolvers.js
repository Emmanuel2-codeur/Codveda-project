const { GraphQLError } = require('graphql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Product, Category } = require('../models');
const { getIO } = require('../socket');

// ---------- helpers d'authentification ----------
function requireAuth(ctx) {
  if (!ctx.user) {
    throw new GraphQLError('Non authentifié', { extensions: { code: 'UNAUTHENTICATED' } });
  }
}

function requireAdmin(ctx) {
  requireAuth(ctx);
  if (ctx.user.role !== 'admin') {
    throw new GraphQLError('Accès réservé aux administrateurs', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

// ---------- conversion des erreurs Sequelize ----------
function toGraphQLError(err) {
  if (err instanceof GraphQLError) return err;
  const bad = { extensions: { code: 'BAD_USER_INPUT' } };
  if (err.name === 'SequelizeValidationError') {
    return new GraphQLError(err.errors.map((e) => e.message).join(', '), bad);
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return new GraphQLError('Cette valeur existe déjà', bad);
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new GraphQLError('Catégorie inexistante', bad);
  }
  console.error(err);
  return new GraphQLError('Erreur serveur');
}

const safe = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (err) {
    throw toGraphQLError(err);
  }
};

const fullProduct = (id) => Product.findByPk(id, { include: { model: Category } });

const resolvers = {
  Query: {
    products: safe(async (_, { categoryId, limit = 50, offset = 0 }) => {
      const where = {};
      if (categoryId) where.categoryId = categoryId;
      return Product.findAll({
        where,
        order: [['id', 'ASC']],
        limit: Math.min(limit, 100),
        offset,
      });
    }),
    product: safe((_, { id }) => Product.findByPk(id)),
    categories: safe(() => Category.findAll({ order: [['name', 'ASC']] })),
    me: (_, __, ctx) => ctx.user || null,
  },

  Mutation: {
    signup: safe(async (_, { email, password }) => {
      if (password.length < 6) {
        throw new GraphQLError('Le mot de passe doit contenir au moins 6 caractères', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const hashed = await bcrypt.hash(password, 10);
      return User.create({ email, password: hashed });
    }),

    login: safe(async (_, { email, password }) => {
      const user = await User.findOne({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new GraphQLError('Email ou mot de passe incorrect', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );
      return { token, user };
    }),

    createCategory: safe(async (_, { name }, ctx) => {
      requireAuth(ctx);
      return Category.create({ name });
    }),

    createProduct: safe(async (_, args, ctx) => {
      requireAuth(ctx);
      const product = await Product.create({
        name: args.name,
        price: args.price,
        quantity: args.quantity,
        categoryId: args.categoryId || null,
      });
      // Les clients Socket.io reçoivent aussi les produits créés via GraphQL
      getIO()?.emit('product:created', await fullProduct(product.id));
      return product;
    }),

    updateProduct: safe(async (_, { id, ...fields }, ctx) => {
      requireAuth(ctx);
      const product = await Product.findByPk(id);
      if (!product) {
        throw new GraphQLError('Produit non trouvé', { extensions: { code: 'NOT_FOUND' } });
      }
      // On ne modifie que les champs réellement envoyés
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );
      await product.update(updates);
      getIO()?.emit('product:updated', await fullProduct(id));
      return product;
    }),

    deleteProduct: safe(async (_, { id }, ctx) => {
      requireAdmin(ctx);
      const deleted = await Product.destroy({ where: { id } });
      if (!deleted) {
        throw new GraphQLError('Produit non trouvé', { extensions: { code: 'NOT_FOUND' } });
      }
      getIO()?.emit('product:deleted', { id });
      return true;
    }),
  },

  Product: {
    price: (p) => parseFloat(p.price),
    // DataLoader : toutes les catégories demandées sont chargées en UNE seule requête SQL
    category: (p, _, ctx) => (p.categoryId ? ctx.loaders.category.load(p.categoryId) : null),
  },

  Category: {
    products: (c, _, ctx) => ctx.loaders.productsByCategory.load(c.id),
  },
};

module.exports = resolvers;