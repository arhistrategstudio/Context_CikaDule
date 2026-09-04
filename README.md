# NEON//CONTEXT — Context_CikaDule

LIVE DEMO

Live demo: https://arhistrategstudio.github.io/Context_CikaDule/

OVERVIEW

NEON//CONTEXT is a small frontend + Cloudflare Worker backend that acts as a prompt-engineering console and proxy to multiple model providers (OpenAI, OpenRouter, Anthropic, Google Gemini, Cloudflare Workers AI, or a local OpenAI-compatible server).

This repository contains a static frontend (`index.html`) and a Cloudflare Worker (`worker.js`) which exposes two main routes:
- POST /api/run — generic proxy that forwards chat-completion-style requests to the chosen provider; caller provides their API key (BYOK).
- POST /api/analyze — classifier that calls a model to map a free-text description to one of several template types and extracts fields. The worker attempts to parse model output strictly as JSON.

WHAT I ADDED

- scripts/smoke-test.js — a safe smoke-test runner that tries the worker endpoints for configured providers. It will SKIP any provider for which you have not set an environment variable for the key (so you can run it without keys).
- package.json — minimal npm manifest with a `smoke-test` script.
- this README with quickstart and recommended repo structure.

IMPORTANT

Do NOT put real API keys in the repository. Keep keys in your environment or a local `.env` file (never commit `.env` to the repo).

QUICKSTART — local development

Requirements:
- Node.js 18+ (for native fetch in Node) — used by the smoke-test script
- Wrangler (if you run the Cloudflare worker locally or deploy it): https://developers.cloudflare.com/workers/
- A model provider API key if you want to actually call remote models (optional for most smoke-test runs)

1) Serve the frontend

Simple static serve:

  python3 -m http.server 8000

Open http://localhost:8000 in your browser. Use the "API Settings" modal to point to your worker (or use the default below when running wrangler locally).

2) Run the worker locally with wrangler (recommended for testing the worker)

  npm i -g wrangler
  # from repo root
  wrangler dev

By default wrangler serves the worker on http://127.0.0.1:8787 (verify wrangler output).

3) Smoke tests (no keys required — will skip missing keys)

You can run the smoke-test script to exercise `/api/run` and `/api/analyze` routes. The script reads environment variables for keys. Examples:

  # run with no API keys (all tests skipped)
  npm run smoke-test

  # run just OpenAI tests (replace with a valid test key if you have one)
  WORKER_URL=http://127.0.0.1:8787 OPENAI_API_KEY=sk-... npm run smoke-test

If you use dotenv, create a `.env` file (NOT committed) with entries like:

  WORKER_URL=http://127.0.0.1:8787
  OPENAI_API_KEY=sk-...
  CF_ACCOUNT_ID=your_cf_account_id
  CF_API_KEY=...
  ANALYZE_PROVIDER=openai

The smoke-test script will report skipped/passed status for each provider that lacks a key.

RECOMMENDED (PROFESSIONAL) REPO STRUCTURE

Current repo is compact. I recommend the following structure to make it more maintainable:

  / (root)
  ├─ README.md
  ├─ package.json
  ├─ wrangler.toml
  ├─ worker/                # Cloudflare Worker code
  │   └─ worker.js
  ├─ frontend/              # Static frontend
  │   └─ index.html
  │   └─ assets/            # images, icons, background
  ├─ scripts/               # developer helper scripts
  │   └─ smoke-test.js
  ├─ .github/workflows/     # CI (lint, smoke tests, deploy)
  └─ docs/                  # architecture, API docs, contrib

SECURITY & HARDENING NOTES

- BYOK design: the worker expects the client to send API keys in each request body. That means keys live on the client (localStorage) or are sent from the browser — this is convenient but not suitable for production where you want to protect keys. For production, prefer having server-side secrets or using a token exchange flow.
- Gemini: this repo appends the API key to the URL for Gemini. Be aware keys in query strings are often logged — consider server-side proxying.
- Never commit real keys.

WHAT I CAN DO NEXT

- If you want, I can:
  - move files and reorganize the repository into the recommended layout and update wrangler.toml and paths accordingly (I can open a PR with those changes), or
  - just add scaffolding and instructions while you move files yourself (safer if you want to retain current URLs), or
  - add a GitHub Actions workflow to run the smoke tests on push (requires secrets to be set in repository settings).

Tell me which of the next steps you prefer and I will make the changes and push them.

If you want me to proceed with moving files and reorganizing automatically, confirm and I will create the commits (I will not create or add any API keys).
