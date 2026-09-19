# Decomposicao por metodo (fan-out) — para classes grandes com muitos metodos independentes

> ⚠️ **AVANCADO e OPT-IN. O padrao e contexto unico (ver `SKILL.md`).** Este documento
> descreve um fan-out de sub-agentes via `Workflow` — que **reintroduz exatamente a
> fragilidade de passagem de contexto** que motivou a volta ao agente unico (regras que
> nao viajam pro sub-agente, deploy concorrente, escrita concorrente no mesmo arquivo —
> observado em campo). Para a grande maioria das classes, incluindo
> grandes, **fique no loop sequencial de contexto unico**: apenas autore mais cenarios
> por iteracao antes de deployar. So considere este fan-out se a classe for realmente
> enorme (aprox. >20-30 metodos independentes) E voce aceitar montar cada prompt de
> sub-agente com TODAS as regras embutidas (abaixo). Na duvida, NAO use.

Uma classe com dezenas de metodos (aprendido em campo: 31 metodos, ~1064 linhas nao
cobertas) pode ser um caso de **paralelizacao da AUTORIA** — diferente do loop de
cobertura em si, que e sequencial (iteracao N depende do resultado da N-1). Testar
`metodoA` e `metodoB` sao trabalhos **independentes** quando os metodos nao compartilham
estado mutavel nem dependem de ordem de execucao. Esse e o unico eixo em que o `Workflow`
(fan-out de sub-agentes) faz sentido — e mesmo assim so com as guardas abaixo.

## Quando usar

- O inventario mecanico do Passo 0 (item 2) mostrou muitos metodos (aprox. >10-15) e
  cada um tem seu proprio bloco de `uncoveredLines` bem delimitado.
- Cada metodo pode ganhar cenarios de teste sem interferir nos cenarios dos outros.

## ⛔ Os 3 riscos reais de rodar fan-out sem estas regras

1. **Deploy concorrente colide.** Salesforce nao lida bem com multiplos
   `sf project deploy start`/`sf apex run test` simultaneos contra a mesma org
   (erros de "another deployment is in progress", resultados cruzados).
2. **Escrita concorrente no mesmo arquivo de teste.** Se varios agentes editam
   `<Classe>Test.cls` ao mesmo tempo, e receita para sobrescrita/perda de trabalho —
   a mesma categoria de bug que o guard.mjs previne para o Write, so que agora por
   concorrencia, nao por trapaca.
3. **As Travas/regras do modo nao viajam sozinhas.** Um sub-agente de fan-out nao herda o
   contexto desta conversa/run. Se o prompt de cada agente nao incluir explicitamente
   as regras, corre-se o risco de cada um reinventar (ou nao evitar) os mesmos
   atalhos que o loop sequencial evita (mega-teste, try/catch de fachada, remover
   cenario obrigatorio).

## Estrutura segura (autoria em paralelo, execucao sequencial)

```
Fase 1 — AUTORIA (paralelo, seguro):
  cada agente do fan-out recebe: (a) o nome do SEU metodo-alvo, (b) as linhas-alvo
  exatas (uncoveredLines daquele metodo), (c) o texto completo das Travas (sempre) e das Regras de qualidade se o run estiver em `--rigoroso`
  desta skill (proibicoes nomeadas incluidas), (d) instrucao de DELEGAR o craft a
  platform-apex-test-generate, (e) instrucao de RETORNAR o codigo dos metodos de
  teste (texto), NAO escrever direto no arquivo compartilhado nem fazer deploy.

Fase 2 — MERGE (sequencial, um so passo):
  voce (o agente do loop) recebe os retornos de todos os agentes e monta
  <Classe>Test.cls UMA vez, resolvendo nomes duplicados/conflitos de metodo.

Fase 3 — DEPLOY + MEDIR (sequencial, um so passo):
  UM `apex-coverage.mjs --test-only` depois do merge. Nunca um deploy por agente.

Fase 4 — CHECKPOINT (sequencial, um so passo):
  atualize `state/<Classe>.md` UMA vez com o resultado consolidado (cobertura por
  metodo, o que cada agente cobriu, proximo passo) — nunca deixe cada agente
  escrever no checkpoint por conta propria.
```

## Prompt minimo para cada agente do fan-out (nao pule nenhum item)

- Nome do metodo e seu intervalo de linhas.
- As `uncoveredLines` exatas daquele metodo (nao da classe inteira).
- "Delegue o craft (mocks, asserts, TestDataFactory, bulk, async) a
  `platform-apex-test-generate`."
- "NAO escreva no arquivo compartilhado. NAO rode deploy. Devolva o codigo dos
  metodos de teste como texto."
- As **Travas** (valem sempre): nunca tocar producao, sem SeeAllData, sem IDs
  hardcoded, todos os testes devem passar, nunca degradar teste que ja passa.
- **O modo do run**: se `--rigoroso`, inclua tambem as Regras de qualidade (sem
  try/catch de fachada, sem guarda `isEmpty()` em assert, assert de valor exato com
  mensagem, 1 comportamento por metodo). Se MVP (padrao), diga explicitamente que
  guardas de portabilidade sao permitidas e asserts sao opcionais — o objetivo e
  executar as linhas-alvo e PASSAR.
- Se o metodo tiver bloqueio de runtime (Flow, config ausente): reportar de volta
  ao agente do loop, nao decidir sozinho (`references/runtime-blockers.md`).
