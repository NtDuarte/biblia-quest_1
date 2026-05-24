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
assert.equal(res.statusCode, 200, 'fallback sem chave deve retornar 200');
assert.equal(res.body.ok, true, 'fallback sem chave deve manter app funcionando');
assert.equal(res.body.local, true, 'fallback local precisa ser indicado');

res = await call({ method: 'GET', body: {} });
assert.equal(res.statusCode, 405, 'GET deve retornar 405');

process.env.OPENAI_API_KEY = 'test-key';
globalThis.fetch = async () => ({
  ok: false,
  status: 429,
  json: async () => ({ error: { message: 'You exceeded your current quota', code: 'insufficient_quota' } })
});
res = await call({ method: 'POST', body: { mode: 'study', topic: 'oração', verse: 'Mateus 6:9-13' } });
assert.equal(res.statusCode, 200, 'quota deve cair em fallback local');
assert.equal(res.body.local, true, 'quota deve gerar estudo local');

if (oldKey) process.env.OPENAI_API_KEY = oldKey; else delete process.env.OPENAI_API_KEY;
console.log('✅ API test OK: método, fallback e quota validados.');
