import { readFile, writeFile } from 'node:fs/promises';

const modelUrl = process.env.FACE_PARSER_PUBLIC_URL;
if (!modelUrl) throw new Error('FACE_PARSER_PUBLIC_URL is required for the Pages deployment.');

const modelOrigin = new URL(modelUrl).origin;
const headersPath = new URL('../dist/_headers', import.meta.url);
const headers = await readFile(headersPath, 'utf8');
const updated = headers.replace(/connect-src 'self';/, `connect-src 'self' ${modelOrigin};`);
if (updated === headers) throw new Error('Could not locate connect-src in dist/_headers.');
await writeFile(headersPath, updated);
