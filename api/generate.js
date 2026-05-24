// API segura para Vercel: /api/generate
// Configure a variável OPENAI_API_KEY no painel da Vercel. Nunca coloque a chave no HTML.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const buckets = new Map();

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

function rateLimit(key) {
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return bucket.count <= MAX_REQUESTS;
}

function clean(input, max = 1400) {
  return String(input || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (!rateLimit(clientIp(req))) {
    return res.status(429).json({ error: 'Muitas solicitações. Tente novamente em instantes.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no servidor.' });
  }

  const verse = clean(req.body?.verse);
  const question = clean(req.body?.question, 600);
  const track = clean(req.body?.track, 120);
  const goal = clean(req.body?.goal, 300);

  if (!verse) {
    return res.status(400).json({ error: 'Versículo obrigatório.' });
  }

  const system = `Você é o Professor Trilha VIVA, um mentor cristão respeitoso, acolhedor e didático. Responda em português do Brasil. Seu foco é aprendizado bíblico prático: contexto, explicação, aplicação diária e revisão por quiz. Não faça aconselhamento médico, jurídico ou financeiro. Mantenha linguagem simples, segura e edificante.`;

  const user = question
    ? `Versículo: ${verse}\n\nDúvida do usuário: ${question}\n\nResponda de forma curta, bíblica, acolhedora e prática.`
    : `Crie um estudo bíblico do texto abaixo seguindo exatamente este formato:\n\nEXPLICAÇÃO: [comece com uma frase-título curta. Depois explique em 3 a 5 parágrafos curtos: contexto bíblico, sentido principal, aplicação prática e um desafio para hoje. Não fuja do texto.]\n\nPERGUNTA: [uma pergunta de múltipla escolha que teste entendimento real]\nA) [opção]\nB) [opção]\nC) [opção]\nD) [opção]\n\nCORRETA: [A, B, C ou D]\n\nTrilha selecionada: ${track || 'Jornada diária'}\nObjetivo pedagógico: ${goal || 'Entender o texto e aplicar a Palavra no cotidiano.'}\nTexto bíblico: ${verse}`;

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        max_tokens: question ? 500 : 900
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error?.message || 'Erro ao gerar estudo.' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Falha temporária ao consultar a IA.' });
  }
}
