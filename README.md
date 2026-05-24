# Trilha VIVA Ajustado

Versão corrigida com:

- fallback local quando a OpenAI retorna quota/billing excedido;
- botões funcionais: Estudo Local, Quiz Rápido, Compartilhar, Ver Ranking;
- Ranking antigo restaurado: Diário, Global e Igrejas;
- Configurações antigas restauradas: redefinir senha, alterar e-mail, feedback, sobre o app;
- API `/api/generate` preservada e mais resiliente;
- Firebase existente preservado;
- PWA preservado.

## Importante sobre o erro de quota

A mensagem `You exceeded your current quota` não é bug no código. Ela significa que a conta OpenAI está sem crédito, sem billing ativo ou atingiu limite. O app agora não quebra: ele gera estudo local automaticamente.

Para IA real voltar:
1. Acesse a OpenAI Platform.
2. Configure billing/créditos/limites.
3. Confirme `OPENAI_API_KEY` na Vercel.
4. Faça Redeploy.

## Estrutura para subir na Vercel

Mantenha tudo na raiz do repositório:

```text
api/generate.js
public/manifest.webmanifest
public/icon.svg
index.html
sw.js
vercel.json
firestore.rules
```

Na Vercel:

```text
Framework Preset: Other
Build Command: vazio
Output Directory: .
Install Command: vazio ou npm install
```
