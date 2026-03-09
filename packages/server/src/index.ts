import Fastify from 'fastify';
import cors from '@fastify/cors';
import { filesRoutes } from './routes/files.js';
import { exportRoutes } from './routes/export.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: 'http://localhost:5173' });

app.register(filesRoutes, { prefix: '/api/files' });
app.register(exportRoutes, { prefix: '/api/export' });

app.listen({ port: 3001, host: '127.0.0.1' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log('Server running at http://localhost:3001');
});
