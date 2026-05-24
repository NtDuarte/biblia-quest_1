import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const api = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

assert(html.includes('Content-Security-Policy'), 'CSP ausente');
assert(html.includes('/api/generate'), 'Frontend não chama /api/generate');
assert(html.includes('firebaseConfig'), 'Firebase config preservada');
assert(!html.includes('sk-' + 'proj-'), 'Chave secreta exposta no frontend');
assert(api.includes('process.env.OPENAI_API_KEY'), 'API não usa variável de ambiente');
assert(api.includes('/v1/responses'), 'API não usa endpoint Responses');
assert(api.includes('rate') || api.includes('limited'), 'Rate limit ausente');
assert(!api.includes('sk-' + 'proj-'), 'Chave secreta exposta na API');
assert(rules.includes('isOwner'), 'Rules sem isolamento por usuário');
assert(html.includes('publicRanks'), 'Ranking público seguro ausente no frontend');
assert(rules.includes('match /publicRanks'), 'Rules do ranking público ausentes');
console.log('✅ Smoke test OK: segurança e funcionalidade básica validadas.');
