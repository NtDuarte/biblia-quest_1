# Trilha VIVA — Bíblia + IA

Versão focada em aprendizado real da Palavra: cada estudo é gerado pela IA a partir de uma referência bíblica e de uma passagem consultada por API bíblica no backend.

## O que mudou

- Removido o estudo local automático que substituía a IA.
- `/api/generate` agora consulta uma API bíblica antes de montar o prompt da IA.
- A IA recebe referência, texto bíblico, trilha, nível e histórico do aluno.
- O estudo agora retorna: referência, passagem, resumo, contexto, observação, interpretação, lição, prática, oração, desafio e quiz bíblico.
- Quiz rápido também usa IA, não perguntas institucionais sobre o app.
- Em caso de quota/billing da OpenAI, o app mostra erro claro e não inventa estudo local.
- Mantidos: trilhas por fases, ranking antigo, configurações, PWA, mentor IA e progresso.

## Variáveis necessárias na Vercel

```env
OPENAI_API_KEY=sk-proj-...
```

Opcionais:

```env
OPENAI_MODEL=gpt-4o-mini
AI_RATE_LIMIT=8
ALLOWED_ORIGINS=https://trilhaviva.vercel.app
OPENAI_TIMEOUT_MS=30000
BIBLE_TIMEOUT_MS=8000
```

## Rotas

```txt
/api/generate  -> POST, gera estudo/quiz/sugestão/mentor com IA
/api/bible     -> GET ?ref=Joao%203:16, consulta passagem bíblica
```

## Testes

```bash
npm test
```

Valida:

- CSP e segurança básica.
- Firebase preservado.
- API usa `process.env.OPENAI_API_KEY`.
- API consulta passagem bíblica.
- Não existe fallback local de estudo.
- Quota OpenAI retorna erro claro.
- Trilhas, quiz bíblico e expansões continuam disponíveis.
