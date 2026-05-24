# Trilha VIVA - manutenção de segurança

## O que foi preservado
- Configuração Firebase existente no HTML.
- Link do app: https://trilhaviva.vercel.app/
- Endpoint esperado pelo front: /api/generate
- Estrutura principal de telas, ranking, diário, estudos e compartilhamento.

## Melhorias aplicadas
- Remoção de renderizações perigosas com innerHTML em dados vindos do usuário/Firestore.
- Validação de e-mail, senha, nome, igreja, notas, dúvidas e sugestões.
- Limite de tamanho para textos enviados para Firestore e API.
- Timeout e tratamento melhor de erro na chamada /api/generate.
- Metas de segurança: CSP, referrer policy, theme-color e upgrade-insecure-requests.
- UI mais atual: fundo em gradiente, cards com glass effect, foco acessível, hover, sticky header e redução de animações para quem preferir.
- API serverless segura com variável de ambiente OPENAI_API_KEY, rate limit simples e headers de segurança.
- Regras sugeridas do Firestore para impedir escrita/leitura indevida.

## Variáveis da Vercel
Configure em Project Settings > Environment Variables:
- OPENAI_API_KEY = sua chave secreta
- OPENAI_MODEL = opcional, por exemplo gpt-4o-mini

## Atenção
Firebase apiKey no frontend não é segredo absoluto, mas o projeto precisa de Firestore Rules e domínios autorizados no Firebase Authentication.
