const typeDefs = `#graphql
  type User {
    id: Int!
    email: String!
    role: String!
  }

  type Category {
    id: Int!
    name: String!
    products: [Product!]!
  }

  type Product {
    id: Int!
    name: String!
    price: Float!
    quantity: Int!
    category: Category
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    products(categoryId: Int, limit: Int, offset: Int): [Product!]!
    product(id: Int!): Product
    categories: [Category!]!
    me: User
  }

  type Mutation {
    signup(email: String!, password: String!): User!
    login(email: String!, password: String!): AuthPayload!
    createCategory(name: String!): Category!
    createProduct(name: String!, price: Float!, quantity: Int, categoryId: Int): Product!
    updateProduct(id: Int!, name: String, price: Float, quantity: Int, categoryId: Int): Product!
    deleteProduct(id: Int!): Boolean!
  }
`;

module.exports = typeDefs;