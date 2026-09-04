#!/usr/bin/env node
/*
Smoke test script for Context_CikaDule
- Tests /api/run and /api/analyze endpoints on a running local worker (or deployed URL)
- Skips providers for which no API key is provided (so you can run without keys)

Usage:
  WORKER_URL=http://127.0.0.1:8787 OPENAI_API_KEY=sk-... node scripts/smoke-test.js
Or create a .env file and install dotenv: npm i dotenv then run the script.

This script is safe to run without API keys: it will report skipped tests.
*/

(async function(){
  // load dotenv if present
  try { require('dotenv').config(); } catch(e) {}

  const fetchFn = global.fetch || (await import('node-fetch')).default;
  const WORKER_URL = process.env.WORKER_URL || 'http://127.0.0.1:8787';

  function short(s, n=800){
    if(!s) return '';
    return s.length>n ? s.slice(0,n)+`\n...(${s.length} chars)` : s;
  }

  async function post(path, body){
    const url = (WORKER_URL + path).replace(/([^:]?)\/\//g, '$1/');
    try{
      const resp = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // timeout behavior left to environment
      });
      const text = await resp.text().catch(()=>'');
      return { ok: resp.ok, status: resp.status, text };
    }catch(e){
      return { ok:false, status: 0, error: e.message };
    }
  }

  const providers = [
    {
      key: 'OPENAI_API_KEY',
      name: 'openai',
      build: (k)=>({ provider: 'openai', apiKey: k, payload: { model: 'gpt-4o-mini', messages:[{role:'user',content:'Say hello from smoke-test'}], stream:false } })
    },
    {
      key: 'OPENROUTER_API_KEY',
      name: 'openrouter',
      build: (k)=>({ provider: 'openrouter', apiKey: k, payload: { model: 'gpt-4o-mini', messages:[{role:'user',content:'Hello from openrouter smoke-test'}], stream:false } })
    },
    {
      key: 'ANTHROPIC_API_KEY',
      name: 'anthropic',
      build: (k)=>({ provider: 'anthropic', apiKey: k, payload: { model: 'claude-3-5-sonnet', messages:[{role:'user',content:'Hello from Anthropic smoke-test'}] } })
    },
    {
      key: 'GEMINI_API_KEY',
      name: 'gemini',
      build: (k)=>({ provider: 'gemini', apiKey: k, modelId: 'gemini-2.5-flash', payload: { messages:[{role:'user',content:'Hello from Gemini smoke-test'}] } })
    },
    {
      key: 'CF_API_KEY',
      name: 'cloudflare',
      // cloudflare also needs CF_ACCOUNT_ID env var
      build: (k)=>({ provider: 'cloudflare', apiKey: k, cfAccountId: process.env.CF_ACCOUNT_ID || '', modelId: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', payload: {} })
    },
    {
      key: 'CUSTOM_API_URL',
      name: 'custom',
      build: (k)=>({ provider: 'custom', apiKey: process.env.CUSTOM_API_KEY || '', url: k, payload: { model: 'local', messages:[{role:'user',content:'Hello local model test'}] } })
    }
  ];

  console.log('\nContext_CikaDule — Smoke test');
  console.log('Worker base URL:', WORKER_URL);

  for(const p of providers){
    const envVal = process.env[p.key];
    const willRun = !!envVal && envVal.trim() !== '';
    if(!willRun){
      console.log(`- SKIP ${p.name} (env ${p.key} not set)`);
      continue;
    }
    console.log(`\n- TEST ${p.name} (using env ${p.key})`);
    const body = p.build(envVal);
    const res = await post('/api/run', body);
    if(res.error){
      console.log(`  ERROR: ${res.error}`);
    } else {
      console.log(`  HTTP ${res.status} — ok=${res.ok}`);
      console.log('  Response (snippet):\n', short(res.text));
    }
  }

  // Analyze endpoint test: only if any provider key present for compatible providers
  const analyzeProvider = process.env.ANALYZE_PROVIDER || 'openai';
  const analyzeKeyEnv = analyzeProvider === 'openai' ? 'OPENAI_API_KEY' : analyzeProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : analyzeProvider === 'cloudflare' ? 'CF_API_KEY' : analyzeProvider === 'gemini' ? 'GEMINI_API_KEY' : analyzeProvider === 'openrouter' ? 'OPENROUTER_API_KEY' : null;
  if(analyzeKeyEnv && process.env[analyzeKeyEnv]){
    console.log(`\n- TEST analyze (provider=${analyzeProvider})`);
    const analyzeBody = { provider: analyzeProvider, apiKey: process.env[analyzeKeyEnv], modelId: process.env.ANALYZE_MODEL || undefined, description: 'Write a short promotional blurb for a productivity app.' };
    if(analyzeProvider === 'cloudflare') analyzeBody.cfAccountId = process.env.CF_ACCOUNT_ID || '';
    const res = await post('/api/analyze', analyzeBody);
    if(res.error) console.log('  ERROR:', res.error);
    else {
      console.log(`  HTTP ${res.status} — ok=${res.ok}`);
      console.log('  Response (snippet):\n', short(res.text, 2000));
    }
  } else {
    console.log(`\n- SKIP analyze (no key for provider ${analyzeProvider}; set ANALYZE_PROVIDER and corresponding key env var)`);
  }

  console.log('\nSmoke test finished.');
})();
