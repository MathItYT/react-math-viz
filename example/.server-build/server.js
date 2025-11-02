"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
// Resolve paths from the workspace root (works for ts-node and compiled JS)
const ROOT = process.cwd();
const publicDir = path_1.default.join(ROOT, 'public');
const libDir = path_1.default.join(ROOT, '..', 'dist');
// Disable caching to always pick up latest builds while developing
const noCache = {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    },
};
app.use('/lib', express_1.default.static(libDir, noCache));
app.use(express_1.default.static(publicDir, noCache));
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(publicDir, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`Example server listening on http://localhost:${PORT}`);
});
