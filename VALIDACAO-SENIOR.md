# Validação Sênior — Trilha VIVA Bíblia + IA

## Correções aplicadas

- Removido o modo que criava textos locais como substituto da IA.
- Criada a rota `/api/bible` para buscar passagens bíblicas por referência.
- Refeito `/api/generate` para consultar a passagem bíblica antes da OpenAI.
- Prompt reforçado para gerar estudos somente a partir da Palavra.
- Quiz rápido passou a usar IA com base na passagem, não conteúdo institucional.
- Tratamento de quota/billing agora mostra erro honesto, sem inventar estudo.
- Mantidos ranking antigo, configurações, trilhas por fases, mentor, PWA e segurança.

## Testes executados

```text
✅ Smoke test OK: segurança e funcionalidade básica validadas.
✅ API test OK: IA real, API bíblica e erros sem fallback local validados.
✅ Feature test OK: trilha, quizzes bíblicos e expansões validadas.
```

## Observação de produção

Para gerar estudos reais, a conta OpenAI precisa ter crédito/quota ativa. Se a OpenAI retornar quota excedida, o app não gera texto local e informa o problema corretamente.
