/* ============================================================
   NEON//CONTEXT — Cloudflare Worker backend proxy
   Routes:
     POST /api/run      — proxies a chat request to the provider
                           named in body.provider and streams the
                           upstream response back unchanged.
     POST /api/analyze  — classifies a free-text task description
                           into one of the 15 template types and
                           extracts field values.
   BYOK: the caller always supplies their own apiKey in the request
   body. No API key is ever stored or hardcoded here.
   ============================================================ */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const TEMPLATE_TYPES = {
  general: ['model', 'answer', 'task', 'role', 'context', 'format', 'length', 'audience', 'constraints'],
  business: ['model', 'answer', 'task', 'role', 'context', 'format', 'length', 'audience', 'tone', 'success'],
  project: ['model', 'answer', 'task', 'role', 'context', 'format', 'length', 'steps', 'success', 'constraints'],
  creative: ['model', 'answer', 'task', 'role', 'context', 'format', 'length', 'tone', 'audience', 'success'],
  analysis: ['model', 'answer', 'task', 'role', 'context', 'format', 'length', 'constraints', 'success'],
  fewshot: ['model', 'answer', 'task', 'role', 'context', 'format', 'length', 'examples', 'success'],
  coding: ['model', 'file', 'current', 'desired', 'scope', 'dont', 'constraints', 'success'],
  agent: ['model', 'task', 'environment', 'current', 'desired', 'scope', 'dont', 'stop', 'success'],
  image: ['model', 'subject', 'action', 'setting', 'style', 'mood', 'lighting', 'palette', 'composition', 'aspect', 'negative'],
  imageEdit: ['model', 'reference', 'change', 'constraints', 'negative'],
  comfy: ['model', 'checkpoint', 'subject', 'style', 'mood', 'lighting', 'composition', 'negative', 'aspect'],
  video: ['model', 'subject', 'action', 'setting', 'camera', 'duration', 'mood', 'lighting', 'cut', 'aspect'],
  voice: ['model', 'script', 'emotion', 'pacing', 'speechrate'],
  research: ['model', 'task', 'searchmode', 'sources', 'audience', 'format', 'length', 'success'],
  workflow: ['model', 'trigger', 'actionapp', 'mapping', 'constraints', 'success'],
  decompiler: ['model', 'operation', 'original', 'task', 'format']
};

const TEMPLATE_DESCRIPTIONS = {
  general: 'Fast, clear everyday task with no special structure.',
  business: 'Business writing: reports, emails, documents.',
  project: 'Complex, multi-step project work that needs sequencing.',
  creative: 'Creative or brand writing: voice, concepts, variants.',
  analysis: 'Analysis, comparison, or debugging of logic/data.',
  fewshot: 'Needs reliable structured output driven by input=>output examples.',
  coding: 'Editing existing code with an IDE AI (Cursor, Windsurf, Copilot).',
  agent: 'Autonomous coding/CLI agent task (Claude Code, Devin, etc.) with scope and stop conditions.',
  image: 'Generating a new image (Midjourney, DALL-E, Stable Diffusion).',
  imageEdit: 'Editing an existing image: change one thing, preserve the rest.',
  comfy: 'ComfyUI positive/negative prompt generation.',
  video: 'Generating a video (Sora, Runway, Kling).',
  voice: 'Voice AI script/text-to-speech (ElevenLabs, Murf AI).',
  research: 'Search-grounded research question needing cited sources.',
  workflow: 'Workflow automation across apps (Zapier, Make, n8n).',
  decompiler: 'Breaking down, adapting, or simplifying an existing prompt.'
};

function jsonError(status, message, extra) {
  return new Response(JSON.stringify(Object.assign({ error: message }, extra || {})), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS)
  });
}

class UpstreamError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------
   /api/run — generic streaming proxy
   ------------------------------------------------------------ */
async function handleRun(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonError(400, 'Invalid JSON body');
  }

  const { provider, apiKey, modelId, url: customUrl, cfAccountId, payload } = body || {};
  if (!provider || !payload) {
    return jsonError(400, 'Missing required field: provider or payload');
  }

  let upstreamUrl;
  const headers = { 'Content-Type': 'application/json' };

  switch (provider) {
    case 'openai':
      upstreamUrl = customUrl || 'https://api.openai.com/v1/chat/completions';
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      break;
    case 'openrouter':
      upstreamUrl = customUrl || 'https://openrouter.ai/api/v1/chat/completions';
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-Title'] = 'NEON//CONTEXT Console';
      break;
    case 'custom':
      upstreamUrl = customUrl || 'http://localhost:11434/v1/chat/completions';
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      break;
    case 'cloudflare':
      if (!cfAccountId) return jsonError(400, 'Missing cfAccountId for cloudflare provider');
      upstreamUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${modelId || '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'}`;
      headers['Authorization'] = `Bearer ${apiKey}`;
      break;
    case 'gemini': {
      const model = modelId || 'gemini-2.5-flash';
      const base = customUrl || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      upstreamUrl = `${base}?key=${apiKey}`;
      break;
    }
    case 'anthropic':
      upstreamUrl = customUrl || 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      break;
    default:
      return jsonError(400, `Unknown provider: ${provider}`);
  }

  let upstreamResp;
  try {
    upstreamResp = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (e) {
    return jsonError(502, `Upstream request failed: ${e.message}`);
  }

  const respHeaders = new Headers(CORS_HEADERS);
  const ct = upstreamResp.headers.get('content-type');
  if (ct) respHeaders.set('Content-Type', ct);

  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    headers: respHeaders
  });
}

/* ------------------------------------------------------------
   /api/analyze — task-description -> template classification
   ------------------------------------------------------------ */
function buildSystemPrompt() {
  const rules = Object.keys(TEMPLATE_TYPES).map(type => {
    return `- "${type}": ${TEMPLATE_DESCRIPTIONS[type]} Valid field keys: ${TEMPLATE_TYPES[type].join(', ')}.`;
  }).join('\n');

  return `You are a routing classifier for a prompt-engineering tool called NEON//CONTEXT.
The user will describe, in plain language, a task they want help with. Your job is to pick the single best-matching template type from the fixed list below, and extract values for as many of that template's fields as you can confidently infer from the description.

Template types and their valid field keys:
${rules}

Respond with ONLY raw JSON, no markdown code fences, no commentary before or after, matching exactly this shape:
{"type":"<one of the 15 template type keys above>","fields":{"<fieldKey>":"<value>"},"clarifying_questions":["<max 3 short questions, empty array if none>"]}

Rules:
- "type" MUST be exactly one of: ${Object.keys(TEMPLATE_TYPES).join(', ')}.
- "fields" MUST only contain keys that are valid for the chosen type. Omit any field you cannot confidently infer — do not guess wildly or invent details.
- "clarifying_questions" holds at most 3 short questions about missing but important information. Use an empty array if the description is already clear enough.
- Output must be valid JSON and nothing else.`;
}

async function callOpenAICompatibleForAnalysis(provider, apiKey, modelId, systemPrompt, userText) {
  let url;
  if (provider === 'openai') url = 'https://api.openai.com/v1/chat/completions';
  else if (provider === 'openrouter') url = 'https://openrouter.ai/api/v1/chat/completions';
  else url = 'http://localhost:11434/v1/chat/completions';

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  if (provider === 'openrouter') headers['X-Title'] = 'NEON//CONTEXT Console';

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelId || (provider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      stream: false
    })
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new UpstreamError(resp.status, JSON.stringify(json));
  return json.choices?.[0]?.message?.content || '';
}

async function callCloudflareForAnalysis(apiKey, modelId, cfAccountId, systemPrompt, userText) {
  if (!cfAccountId) throw new UpstreamError(400, 'Missing cfAccountId for cloudflare provider');
  const model = modelId || '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';
  const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ]
    })
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new UpstreamError(resp.status, JSON.stringify(json));
  return json.result?.response || '';
}

async function callGeminiForAnalysis(apiKey, modelId, systemPrompt, userText) {
  const model = modelId || 'gemini-2.5-flash';
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }]
    })
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new UpstreamError(resp.status, JSON.stringify(json));
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callAnthropicForAnalysis(apiKey, modelId, systemPrompt, userText) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: modelId || 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userText }]
    })
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new UpstreamError(resp.status, JSON.stringify(json));
  return json.content?.[0]?.text || '';
}

async function callModelForAnalysis(provider, apiKey, modelId, cfAccountId, systemPrompt, userText) {
  if (provider === 'anthropic') return callAnthropicForAnalysis(apiKey, modelId, systemPrompt, userText);
  if (provider === 'gemini') return callGeminiForAnalysis(apiKey, modelId, systemPrompt, userText);
  if (provider === 'cloudflare') return callCloudflareForAnalysis(apiKey, modelId, cfAccountId, systemPrompt, userText);
  return callOpenAICompatibleForAnalysis(provider, apiKey, modelId, systemPrompt, userText);
}

function extractJson(rawText) {
  let cleaned = (rawText || '').trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

async function handleAnalyze(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonError(400, 'Invalid JSON body');
  }

  const { provider, apiKey, modelId, description, cfAccountId } = body || {};
  if (!provider || !apiKey || !description) {
    return jsonError(400, 'Missing required field: provider, apiKey, or description');
  }

  const systemPrompt = buildSystemPrompt();

  let rawText;
  try {
    rawText = await callModelForAnalysis(provider, apiKey, modelId, cfAccountId, systemPrompt, description);
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 502;
    return jsonError(status, `Model call failed: ${e.message}`);
  }

  let parsed;
  try {
    parsed = extractJson(rawText);
  } catch (e) {
    return jsonError(502, 'Failed to parse model output as JSON', { raw: rawText });
  }

  if (!parsed || typeof parsed !== 'object' || !TEMPLATE_TYPES[parsed.type]) {
    return jsonError(502, 'Model output missing a valid "type" field', { raw: rawText });
  }

  const validKeys = new Set(TEMPLATE_TYPES[parsed.type]);
  const fields = {};
  if (parsed.fields && typeof parsed.fields === 'object') {
    for (const [k, v] of Object.entries(parsed.fields)) {
      if (validKeys.has(k) && typeof v === 'string') fields[k] = v;
    }
  }

  const clarifying = Array.isArray(parsed.clarifying_questions)
    ? parsed.clarifying_questions.filter(q => typeof q === 'string').slice(0, 3)
    : [];

  return new Response(JSON.stringify({
    type: parsed.type,
    fields,
    clarifying_questions: clarifying
  }), {
    status: 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS)
  });
}

/* ------------------------------------------------------------
   Entry point
   ------------------------------------------------------------ */
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method !== 'POST') {
      return jsonError(405, 'Method not allowed');
    }

    if (url.pathname === '/api/run') return handleRun(request);
    if (url.pathname === '/api/analyze') return handleAnalyze(request);

    return jsonError(404, 'Not found');
  }
};
