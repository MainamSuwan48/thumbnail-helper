import type { FastifyInstance } from 'fastify';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createReadStream } from 'node:fs';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

export async function filesRoutes(app: FastifyInstance) {
  // List image files in a directory
  app.get<{ Querystring: { dir: string } }>('/list', async (req, reply) => {
    const { dir } = req.query;
    if (!dir) return reply.status(400).send({ error: 'Missing dir param' });

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase()))
        .map((e) => ({
          name: e.name,
          path: path.join(dir, e.name).replace(/\\/g, '/'),
        }));
      return { files };
    } catch {
      return reply.status(404).send({ error: 'Directory not found or not accessible' });
    }
  });

  // Serve an image file by absolute path
  app.get<{ Querystring: { path: string } }>('/image', async (req, reply) => {
    const filePath = req.query.path;
    if (!filePath) return reply.status(400).send({ error: 'Missing path param' });

    const ext = path.extname(filePath).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) return reply.status(400).send({ error: 'Not an image file' });

    try {
      await fs.access(filePath);
    } catch {
      return reply.status(404).send({ error: 'File not found' });
    }

    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.gif': 'image/gif',
    };

    reply.header('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
    reply.header('Cache-Control', 'public, max-age=3600');
    return reply.send(createReadStream(filePath));
  });
}
