// Trilha VIVA - API de passagem bíblica
// GET /api/bible?ref=Joao%203:16

function cleanText(value, max = 1500) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function normalizeReference(ref) {
  return cleanText(ref, 120).replace(/[;{}<>]/g, '').trim();
}

async function fetchBiblePassage(reference) {
  const ref = normalizeReference(reference);
  if (!ref) return null;
  const encoded = encodeURIComponent(ref);
  const urls = [`https://bible-api.com/${encoded}?translation=almeida`, `https://bible-api.com/${encoded}`];
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      if (!response.ok) continue;
      const data = await response.json();
      const text = cleanText(data?.text || '', 5000);
      if (text) return { reference: cleanText(data?.reference || ref, 180), text, source: 'bible-api.com' };
    } catch {}
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Use GET.' });
  const ref = normalizeReference(req.query?.ref || req.url?.split('ref=')[1] || '');
  if (!ref) return res.status(400).json({ ok: false, error: 'Informe ?ref=Livro capítulo:verso.' });
  const passage = await fetchBiblePassage(decodeURIComponent(ref));
  if (!passage) return res.status(404).json({ ok: false, error: 'Passagem não encontrada na API bíblica.' });
  return res.status(200).json({ ok: true, ...passage });
}
