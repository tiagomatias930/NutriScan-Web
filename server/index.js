import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', 'tmp', 'nutriscan-uploads');
const PORT = process.env.PORT || 5050;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // run cleanup every hour
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* ignore */ }
}

ensureDir(UPLOAD_DIR);

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));

// POST /api/upload
// body: { imageBase64: string (dataURL or raw base64), filename?: string, metadata?: object }
app.post('/api/upload', async (req, res) => {
  try {
    const { imageBase64, filename, metadata } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

    // detect dataURL
    let base64 = imageBase64;
    let ext = 'jpg';
    const dataUrlMatch = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(imageBase64);
    if (dataUrlMatch) {
      const mime = dataUrlMatch[1];
      const mimeType = dataUrlMatch[2];
      base64 = dataUrlMatch[3];
      if (mimeType === 'png') ext = 'png';
      else if (mimeType === 'webp') ext = 'webp';
      else ext = 'jpg';
    }

    const id = randomUUID();
    const folder = path.join(UPLOAD_DIR, id);
    ensureDir(folder);

    const fileName = filename ? `${filename.replace(/[^a-z0-9_.-]/gi, '_')}_${id}.${ext}` : `${id}.${ext}`;
    const filePath = path.join(folder, fileName);

    const buffer = Buffer.from(base64, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    const meta = {
      id,
      filename: fileName,
      originalFilename: filename || null,
      createdAt: Date.now(),
      metadata: metadata || null,
    };
    const metaPath = path.join(folder, 'meta.json');
    await fs.promises.writeFile(metaPath, JSON.stringify(meta, null, 2));

    res.json({ id, file: `/api/image/${id}`, meta: `/api/meta/${id}` });
  } catch (e) {
    console.error('upload error', e);
    res.status(500).json({ error: 'upload failed' });
  }
});

app.get('/api/image/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const folder = path.join(UPLOAD_DIR, id);
    const exists = fs.existsSync(folder);
    if (!exists) return res.status(404).send('Not found');

    const files = await fs.promises.readdir(folder);
    const imageFile = files.find(f => f !== 'meta.json');
    if (!imageFile) return res.status(404).send('Image not found');

    const filePath = path.join(folder, imageFile);
    res.sendFile(filePath);
  } catch (e) {
    console.error(e);
    res.status(500).send('error');
  }
});

app.get('/api/meta/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const metaPath = path.join(UPLOAD_DIR, id, 'meta.json');
    if (!fs.existsSync(metaPath)) return res.status(404).json({ error: 'meta not found' });
    const raw = await fs.promises.readFile(metaPath, 'utf-8');
    const data = JSON.parse(raw);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'error reading meta' });
  }
});

app.get('/api/list', async (req, res) => {
  try {
    const ids = await fs.promises.readdir(UPLOAD_DIR);
    const items = [];
    for (const id of ids) {
      const metaPath = path.join(UPLOAD_DIR, id, 'meta.json');
      if (!fs.existsSync(metaPath)) continue;
      const raw = await fs.promises.readFile(metaPath, 'utf-8');
      const data = JSON.parse(raw);
      items.push({ id, ...data });
    }
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'error listing' });
  }
});

// cleanup job
async function cleanup() {
  try {
    const ids = await fs.promises.readdir(UPLOAD_DIR);
    const now = Date.now();
    for (const id of ids) {
      const metaPath = path.join(UPLOAD_DIR, id, 'meta.json');
      try {
        if (!fs.existsSync(metaPath)) {
          // fallback: remove folder if empty/old
          const stat = await fs.promises.stat(path.join(UPLOAD_DIR, id));
          if (now - stat.mtimeMs > EXPIRY_MS) {
            await fs.promises.rm(path.join(UPLOAD_DIR, id), { recursive: true, force: true });
          }
          continue;
        }
        const raw = await fs.promises.readFile(metaPath, 'utf-8');
        const data = JSON.parse(raw);
        const createdAt = data.createdAt || (await fs.promises.stat(path.join(UPLOAD_DIR, id))).ctimeMs;
        if (now - createdAt > EXPIRY_MS) {
          await fs.promises.rm(path.join(UPLOAD_DIR, id), { recursive: true, force: true });
          console.log('Deleted expired upload', id);
        }
      } catch (e) {
        console.warn('cleanup entry failed', id, e);
      }
    }
  } catch (e) {
    console.error('cleanup error', e);
  }
}

setInterval(cleanup, CLEANUP_INTERVAL_MS);
// run once at start
cleanup();

app.listen(PORT, () => {
  console.log(`NutriScan mini server listening on http://localhost:${PORT}`);
});
