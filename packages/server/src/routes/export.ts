import type { FastifyInstance } from 'fastify';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

interface ExportBody {
  dataUrl: string;   // base64 PNG from Konva stage export
  outputPath?: string; // optional custom output path
}

export async function exportRoutes(app: FastifyInstance) {
  app.post<{ Body: ExportBody }>('/banner', async (req, reply) => {
    const { dataUrl, outputPath } = req.body;

    if (!dataUrl?.startsWith('data:image/')) {
      return reply.status(400).send({ error: 'Invalid dataUrl' });
    }

    const base64 = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');

    const outDir = outputPath ?? path.join(os.homedir(), 'Pictures', 'thumbnail-helper');
    await fs.mkdir(outDir, { recursive: true });

    const filename = `banner-${Date.now()}.png`;
    const fullPath = path.join(outDir, filename);
    await fs.writeFile(fullPath, buffer);

    return { path: fullPath.replace(/\\/g, '/'), filename };
  });
}
