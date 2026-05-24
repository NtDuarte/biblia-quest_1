# Trilha VIVA Next

Versão gamificada inspirada em apps de aprendizado, focada no estudo da Palavra.

## O que foi implementado

- Cabeçalho estilo Duolingo com XP, streak, nível, corações e progresso.
- 12 trilhas bíblicas iniciais.
- Mentor IA para dúvidas bíblicas.
- Estudos gerados em JSON estruturado com quiz, oração, desafio e aplicação.
- Leitura em voz alta pelo navegador.
- PWA instalável com service worker e manifesto.
- Segurança no frontend: CSP, renderização segura com `textContent`/escape, honeypot anti-bot.
- Segurança na API: rate limit, limite de payload, CORS por origem, sanitização e chave apenas em variável de ambiente.
- Rules do Firestore com escopo por usuário.

## Variáveis da Vercel

Obrigatórias:

```env
OPENAI_API_KEY=sua_chave_nova_aqui
```

Opcionais:

```env
OPENAI_MODEL=gpt-4o-mini
AI_RATE_LIMIT=8
ALLOWED_ORIGINS=https://trilhaviva.vercel.app,http://localhost:3000
```

Depois de configurar as variáveis, faça Redeploy.

## Estrutura

```text
index.html
sw.js
public/manifest.webmanifest
public/icon.svg
api/generate.js
firestore.rules
tests/smoke-test.mjs
```

## Teste local básico

```bash
node tests/smoke-test.mjs
```

## Observação de segurança

A chave OpenAI que foi enviada no chat deve ser revogada. Gere uma chave nova e use apenas no painel da Vercel em `OPENAI_API_KEY`.
