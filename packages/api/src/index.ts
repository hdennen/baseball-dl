import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { createPool, createDAL } from '@baseball-dl/dal';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { createContextBuilder } from './context.js';
import type { ApiContext } from './context.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const PORT = parseInt(process.env.PORT ?? '4000', 10);

const pool = createPool(DATABASE_URL);
const dal = createDAL(pool);

const app = express();

const server = new ApolloServer<ApiContext>({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  '/graphql',
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, {
    context: createContextBuilder(dal),
  })
);

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}/graphql`);
});
