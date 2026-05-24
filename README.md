# Trilha VIVA — versão trilha por fases

Aplicação bíblica gamificada com visual inspirado em apps de aprendizado, Firebase, ranking, PWA e IA via `/api/generate`.

## Novidades desta versão

- Trilha por fases estilo Duolingo: o aluno pode fazer vários estudos no mesmo dia.
- Botão **Próxima fase** para continuar avançando sem ficar preso em “um estudo diário”.
- Botão **IA sugerir versículo** para receber uma nova passagem bíblica coerente com o progresso.
- Fallback local quando a OpenAI retorna quota/billing excedido.
- Ranking antigo preservado: diário, global e igrejas.
- Configurações antigas preservadas: reset de senha, alteração de e-mail, feedback e informações do projeto.
- Testes de smoke, API e funcionalidades de trilha.

## Variáveis necessárias na Vercel

```env
OPENAI_API_KEY=sk-proj-...
```

Opcional:

```env
OPENAI_MODEL=gpt-4o-mini
AI_RATE_LIMIT=8
ALLOWED_ORIGINS=https://trilhaviva.vercel.app
```

## Estrutura esperada

```txt
index.html
api/generate.js
public/manifest.webmanifest
public/icon.svg
sw.js
firestore.rules
vercel.json
package.json
```

## Deploy

1. Suba os arquivos na raiz do repositório.
2. Na Vercel, use `Framework Preset: Other`.
3. Output Directory: `.`
4. Configure `OPENAI_API_KEY`.
5. Faça Redeploy.

## Testes

```bash
npm test
```
