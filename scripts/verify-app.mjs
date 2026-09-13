import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker.js', import.meta.url), 'utf8');

assert.match(html, /id="main-content"/, 'The page needs a main landmark.');
assert.match(html, /href="#main-content"/, 'The page needs a skip link.');
assert.match(html, /for="apiKey"/, 'The API key field needs a label.');
assert.match(html, /btnApiTest/, 'The app needs the connection-test button.');
assert.match(html, /showAdvancedTemplates/, 'The app needs the simple template view.');
assert.match(html, /id="qualityCard"/, 'The app needs the prompt quality linter card.');
assert.match(html, /id="navArena"/, 'The app needs the model arena navigation button.');
assert.match(html, /id="btnArenaRunBoth"/, 'The app needs the arena dual-run button.');
assert.match(html, /id="navVersions"/, 'The app needs the prompt versions navigation button.');
assert.match(html, /id="versionsModal"/, 'The app needs the prompt versions modal.');
assert.match(html, /id="btnVersionSave"/, 'The app needs the save-version button.');
assert.match(html, /systemInstructions/, 'The app needs the Guided/Extended system instructions field.');
assert.match(html, /retrievedContext/, 'The app needs the Guided/Extended retrieved context field.');
assert.match(html, /toolAccess/, 'The app needs the Guided/Extended tool access field.');
assert.match(html, /modelSettings/, 'The app needs the Guided/Extended model settings field.');
assert.match(html, /conversationHistory/, 'The app needs the Guided/Extended conversation history field.');
assert.match(html, /knowledgeFiles/, 'The app needs the Guided/Extended knowledge/files field.');
assert.match(html, /userState/, 'The app needs the Guided/Extended user state field.');

assert.match(worker, /request\.method === 'OPTIONS'/, 'Worker must support the connection check.');
assert.match(worker, /url\.pathname === '\/api\/run'/, 'Worker must expose the run endpoint.');

console.log('All app checks passed.');
