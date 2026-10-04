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
