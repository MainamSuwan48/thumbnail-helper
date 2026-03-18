import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { filesRoutes } from './routes/files.js';
import { exportRoutes } from './routes/export.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || (isProd ? '3000' : '3001'), 10);

// Personal assets live outside the repo in ~/.thumbnail-helper/assets/
const USER_ASSETS_DIR = path.join(os.homedir(), '.thumbnail-helper', 'assets');
fs.mkdirSync(USER_ASSETS_DIR, { recursive: true });

const app = Fastify({ logger: true });

if (!isProd) {
  await app.register(cors, { origin: 'http://localhost:5173' });
}

// Serve personal assets from ~/.thumbnail-helper/assets/
await app.register(fastifyStatic, {
  root: USER_ASSETS_DIR,
  prefix: '/user-assets/',
  decorateReply: !isProd, // avoid double-decorate when prod also registers static
});

app.register(filesRoutes, { prefix: '/api/files' });
app.register(exportRoutes, { prefix: '/api/export' });

// In production, serve the built client files
if (isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (!fs.existsSync(clientDist)) {
    console.error(`Client build not found at ${clientDist}. Run "pnpm build" first.`);
    process.exit(1);
  }

  await app.register(fastifyStatic, {
    root: clientDist,
    prefix: '/',
    decorateReply: false,
  });

  // SPA fallback: serve index.html for non-API routes
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile('index.html');
  });
}

app.listen({ port: PORT, host: '127.0.0.1' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server running at http://localhost:${PORT}`);
});
