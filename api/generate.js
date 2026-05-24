// Trilha VIVA - API segura para estudos bíblicos com IA
// Vercel Serverless Function: /api/generate
// Necessário configurar na Vercel: OPENAI_API_KEY

const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.AI_RATE_LIMIT || 8);
const MAX_BODY_SIZE = 6_000;
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


function localFallback({ mode, verse, topic, track }) {
  if (mode === 'doubt') {
    return {
      ok: true,
      mode,
      local: true,
      warning: 'IA indisponível por limite/quota. Resposta local gerada.',
      content: `A IA está temporariamente limitada por quota/billing. Enquanto isso, volte ao texto bíblico base (${verse || 'passagem escolhida'}) e observe: 1) o que Deus revela, 2) qual atitude o texto pede, 3) como praticar isso hoje.

Para a dúvida apresentada, recomendo anotar a pergunta, ler o contexto inteiro da passagem e conversar com um líder/pastor de confiança se envolver aconselhamento pessoal.

Pergunta de reflexão: qual pequena obediência você pode praticar hoje?`,
      parsed: null
    };
  }
  return {
    ok: true,
    mode,
    local: true,
    warning: 'IA indisponível por limite/quota. Estudo local gerado.',
    content: '',
    parsed: {
      title: `${track || 'Estudo bíblico'}: Palavra em prática`,
      summary: `Estudo local sobre ${topic || 'fé prática'} com base em ${verse || 'uma passagem bíblica'}.`,
      context: 'Este modo mantém o Trilha VIVA funcionando quando a OpenAI está sem saldo, com quota excedida ou temporariamente indisponível.',
      lesson: 'Leia a passagem com calma. Observe quem fala, para quem fala e qual atitude a Palavra chama você a praticar. O aprendizado bíblico cresce quando leitura, reflexão e obediência caminham juntos.',
      practice: 'Escolha uma frase do texto, escreva com suas palavras e transforme em uma ação simples para hoje.',
      prayer: 'Senhor, guia meu entendimento e me ajuda a viver a tua Palavra com amor, sabedoria e constância. Amém.',
      challenge: 'Compartilhe a lição com alguém ou registre no diário do app o que Deus te ensinou.',
      xp: 20,
      quiz: {
        question: 'Qual é o objetivo principal de um estudo bíblico no Trilha VIVA?',
        options: ['Apenas ganhar XP', 'Praticar a Palavra no dia a dia', 'Substituir a leitura bíblica', 'Evitar reflexão pessoal'],
        answerIndex: 1,
        explanation: 'O foco é aprender a Palavra e praticá-la no cotidiano.'
      }
    }
  };
}
function isQuotaError(data) {
  const msg = String(data?.error?.message || data?.error || '');
  const code = String(data?.error?.code || data?.error?.type || '');
  return /quota|billing|insufficient_quota|exceeded/i.test(msg + ' ' + code);
}

function buildPrompt({ mode, verse, topic, question, level, track, memory }) {
  const persona = `Você é o Mentor Trilha VIVA: professor bíblico cristão, acolhedor, claro e profundo. Responda em português do Brasil. Ensine a Palavra com respeito, foco em aprendizado, contexto, aplicação prática e revisão. Evite polêmicas denominacionais, não invente versículos, não dê conselho médico/jurídico/financeiro e sempre estimule leitura bíblica responsável.`;

  const base = `Trilha: ${track || 'Jornada diária'}\nNível do aluno: ${level || 'iniciante'}\nMemória de progresso do aluno: ${memory || 'sem histórico'}\nTexto bíblico base: ${verse || 'não informado'}\nTema: ${topic || 'fé prática'}`;

  if (mode === 'doubt') {
    return {
      system: persona,
      user: `${base}\nDúvida do aluno: ${question}\n\nResponda em até 5 parágrafos curtos, com tom de mentor, uma aplicação prática e uma pergunta de reflexão no final.`
    };
  }

  if (mode === 'quiz') {
    return {
      system: persona,
      user: `${base}\n\nCrie 5 questões de múltipla escolha em JSON válido, sem markdown, no formato: {"questions":[{"question":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."}]}.`
    };
  }

  return {
    system: persona,
    user: `${base}\n\nCrie um estudo bíblico gamificado no formato JSON válido, sem markdown, exatamente assim:\n{"title":"","summary":"","context":"","lesson":"","practice":"","prayer":"","challenge":"","xp":25,"quiz":{"question":"","options":["","","",""],"answerIndex":0,"explanation":""}}\n\nRegras: linguagem simples, conteúdo fiel ao texto, foco em aprendizado da Palavra, aplicação para hoje, tom tipo aplicativo de estudos. Não use HTML.`
  };
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
  if (!allowedOrigin(req)) return res.status(403).json({ ok: false, error: 'Origem não autorizada.' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST para gerar estudos.' });
  if (limited(getIp(req))) return res.status(429).json({ ok: false, error: 'Muitas tentativas. Aguarde um minuto.' });
  if (!process.env.OPENAI_API_KEY) return res.status(200).json(localFallback({ mode: 'study', verse: '', topic: 'fé prática', track: 'Jornada diária' }));

  const bodySize = JSON.stringify(req.body || {}).length;
  if (bodySize > MAX_BODY_SIZE) return res.status(413).json({ ok: false, error: 'Mensagem muito grande.' });
  if (req.body?.website) return res.status(400).json({ ok: false, error: 'Requisição inválida.' }); // honeypot anti-bot

  const mode = cleanText(req.body?.mode, 20) || 'study';
  const verse = cleanText(req.body?.verse, 1800);
  const topic = cleanText(req.body?.topic, 120);
  const question = cleanText(req.body?.question, 600);
  const level = cleanText(req.body?.level, 40);
  const track = cleanText(req.body?.track, 80);
  const memory = cleanText(req.body?.memory, 600);

  if (mode === 'doubt' && !question) return res.status(400).json({ ok: false, error: 'Digite uma dúvida.' });
  if (mode !== 'doubt' && !verse && !topic) return res.status(400).json({ ok: false, error: 'Informe um texto bíblico ou tema.' });

  const { system, user } = buildPrompt({ mode, verse, topic, question, level, track, memory });

  let timeout;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 25000));
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
        temperature: 0.7,
        max_output_tokens: mode === 'doubt' ? 650 : 1100
      })
    });

    const data = await response.json().catch(() => ({ error: { message: 'Resposta inválida da OpenAI.' } }));
    clearTimeout(timeout);
    if (!response.ok) {
      if (isQuotaError(data)) return res.status(200).json(localFallback({ mode, verse, topic, track }));
      return res.status(response.status).json({ ok: false, error: data?.error?.message || 'Erro ao consultar IA.' });
    }

    const text = extractText(data);
    let parsed = null;
    if (mode !== 'doubt') {
      try { parsed = JSON.parse(text.replace(/^```json/i, '').replace(/```$/i, '').trim()); } catch {}
    }

    return res.status(200).json({ ok: true, mode, content: text, parsed });
  } catch (error) {
    if (timeout) clearTimeout(timeout);
    return res.status(200).json(localFallback({ mode, verse, topic, track }));
  }
}
