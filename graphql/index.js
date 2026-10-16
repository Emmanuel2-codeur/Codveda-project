const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require('@apollo/server/plugin/landingPage/default');
const DataLoader = require('dataloader');
const jwt = require('jsonwebtoken');
const { Product, Category } = require('../models');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

// Un nouveau set de loaders par requête (évite le problème N+1)
function createLoaders() {
  return {
    category: new DataLoader(async (ids) => {
      const rows = await Category.findAll({ where: { id: ids } });
      const map = new Map(rows.map((c) => [c.id, c]));
      return ids.map((id) => map.get(id) || null);
    }),
    productsByCategory: new DataLoader(async (ids) => {
      const rows = await Product.findAll({ where: { categoryId: ids }, order: [['id', 'ASC']] });
      return ids.map((id) => rows.filter((p) => p.categoryId === id));
    }),
  };
}

async function setupGraphQL(app) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });
  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        let user = null;
        const header = req.headers.authorization;
        if (header) {
          try {
            user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
          } catch {
            user = null; // token invalide : on traite comme anonyme
          }
        }
        return { user, loaders: createLoaders() };
      },
    })
  );
}

module.exports = { setupGraphQL };