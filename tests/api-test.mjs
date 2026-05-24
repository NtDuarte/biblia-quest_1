import assert from 'node:assert/strict';
import handler from '../api/generate.js';

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; this.ended = true; return this; },
    end() { this.ended = true; return this; }
  };
}

async function call(req) {
  const res = mockRes();
  await handler({ headers: {}, socket: { remoteAddress: '127.0.0.1' }, ...req }, res);
  return res;
}

const oldKey = process.env.OPENAI_API_KEY;
delete process.env.OPENAI_API_KEY;
let res = await call({ method: 'POST', body: { mode: 'study', topic: 'fé', verse: 'João 3:16' } });
assert.equal(res.statusCode, 500, 'sem chave deve falhar claramente, sem estudo local');
assert.equal(res.body.ok, false, 'sem chave deve retornar ok false');
assert.match(res.body.error, /OPENAI_API_KEY/, 'erro deve orientar env');

res = await call({ method: 'GET', body: {} });
assert.equal(res.statusCode, 405, 'GET deve retornar 405');

process.env.OPENAI_API_KEY = 'test-key';
let calls = 0;
globalThis.fetch = async (url) => {
  calls++;
  if (String(url).startsWith('https://bible-api.com/')) {
    return { ok: true, json: async () => ({ reference: 'John 3:16', text: 'For God so loved the world...' }) };
  }
  return {
    ok: true,
    json: async () => ({ output_text: '{"title":"Amor de Deus","reference":"João 3:16","passage":"Porque Deus amou o mundo...","summary":"Resumo","context":"Contexto","observation":"Observação","interpretation":"Interpretação","lesson":"Lição","practice":"Prática","prayer":"Oração","challenge":"Desafio","xp":25,"quiz":{"question":"O que João 3:16 ensina?","options":["Amor de Deus","Indiferença","Medo","Orgulho"],"answerIndex":0,"explanation":"Ensina o amor de Deus."}}' })
  };
};
res = await call({ method: 'POST', body: { mode: 'study', topic: 'salvação', verse: 'João 3:16' } });
assert.equal(res.statusCode, 200, 'estudo com Bíblia + IA deve retornar 200');
assert.equal(res.body.ok, true);
assert.equal(res.body.parsed.title, 'Amor de Deus');
assert.ok(calls >= 2, 'deve consultar API bíblica e OpenAI');

globalThis.fetch = async (url) => {
  if (String(url).startsWith('https://bible-api.com/')) {
    return { ok: true, json: async () => ({ reference: 'Matthew 6:9', text: 'Our Father...' }) };
  }
  return { ok: false, status: 429, json: async () => ({ error: { message: 'You exceeded your current quota', code: 'insufficient_quota' } }) };
};
res = await call({ method: 'POST', body: { mode: 'study', topic: 'oração', verse: 'Mateus 6:9-13' } });
assert.equal(res.statusCode, 402, 'quota não deve gerar estudo local');
assert.equal(res.body.ok, false);
assert.match(res.body.error, /quota|crédito|billing/i);

if (oldKey) process.env.OPENAI_API_KEY = oldKey; else delete process.env.OPENAI_API_KEY;
console.log('✅ API test OK: IA real, API bíblica e erros sem fallback local validados.');
