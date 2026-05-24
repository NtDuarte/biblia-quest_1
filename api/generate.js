// Trilha VIVA - API segura para estudos bíblicos com IA + passagem bíblica
// Vercel Serverless Function: /api/generate
// Necessário configurar na Vercel: OPENAI_API_KEY

const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.AI_RATE_LIMIT || 8);
const MAX_BODY_SIZE = 7_000;
const buckets = new Map();

function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function limited(key) {
  const now = Date.now();
  const current = buckets.get(key) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + WINDOW_MS;
  }
  current.count += 1;
  buckets.set(key, current);
  return current.count > MAX_REQUESTS;
}

function allowedOrigin(req) {
  const origin = req.headers.origin || '';
  if (!origin) return true;
  const defaults = 'https://trilhaviva.vercel.app,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5500';
  const allowed = (process.env.ALLOWED_ORIGINS || defaults).split(',').map(v => v.trim()).filter(Boolean);
  if (allowed.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app');
  } catch { return false; }
}

function cleanText(value, max = 1500) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function extractText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  const output = data?.output || [];
  const texts = [];
  for (const item of output) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) texts.push(content.text);
    }
  }
  return texts.join('\n').trim();
}

function normalizeReference(ref) {
  return cleanText(ref, 120)
    .replace(/\s+/g, ' ')
    .replace(/[;{}<>]/g, '')
    .trim();
}

async function fetchBiblePassage(reference) {
  const ref = normalizeReference(reference);
  if (!ref) return null;
  const encoded = encodeURIComponent(ref);
  const candidates = [
    `https://bible-api.com/${encoded}?translation=almeida`,
    `https://bible-api.com/${encoded}`
  ];

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Number(process.env.BIBLE_TIMEOUT_MS || 8000));
      const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const data = await response.json();
      const text = cleanText(data?.text || '', 5000);
      const referenceText = cleanText(data?.reference || ref, 180);
      if (text) return { reference: referenceText, text, source: 'bible-api.com' };
    } catch {}
  }
  return null;
}

function isQuotaError(data) {
  const msg = String(data?.error?.message || data?.error || '');
  const code = String(data?.error?.code || data?.error?.type || '');
  return /quota|billing|insufficient_quota|exceeded/i.test(msg + ' ' + code);
}

function buildPrompt({ mode, verse, topic, question, level, track, memory, passage }) {
  const persona = `Você é o Mentor Trilha VIVA: professor bíblico cristão, acolhedor, didático, claro e profundo. Responda em português do Brasil. Ensine a Palavra com foco no texto bíblico fornecido, contexto, observação, interpretação, aplicação e revisão. Não crie conteúdo institucional sobre o app. Não invente versículos. Se a passagem bíblica vier no prompt, use essa passagem como fonte principal.`;

  const passageBlock = passage?.text
    ? `\n\nPASSAGEM BÍBLICA CONSULTADA PELA API:\nReferência: ${passage.reference}\nTexto: ${passage.text}\nFonte: ${passage.source}`
    : `\n\nPASSAGEM BÍBLICA: a API bíblica não retornou o texto completo; use a referência informada com cautela e não cite versículos inventados.`;

  const base = `Trilha: ${track || 'Jornada bíblica'}\nNível do aluno: ${level || 'iniciante'}\nMemória de progresso do aluno: ${memory || 'sem histórico'}\nReferência bíblica base: ${verse || 'não informada'}\nTema: ${topic || 'aprendizado bíblico'}${passageBlock}`;

  if (mode === 'doubt') {
    return {
      system: persona,
      user: `${base}\n\nDúvida do aluno: ${question}\n\nResponda em até 5 parágrafos curtos, com explicação bíblica, aplicação prática e uma pergunta de reflexão. Se a dúvida não tiver relação com a passagem, sugira uma passagem bíblica coerente para estudo.`
    };
  }

  if (mode === 'suggest') {
    return {
      system: persona,
      user: `${base}\n\nSugira a próxima fase de estudo bíblico escolhendo uma referência bíblica real, diferente e coerente com o crescimento do aluno. Responda somente JSON válido, sem markdown, exatamente no formato: {"icon":"✨","title":"","topic":"","verse":"Livro capítulo:verso-verso","goal":""}. Não invente referência bíblica inexistente.`
    };
  }

  if (mode === 'quiz') {
    return {
      system: persona,
      user: `${base}\n\nCrie 5 questões de múltipla escolha baseadas na passagem bíblica consultada. Não faça perguntas sobre o Trilha VIVA. Responda somente JSON válido, sem markdown, no formato: {"questions":[{"question":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."}]}.`
    };
  }

  return {
    system: persona,
    user: `${base}\n\nCrie um estudo bíblico gamificado, didático e fiel à passagem consultada. Responda somente JSON válido, sem markdown, exatamente assim:\n{"title":"","reference":"","passage":"","summary":"","context":"","observation":"","interpretation":"","lesson":"","practice":"","prayer":"","challenge":"","xp":25,"quiz":{"question":"","options":["","","",""],"answerIndex":0,"explanation":""}}\n\nRegras: a pergunta do quiz deve ser sobre a Palavra e a passagem, nunca sobre o aplicativo. O campo passage deve trazer a passagem bíblica de forma curta e respeitosa. Linguagem simples, explicação progressiva, aplicação para hoje.`
  };
}

function jsonError(res, status, error, details = undefined) {
  return res.status(status).json({ ok: false, error, ...(details ? { details } : {}) });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const origin = req.headers.origin || '';
  if (allowedOrigin(req) && origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (!allowedOrigin(req)) return jsonError(res, 403, 'Origem não autorizada.');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return jsonError(res, 405, 'Use POST para gerar estudos.');
  if (limited(getIp(req))) return jsonError(res, 429, 'Muitas tentativas. Aguarde um minuto.');

  const bodySize = JSON.stringify(req.body || {}).length;
  if (bodySize > MAX_BODY_SIZE) return jsonError(res, 413, 'Mensagem muito grande.');
  if (req.body?.website) return jsonError(res, 400, 'Requisição inválida.');

  const mode = cleanText(req.body?.mode, 20) || 'study';
  const verse = normalizeReference(req.body?.verse);
  const topic = cleanText(req.body?.topic, 120);
  const question = cleanText(req.body?.question, 600);
  const level = cleanText(req.body?.level, 40);
  const track = cleanText(req.body?.track, 80);
  const memory = cleanText(req.body?.memory, 600);

  if (!process.env.OPENAI_API_KEY) return jsonError(res, 500, 'OPENAI_API_KEY não configurada na Vercel. A geração depende da IA real.');
  if (mode === 'doubt' && !question) return jsonError(res, 400, 'Digite uma dúvida.');
  if (!['doubt','study','quiz','suggest'].includes(mode)) return jsonError(res, 400, 'Modo inválido.');
  if (!['doubt','suggest'].includes(mode) && !verse && !topic) return jsonError(res, 400, 'Informe uma referência bíblica ou tema.');

  const passage = await fetchBiblePassage(verse);
  const { system, user } = buildPrompt({ mode, verse, topic, question, level, track, memory, passage });

  let timeout;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 30000));
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.65,
        max_output_tokens: mode === 'doubt' ? 750 : mode === 'suggest' ? 300 : 1350
      })
    });

    const data = await response.json().catch(() => ({ error: { message: 'Resposta inválida da OpenAI.' } }));
    clearTimeout(timeout);
    if (!response.ok) {
      if (isQuotaError(data)) return jsonError(res, 402, 'Sua conta OpenAI está sem quota/crédito. Adicione billing ou troque a chave para gerar estudos reais com IA.');
      return jsonError(res, response.status, data?.error?.message || 'Erro ao consultar IA.');
    }

    const text = extractText(data);
    if (!text) return jsonError(res, 502, 'A IA não retornou conteúdo.');

    let parsed = null;
    if (mode !== 'doubt') {
      try { parsed = JSON.parse(text.replace(/^```json/i, '').replace(/```$/i, '').trim()); } catch {}
    }

    return res.status(200).json({ ok: true, mode, content: text, parsed, passage });
  } catch (error) {
    if (timeout) clearTimeout(timeout);
    return jsonError(res, 504, 'Não foi possível gerar agora. Verifique conexão, API bíblica ou OpenAI.', cleanText(error?.message, 180));
  }
}
