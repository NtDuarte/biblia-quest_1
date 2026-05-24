# Validação Sênior — Trilha VIVA

## O que foi melhorado

- Mantida a estrutura Firebase existente e a rota `/api/generate`.
- Corrigida a lógica de quiz local para perguntas sobre a Palavra, não sobre o app.
- Adicionada aba **Mais** com expansões funcionais:
  - Flashcards bíblicos.
  - Memorização de versículos.
  - Batalha bíblica.
  - Leitura narrada pelo navegador.
  - Modo infantil.
  - Modo jovem.
  - Modo seminário.
  - Grego/Hebraico introdutório.
  - Apologética.
  - Painel pastoral local.
  - Desafio da igreja.
  - Temporadas e conquistas.
- Mantidos ranking antigo, configurações, feedback, reset de senha, alteração de e-mail e PWA.
- Mantida proteção contra quota/billing da OpenAI com fallback local automático.
- Reforçada validação automatizada para impedir retorno de perguntas institucionais no quiz.

## Testes executados

```text
✅ Smoke test OK: segurança e funcionalidade básica validadas.
✅ API test OK: método, fallback e quota validados.
✅ Feature test OK: trilha, quizzes bíblicos e expansões validadas.
```

## Observações de produção

- A IA real depende de `OPENAI_API_KEY` configurada na Vercel.
- Se a conta OpenAI estiver sem crédito/quota, o app continua funcionando com estudos locais.
- O painel pastoral nesta versão é local e seguro. Para dados reais da igreja, é necessário modelar permissões, consentimento e regras Firestore específicas.
