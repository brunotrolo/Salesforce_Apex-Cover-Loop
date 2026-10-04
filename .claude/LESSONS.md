# LESSONS.md — licoes acumuladas (apendice, nunca reescreva o historico)

Cada entrada: data, o que aconteceu, a regra que resultou. So acrescenta no fim; uma
entrada antiga nunca e editada ou removida (se uma regra mudar depois, uma nova entrada
explica a mudanca, a antiga fica como registro).

---

## 2026-10-04 — quick deploy escopado tambem precisa valer no modo scaffold

**O que aconteceu:** o `guard.mjs` ja negava `--source-dir` combinado com
`--test-level NoTestRun` no deploy normal do loop (so `--metadata <Tipo>:<Nome>`
escopado era aceito), mas o modo **scaffold** (dev/treino, dependencias faltantes)
ainda recomendava, em `references/scaffolding-dependencies.md`, um unico deploy via
`--source-dir force-app` para subir objeto/MDT/classe/teste novos de uma vez. Isso
reabria, so no scaffold, a mesma imprecisao que o `--metadata` existe para evitar —
espelhando o mandato equivalente do `--metadata`-only para ciclos rapidos de sandbox na
journey_developer.

**Regra que resultou:**
- `guard.mjs`: nova regra de `DESTRUCTIVE_RULES` nega (`deny`) `--source-dir` **e**
  `--test-level NoTestRun` juntos em qualquer `sf project deploy start`, independente da
  ordem dos flags no comando (cobre o modo scaffold tambem, nao so o loop normal).
- `references/scaffolding-dependencies.md`: a recomendacao de deploy inicial do modo
  scaffold deixou de ser `--source-dir force-app` e passou a ser uma lista explicita e
  separada por virgula em `--metadata`, um item por artefato recem-scaffoldado (ex.:
  `--metadata CustomObject:Card__c,CustomField:Card__c.Amount__c,ApexClass:CardService,ApexClass:CardServiceTest`).

---

## 2026-10-04 — classe de teste nao autocontida quebrou deploy em PRODUCAO

**O que aconteceu:** reportado pelo time de desenvolvimento usando esta skill num
projeto real. Uma classe de teste bateu >=99% de cobertura e passou os dois portoes
localmente, mas o deploy para PRODUCAO falhou porque a classe de teste fazia uma query
SOQL a um artefato de configuracao da org (ex.: RecordType/Profile por nome literal)
que nao existia naquele ambiente. O loop nao tinha nenhuma trava — nem de regra nem
estrutural — contra esse vetor: a regra 2 ("sem SeeAllData=true, sem IDs hardcoded")
nao cobre uma query que assume uma linha de configuracao por nome, que e um problema
diferente (a query roda e retorna vazio/erra mesmo sem SeeAllData). O time tambem
pediu, no mesmo pedido, dois pontos relacionados: a classe de teste nao pode depender
de dados/setup de OUTRA classe de teste, e deve ser o minimo viavel para bater a meta
(simples, pequena, rapida).

**Regra que resultou:**
- `loop-rules.md`: nova regra 7 ("A classe de teste e AUTOCONTIDA") cobrindo os dois
  vetores — nunca SOQL literal contra objeto de configuracao da org
  (RecordType/Profile/PermissionSet/Queue/Group/UserRole/BusinessHours/Organization)
  filtrando por Name/DeveloperName (usar describe via `Schema....
  getRecordTypeInfosByDeveloperName()` em vez disso), e nunca chamar metodo estatico
  de OUTRA classe `*Test`. Nova regra 8 formaliza o minimo viavel: nenhum cenario alem
  do necessario para bater a meta.
- `guard.mjs`: nova funcao `classifySelfContainment` (hook `PreToolUse` em Write/Edit
  da classe de teste) detecta os dois padroes por heuristica de texto e pede
  confirmacao (`ask`) antes de prosseguir — a 1a vez que este guard analisa o
  CONTEUDO da classe de teste, nao so o caminho do arquivo ou o comando `sf`.
- `SKILL.md`: o Gate de pre-deploy agora pede confirmacao explicita de autocontencao
  antes do 1o deploy, e o resumo "Nunca faça" cita os dois vetores.
