# ⚡ NEON//CONTEXT — Model-Aware Prompt Engineering Console

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://arhistrategstudio.github.io/Context_CikaDule/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Security: BYOK](https://img.shields.io/badge/Security-BYOK_%26_Zero_Logging-00ffcc?style=for-the-badge)](#-security--privacy-byok)

> **Live Application**: [https://arhistrategstudio.github.io/Context_CikaDule/](https://arhistrategstudio.github.io/Context_CikaDule/)  
> **Author**: CikaDule ([Arhistrateg Studio](https://github.com/arhistrategstudio))

---

## 🚀 Overview

**NEON//CONTEXT** (`Context_CikaDule`) is an advanced, high-performance **Prompt Engineering Console** and **AI Edge Proxy**. Designed specifically for AI developers, researchers, and creators, it eliminates context drift, prevents hallucination, slashes token costs, and formats production-ready prompts tailored to specific AI models.

Built with a lightning-fast, zero-dependency vanilla frontend and a globally distributed Cloudflare Worker proxy, it allows you to build, optimize, test, and execute prompts against leading frontier models directly from your browser.

```
┌─────────────────────────┐          ┌───────────────────────────┐          ┌─────────────────────────┐
│     Client Browser      │          │ Cloudflare Worker (Edge)  │          │   Upstream Providers    │
│  (index.html on Pages)  │ ───────> │ cikadule-prompt-console   │ ───────> │ OpenAI, Gemini, Claude, │
│  • Local BYOK Storage   │ <─────── │ • CORS & Auth Handler     │ <─────── │ OpenRouter, Workers AI  │
│  • Token Economizer     │          │ • Stream & JSON Parser    │          │ Custom / Local LLMs     │
└─────────────────────────┘          └───────────────────────────┘          └─────────────────────────┘
```

---

## ✨ Core Features

### 1. 🎯 16 Domain-Specific Prompt Templates
Tailored input schemas with contextual field hints, examples, and validations for every modern AI workflow:
- **General** — System prompt, role persona, objective, context, constraints, output structure.
- **Coding / Refactoring** — Target language, environment, file scope, current vs. desired state, safety bounds (`do-not-touch`).
- **Image Generation** — Midjourney, FLUX, DALL-E 3 parameters (`--ar`, style, camera, composition, mood, negative prompts).
- **Video Generation** — Runway Gen-3, OpenAI Sora, Kling camera movements, pacing, continuous shot direction.
- **Voice & Speech** — ElevenLabs voice pacing, emotion, pauses, speech-rate, phonetic controls.
- **Data Extraction & Formatting** — Strict JSON/CSV schemas, few-shot demonstration pairs (`INPUT => OUTPUT`).
- **Automations & Workflows** — Zapier, Make, n8n trigger-to-action payload mapping.
- **Decompiler** — Reverse-engineer raw prompts back into structured system architecture.
- *Plus: Writing, Translation, Analysis, Roleplay, Summarization, Brainstorming, and Chatbot personas.*

### 2. 🧠 Model-Aware Engine (22+ Target Profiles)
Unlike generic prompt generators, NEON//CONTEXT dynamically adapts delimiters, tags, instruction hierarchy, and reasoning constraints based on the target LLM:
- **OpenAI**: GPT-4o, GPT-4o-mini, o1, o3-mini (reasoning-safe, zero chain-of-thought interference).
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3.5 Haiku (XML tag structure, context-first placement).
- **Google**: Gemini 2.5 Flash, Gemini 1.5 Pro (systemInstruction parts formatting, clean endpoints).
- **DeepSeek & Qwen**: DeepSeek-R1, DeepSeek-V3, Qwen 2.5 Max (optimized markdown, step reasoning format).
- **Meta Llama & Mistral**: Llama 3.1 70B/405B, Mistral Large (compact instruction tagging).
- **Image & Audio Engines**: Midjourney v6, FLUX.1, DALL-E 3, ElevenLabs.

### 3. ⚡ Compact Mode & Real-Time Token Economizer
- **Automated Syntax Compaction**: Mechanically removes filler words, collapses redundant whitespaces, and tightens markdown formatting without losing semantic instructions.
- **High-Visibility Savings Badge**: Prominently highlights the exact token reduction percentage (e.g. `-35% SAVED`) with dynamic neon accent indicators.
- **Live Token Estimator**: Real-time token counts calculated at the form level, per-field level, and for the full compiled prompt.

### 4. 🤖 AI Auto-Detect (Task Classifier)
Have a messy, unstructured idea? Simply describe your task in plain natural language. The console’s edge classifier (`POST /api/analyze`):
1. Categorizes your intent into the best template.
2. Extracts and populates all relevant workspace fields.
3. Formulates up to 3 smart follow-up questions if critical requirements are missing.

### 5. 💻 Live Streaming & Direct Execution
- **Run Directly**: Test prompts with real-time SSE streaming inside the console.
- **Universal Fallback**: If no API key is configured or an external app is preferred, clicking run automatically copies the prompt to your clipboard and opens the provider's official web console.
- **Dual-Control Preview**: One-click **Copy Prompt**, **Run in Model / Run Directly**, and **Download .TXT** in both the active workspace and the live preview drawer.

### 6. 🌐 100% Bilingual Interface
Seamlessly toggle between **English** and **Serbian (Srpski)** with one click. Every label, tooltip, placeholder, error message, and generated prefix is fully localized.

---

## 🔒 Security & Privacy (BYOK)

NEON//CONTEXT is built from the ground up on the **Bring Your Own Key (BYOK)** principle:
- **Zero Server-Side Storage**: Your API keys never touch a database. They are stored solely in your local browser's `localStorage`.
- **Stateless Edge Proxy**: The Cloudflare Worker forwards your authorization headers directly to OpenAI, Anthropic, Google, or OpenRouter and streams the response back.
- **No Prompt Logging**: Prompts and completions are never logged, cached, or retained on Cloudflare or any third-party server.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Single-page application in clean, modern vanilla JavaScript (ES6+), semantic HTML5, and responsive CSS with custom dark cyber-neon styling.
- **Edge Backend**: Cloudflare Worker running on V8 isolates at 300+ global edge locations.
- **Deployment**:
  - Frontend hosted on **GitHub Pages** with continuous deployment from `main`.
  - Edge proxy managed with **Cloudflare Wrangler CLI**.

---

## 📦 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or newer
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)

### 1. Clone the Repository
```bash
git clone https://github.com/arhistrategstudio/Context_CikaDule.git
cd Context_CikaDule
```

### 2. Serve the Frontend
Run any local web server from the project root:
```bash
# Python
python -m http.server 8000

# or Node npx
npx serve .
```
Navigate to `http://localhost:8000` in your browser.

### 3. Run the Cloudflare Worker Locally
```bash
# Install dependencies
npm install

# Start local worker emulator (listens on http://127.0.0.1:8787)
npx wrangler dev
```

In the app UI, open **API Settings** (⚙) and set the Worker URL to `http://127.0.0.1:8787` for local testing.

### 4. Deploying to Cloudflare
```bash
npx wrangler deploy
```

---

## 🧪 Automated Smoke Tests

A comprehensive smoke-testing suite (`scripts/smoke-test.js`) is included to verify all provider routes safely:

```bash
# Run tests with mock validation (skips providers without keys)
npm test

# Test against live providers (replace with your test keys)
WORKER_URL=http://127.0.0.1:8787 OPENAI_API_KEY=sk-... npm test
```

---

## ⚙️ Supported Providers & API Configuration

| Provider | Default Model | Custom URL Support | Streaming |
| :--- | :--- | :--- | :---: |
| **OpenAI** | `gpt-4o-mini`, `gpt-4o`, `o3-mini` | Yes (Compatible endpoints) | ✅ |
| **Google Gemini** | `gemini-2.5-flash`, `gemini-1.5-pro` | Yes (REST endpoints) | ✅ |
| **Anthropic** | `claude-3-5-sonnet-latest` | Yes | ✅ |
| **OpenRouter** | Any OpenRouter model ID | Yes | ✅ |
| **Cloudflare Workers AI** | `@cf/meta/llama-3.1-8b-instruct` | Cloudflare Gateway | ✅ |
| **Custom / Local** | Ollama, vLLM, LM Studio, Llama.cpp | Yes (`http://localhost:11434`) | ✅ |

---

## 🤝 Contributing

Contributions, feature suggestions, and bug reports are welcome!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Developed with passion by **CikaDule** · [Arhistrateg Studio](https://github.com/arhistrategstudio)
