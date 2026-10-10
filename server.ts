import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverRegistrationWindow = {
  registration_open_at:
    process.env.VITE_REGISTRATION_OPEN_AT || '2026-09-25T00:00:00+03:00',
  registration_close_at:
    process.env.VITE_REGISTRATION_CLOSE_AT || '2026-10-11T23:59:59+03:00'
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side registration deadline validation endpoint
  app.post('/api/register', (req, res) => {
    const openIso =
      req.body?.openAt || serverRegistrationWindow.registration_open_at;
    const closeIso =
      req.body?.closeAt || serverRegistrationWindow.registration_close_at;

    const openTime = new Date(openIso).getTime();
    const closeTime = new Date(closeIso).getTime();
    const now = Date.now();

    if (now < openTime) {
      res.status(403).json({ error: 'REGISTRATION_NOT_OPEN_YET' });
      return;
    }

    if (now > closeTime) {
      res.status(403).json({ error: 'REGISTRATION_CLOSED' });
      return;
    }

    if (!req.body?.attendance_commitment_confirmed) {
      res.status(400).json({ error: 'COMMITMENT_REQUIRED' });
      return;
    }

    res.status(200).json({ ok: true });
  });

  // Server-side registration window settings update
  app.post('/api/settings', (req, res) => {
    if (req.body?.registration_open_at && req.body?.registration_close_at) {
      serverRegistrationWindow = {
        registration_open_at: req.body.registration_open_at,
        registration_close_at: req.body.registration_close_at
      };
    }
    res.status(200).json(serverRegistrationWindow);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
