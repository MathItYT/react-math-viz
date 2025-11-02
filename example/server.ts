import express, { type Response } from 'express';
import type { ServeStaticOptions } from 'serve-static';
import path from 'path';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Resolve paths from the workspace root (works for ts-node and compiled JS)
const ROOT = process.cwd();
const publicDir = path.join(ROOT, 'public');
const libDir = path.join(ROOT, '..', 'dist');

// Disable caching to always pick up latest builds while developing
const noCache: ServeStaticOptions = {
  etag: false,
  maxAge: 0,
  setHeaders: (res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  },
};

app.use('/lib', express.static(libDir, noCache));
app.use(express.static(publicDir, noCache));

app.get('*', (_req: express.Request, res: express.Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Example server listening on http://localhost:${PORT}`);
});
