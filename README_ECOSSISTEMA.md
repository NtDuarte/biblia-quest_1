# Trilha VIVA — Ecossistema Modernizado

## O que entrou nesta versão

- Visual novo com hero, cards de progresso e navegação com aba **Trilhas**.
- Mais de 20 estudos temáticos novos organizados por categorias: Fundamentos, Oração, Caráter, Família, Missão, Sabedoria e Identidade.
- Fluxo de aprendizado: texto bíblico → estudo com IA → quiz → XP → diário → biblioteca.
- Payload da API ampliado para enviar `track` e `goal`, permitindo estudos mais focados.
- Segurança mantida: Firebase preservado, endpoint `/api/generate` preservado, sanitização com `textContent`, validações de senha/e-mail e rate limit na API.

## Arquivos principais

- `index.html`: aplicativo completo.
- `api/generate.js`: endpoint seguro para IA na Vercel.
- `firestore.rules`: regras do Firestore para usuários, notas, estudos e sugestões.
- `README_SECURITY.md`: instruções de segurança da versão anterior.

## Importante

A chave pública do Firebase foi mantida porque apps web Firebase funcionam assim. O segredo real da IA deve continuar somente em variável de ambiente na Vercel: `OPENAI_API_KEY`.
