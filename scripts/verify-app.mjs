import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker.js', import.meta.url), 'utf8');

assert.match(html, /id="main-content"/, 'The page needs a main landmark.');
assert.match(html, /href="#main-content"/, 'The page needs a skip link.');
assert.match(html, /for="apiKey"/, 'The API key field needs a label.');
assert.match(html, /btnApiTest/, 'The app needs the connection-test button.');
assert.match(html, /showAdvancedTemplates/, 'The app needs the simple template view.');

assert.match(worker, /request\.method === 'OPTIONS'/, 'Worker must support the connection check.');
assert.match(worker, /url\.pathname === '\/api\/run'/, 'Worker must expose the run endpoint.');

console.log('All app checks passed.');
