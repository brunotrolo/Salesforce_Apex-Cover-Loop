# Recomendacoes de melhoria — skill apex-test-loop

Registro **vivo** de melhorias para a propria skill. A fase de retrospectiva do
loop (autoaprendizado) anexa propostas aqui com base no que aconteceu num run
real; um humano revisa e decide. Este arquivo viaja junto com a skill, entao
existe tanto no repositorio-casa quanto na copia dentro do seu projeto Salesforce.

## Como funciona (o ciclo)

1. **Skill propoe** — ao terminar um run **com friccao real** (o guard bloqueou
   algo, dependencia travou o deploy, muitas iteracoes sem evoluir, precisou de
   decisao humana, faltou orientacao numa referencia...), a skill ANEXA aqui uma
   proposta com status `Proposta`. Em runs limpos, nao anexa nada (evita ruido).
2. **Voce pede** — "leia as recomendacoes e ajuste a skill se concordar".
3. **Revisao** — cada item recebe um status final; as aprovadas sao aplicadas e o
   PR/commit e anotado.

## Status

🟡 **Proposta** · 🟢 **Aprovada** (vamos aplicar) · ✅ **Aplicada** (feita, com PR) ·
⚪ **Reprovada** (com motivo)

## Regras para a skill (ao anexar)

- **Nao duplicar**: se ja existe item (aberto ou aplicado) sobre o mesmo ponto,
  nao crie outro — no maximo, adicione uma nota.
- **Ser concreto**: descreva o gatilho real, o problema e a mudanca proposta em
  termos acionaveis (qual arquivo/regra/passo). Nada de generico.
- **ID sequencial**: use o proximo `R-XXXX` livre.
- **Poucos e bons**: no maximo ~3 por run; so o que teve friccao de verdade.
- **LOCAL, sem `git push`**: 🚫 nunca rode `git add/commit/push` de recomendacoes.
  Este arquivo e uma **copia** dentro do projeto do dev, sem acesso de escrita ao
  repo-casa; se varios devs empurrassem, um sobrescreveria o outro. Apenas edite o
  `.md` e avise o usuario que a recomendacao ficou **local** e deve ser enviada ao
  mantenedor quando ele abrir a coleta (a consolidacao no repo e central e manual —
  ver `references/contribution-guidelines.md` → "papel do mantenedor"). Nunca diga que
  "registrou no GitHub".

---

## Recomendacoes

> **Arquivo (R-0001 a R-0036) — índice compacto.** As entradas antigas já aplicadas
> foram condensadas neste índice para enxugar o ledger (o texto completo continua no
> histórico do git). As entradas recentes/abertas (R-0037+) seguem em texto completo
> abaixo. Para o detalhe de uma arquivada: `git log -p -- <este arquivo>`.

- **R-0001** — Proibir explicitamente apagar/mover/sobrescrever a classe de producao — ✅ Aplicada (PR #7)
- **R-0002** — Regras de permissao tambem em PowerShell (Windows sem Git Bash) — ✅ Aplicada (PR #6)
- **R-0003** — Deploy somente da classe de teste (nao reenviar producao) — ✅ Aplicada (PR #8)
- **R-0004** — Bloquear escrita (Write/Edit) na classe de producao — ✅ Aplicada (PR #8)
- **R-0005** — Tratar deploy bloqueado por dependencia sem recriar/stubar — ✅ Aplicada (PR #8)
- **R-0006** — Modo scaffold: criar o minimo de dependencias faltantes (dev/treino) — ✅ Aplicada (PR #10)
- **R-0007** — Guard bloqueia so SOBRESCRITA de producao existente (permite arquivos novos) — ✅ Aplicada (PR #10)
- **R-0008** — Liberar geral mantendo as travas (reduzir prompts, sobretudo PowerShell) — ✅ Aplicada (PR #10)
- **R-0009** — Arquitetura hibrida: importar skills oficiais + enxugar a nossa — ✅ Aplicada (PR #12)
- **R-0010** — Guard: sobrescrita de producao vira `ask` (nao mais `deny` duro) — ✅ Aplicada (PR #12)
- **R-0011** — Adaptar boas regras deles ao anti-cheat (bulk 251+, valor exato) — ✅ Aplicada (PR #12)
- **R-0012** — Memoria de estado do run (checkpoint por classe) — ✅ Aplicada (PR #13)
- **R-0013** — Empacotar como Plugin do Claude Code — 🟡 Proposta
- **R-0014** — Modo bypassPermissions (zero prompts) mantendo deny + guard — ✅ Aplicada (PR #15)
- **R-0015** — [campo] Remocao de teste bulk por CPU limit (CaseHandler) — 🟢 Aprovada como licao / decisao de campo ⚪ Reprovada (PR #16)
- **R-0016** — [campo] Try/catch engolindo falhas de entitlement (CaseHandler) — 🟢 Aprovada como licao / decisao de campo ⚪ Reprovada (PR #16)
- **R-0017** — [campo] Testes em memoria vs Flow bloqueando DML (CaseHandler) — 🟢 Aprovada parcialmente (PR #16)
- **R-0018** — Bloqueios de runtime, regra do platô e retrospectiva imediata — ✅ Aplicada (PR #16)
- **R-0019** — Framework de decisao quando o teto so aparece DEPOIS do Passo 0 — ✅ Aplicada (PR #17)
- **R-0020** — Inventario mecanico de metodos no Passo 0 (nao so "ler e entender") — ✅ Aplicada (PR #18)
- **R-0021** — Decomposicao por metodo (fan-out) para classes grandes — ✅ Aplicada (PR #18)
- **R-0022** — [campo] Checkpoint duplicado/divergente quebra retomada — ✅ Aplicada (PR #19)
- **R-0023** — [campo] Nunca truncar (tail/head) a saida do apex-coverage.mjs — ✅ Aplicada (PR #19)
- **R-0024** — [campo] Circuit-breaker ao investigar UMA falha especifica — ✅ Aplicada (PR #19)
- **R-0025** — Disciplina de execucao: autonomia por padrao, lote por deploy, dieta de contexto — ✅ Aplicada (PR #19)
- **R-0026** — Benchmark humano×agente + minerar testes existentes como receita de dado — ✅ Aplicada (PR #19)
- **R-0027** — MVP deployavel como PADRAO; verificacao exaustiva vira `--rigoroso` (opt-in) — ✅ Aplicada (PR #19)
- **R-0028** — [campo] Caminho do state file divergia entre ferramentas (Claude Code × OpenCode) — ✅ Aplicada (PR desta sessao)
- **R-0029** — Centralizar padroes agnosticos em references/ + separar os dois ledgers — ✅ Aplicada (PR desta sessao)
- **R-0030** — Endurecer o guard (find/mv/rm-dir) e reconhecer o falso-positivo por texto — ✅ Aplicada (parcial — gaps fechados; falso-positivo aceito como trade-off)
- **R-0031** — Inventario do Passo 0 portavel (grep quebra no Windows/OpenCode) — ✅ Aplicada (orientacao) — vinda de run em campo (OpenCode/DeepSeek, CustomerData_ctr)
- **R-0032** — Iteracao rapida com `--tests` ao depurar falha (COM ressalva de cobertura) — ✅ Aplicada (SKILL.md passo 3 + sf-cli-and-coverage.md)
- **R-0033** — Fallback de comandos `sf` crus quando o `apex-coverage.mjs` falha — ✅ Aplicada (sf-cli-and-coverage.md) — com comandos CORRIGIDOS
- **R-0034** — [campo] Bulk DML em trigger pesada estoura CPU → split em grupos com startTest/stopTest proprio — ✅ Aplicada (esta sessao) — proposta em campo (OpenCode, CaseHandler), processada e refinada aqui
- **R-0035** — [campo] Varredura por OUTROS bulks grandes ao diagnosticar CPU limit — ✅ Aplicada (esta sessao) — proposta em campo, grep corrigido
- **R-0036** — Portao de estabilidade: sinalizar testes lentos (CPU-fragil) antes de concluir — ✅ Aplicada (esta sessao)

### R-0037 — V2: arquitetura multiagente (orquestrador + 4 especialistas)
- **Status:** 🟡 Proposta (mergeada na `main` via PR #25, aguardando homologacao end-to-end numa org real)
- **Data:** 2026-07-23
- **Gatilho:** o `SKILL.md` unico concentrava orquestracao + regras de negocio + craft,
  crescendo para 550+ linhas e tornando dificil auditar/testar cada responsabilidade
  isoladamente. O usuario pediu decompor em um agente orquestrador 100% autonomo mais
  4 subagentes especialistas (escrever, deploy/rodar, analisar cobertura, gravar
  estado/aprendizado), com paralelismo so onde faz sentido (state-recorder da iteracao
  N em paralelo ao inicio da escrita da N+1; classes diferentes em paralelo entre si;
  nunca escrever/rodar/analisar fora de ordem dentro de UMA classe).
- **Problema evitado:** decisao de negocio duplicada/divergente entre agentes (ex.:
  cada um interpretando "concluido" do seu jeito) e arquivos de estado/aprendizado
  espalhados pelo projeto se qualquer agente pudesse escrever livremente.
- **Melhoria aplicada:**
  1. `references/loop-rules.md` criado como **fonte unica** de regras de negocio
     (meta, criterio de conclusao objetivo, travas, pontos de decisao humana, regra do
     platô, portao de estabilidade) — todos os 5 agentes leem daqui, nenhum reimplementa.
  2. `.claude/agents/apex-orchestrator.md`, `apex-test-writer.md`,
     `apex-deploy-runner.md`, `apex-coverage-analyst.md`, `apex-state-recorder.md`
     criados com responsabilidade unica cada um (tabela "quem decide o que" em
     `loop-rules.md`).
  3. **Ajuste do usuario sobre autonomia:** o orquestrador e 100% autonomo — o UNICO
     criterio normal de parada por sucesso e `coveredPercent>=99 E failures==[] E
     slowTests==[]` vindo do dado real da ORG; o limite de 6 iteracoes deixa de ser
     "parada normal" e vira parada de emergencia (mantendo o relatorio ao humano).
  4. `SKILL.md` enxugado para so apontar para o orquestrador + a tabela de agentes,
     removendo a duplicacao de regras que agora moram em `loop-rules.md`.
  5. `apex-state-recorder` e o **unico** agente com permissao de escrita fora da
     classe de teste, com allowlist fechada de 4 caminhos (`state/<Classe>.md`,
     `state/<Classe>.log.md`, `RECOMMENDATIONS.md`,
     `references/apex-test-loop-recommendations.md`) — reforcada no `guard.mjs`
     (`classifyStateWrite`) independente do prompt, para impedir arquivo solto
     poluindo a raiz do projeto ou pastas arbitrarias (bloqueia nomes tipo
     `-Copia`/`-backup`/diretorios novos dentro de `.apex-test-loop/`).
  6. `.apex-test-loop/` adicionado ao `.gitignore` do template do projeto (estado
     local, nunca versionado — mesma logica do `RECOMMENDATIONS.md`).
- **Proximo passo:** homologar em `main` (deploy real numa org de teste, rodando pelo
  menos uma classe do zero, uma retomada de estado, e um cenario de bloqueio). Se a
  homologacao confirmar o comportamento, mover status para `✅ Aplicada`.

### R-0038 — V2: Portão 2 de conclusão via `deploy validate` (deployabilidade oficial)
- **Status:** 🟡 Proposta (mergeada na `main` via PR #25, aguardando homologacao end-to-end numa org real)
- **Data:** 2026-07-23
- **Gatilho:** os devs do projeto do usuario validam a classe no ambiente com
  `sf project deploy validate --target-org <org> --metadata "ApexClass:X" "ApexClass:X_tst"
  --test-level RunSpecifiedTests --tests "X_tst"` e destacaram que, para deployar uma
  classe, **o que prevalece e a COBERTURA** (nao "os testes passaram") — e que `deploy
  validate` (check-only) e o gate real de deployabilidade.
- **Problema:** o loop media conclusao so por `sf apex run test` (rapido, mas nao e o
  veredito de "isso deployaria em producao?"). `apex run test` e `deploy validate` podem
  divergir em casos de cobertura agregada da org; o numero que libera producao e o do
  `validate`.
- **Decisao do usuario (opcao 2, aprovada):** iterar rapido com `apex run test` a cada
  iteracao (Portão 1) e rodar `deploy validate --test-level RunSpecifiedTests` UMA vez,
  so quando o Portão 1 bater >=99%, como confirmacao oficial (Portão 2) antes de
  declarar `concluido`. Nao rodar `validate` a cada iteracao (mais pesado).
- **Melhoria aplicada:**
  1. `scripts/apex-coverage.mjs` ganha o modo `--validate`: roda `sf project deploy
     validate` (check-only, nao grava na org) incluindo producao + teste no `--metadata`,
     com `--test-level RunSpecifiedTests --tests <TestClass>`, e emite
     `{ phase:"validate", deployWouldSucceed, coveredPercent, uncoveredLines, failures,
     validateError }`. Aditivo — nao muda o comportamento das iteracoes normais.
  2. `references/loop-rules.md`: criterio de conclusao agora tem dois portões (1 rapido
     por iteracao; 2 oficial uma vez ao final). So conclui com `deployWouldSucceed ==
     true E coveredPercent >= 99 E failures == []`.
  3. `apex-orchestrator`, `apex-deploy-runner` e `apex-coverage-analyst` atualizados para
     o fluxo de dois portões (quem roda o `--validate`, quando, e como ler o resultado).
  4. `SKILL.md` e `references/sf-cli-and-coverage.md` documentam o comando `deploy
     validate` e por que ele e check-only/seguro incluir a producao no payload.
- **Proximo passo:** homologar junto com R-0037 em `main` — rodar o Portão 2 real numa
  org e confirmar que `deployWouldSucceed`/`validateError` sao lidos corretamente.
  Se confirmar, mover para `✅ Aplicada`.

### R-0039 — V2 homologação: orquestrador pulou o Portão 2 e declarou concluído só com Portão 1
- **Status:** 🟢 Aprovada e aplicada nesta mesma rodada
- **Data:** 2026-07-23
- **Gatilho:** primeiro run real de homologação da V2 (`invoiceSummary_ctr`, org
  `OdinArchitect`). O orquestrador bateu 99% via `sf apex run test` (22/22 passing) e
  escreveu `status: concluido` diretamente — **nunca invocou** o `apex-deploy-runner`
  com `--validate`. O checkpoint final não tinha nenhum campo/menção ao Portão 2.
- **Problema:** a instrução do Portão 2 existia só em prosa (passo 6 do
  `apex-orchestrator.md`) — não havia nenhuma trava estrutural no checkpoint que
  tornasse impossível concluir sem o dado do `deploy validate`. Um modelo (mesmo
  forte) pode "esquecer" um passo de prosa sob pressão de já ter batido a meta visível.
- **Melhoria aplicada:**
  1. `references/run-state.md`: template do checkpoint ganha os campos
     `portao_1_apex_run_test` e `portao_2_deploy_validate` (pendente/confirmado/falhou)
     — agora é visível e explícito, não implícito.
  2. Regra nova: `status: concluido` **exige** `portao_2_deploy_validate: confirmado`.
  3. `apex-state-recorder.md`: ganha trava dura — recusa gravar `concluido` sem o
     resultado do `--validate` anexado ao pedido; grava `em_andamento` e devolve ao
     orquestrador.
  4. `apex-orchestrator.md`: passo de autonomia ganha aviso explícito citando esta
     falha real, deixando claro que bater o Portão 1 nunca é suficiente sozinho.
- **Próximo passo:** re-rodar a homologação (ou continuar com uma classe nova) e
  confirmar que, desta vez, o checkpoint final mostra `portao_2_deploy_validate:
  confirmado` com o resultado real do `deploy validate`. Só então R-0037/R-0038 podem
  virar `✅ Aplicada`.

### R-0040 — V2 homologação: agente principal assumiu o loop após interrupção do orquestrador
- **Status:** 🟢 Aprovada e aplicada nesta mesma rodada
- **Data:** 2026-07-23
- **Gatilho:** segundo run de homologação da V2 (`invoiceSummary_ctr`). O Task do
  `apex-orchestrator` retornou no meio do loop (após o 1º deploy: 47%, 6/12 falhando —
  provável teto de tempo/tool-calls do harness, ~89 chamadas / ~30min). O **agente
  principal (skill)** então assumiu o loop ele mesmo: editou `invoiceSummary_ctrTest.cls`,
  rodou `apex-coverage.mjs`, editou o checkpoint e analisou as 6 falhas — tudo inline,
  sem reinvocar o orquestrador nem nenhum subagente.
- **Problema:** colapso da arquitetura V2 num único agente. A separação de papéis
  (writer/runner/analyst/recorder), a allowlist do state-recorder e a disciplina dos
  dois portões perdem o sentido se o agente de topo faz tudo. O `SKILL.md` mandava
  "ficar fora do caminho", mas não dizia **o que fazer se o Task do orquestrador
  voltasse sem status terminal** — então o agente "ajudou" fazendo o trabalho.
- **Melhoria aplicada:**
  1. `SKILL.md`: nova seção "Delegação é EXCLUSIVA" — o agente principal NUNCA edita
     teste/roda deploy/escreve checkpoint/analisa cobertura; se o Task do orquestrador
     retornar sem `concluido`/`bloqueado` explícito, a ÚNICA ação é **reinvocar** o
     orquestrador para retomar do checkpoint, quantas vezes for preciso. Sintoma de
     violação nomeado (TODOs tipo "corrigir as N falhas" são do orquestrador, não seus).
  2. `apex-orchestrator.md`: seção "Delegue SEMPRE" (nunca faz o trabalho dos
     subagentes inline) + "Interrupção e retomada" (pode ser reinvocado; ler checkpoint
     no Passo 0; garantir que o recorder grava a cada iteração; retorno com status
     explícito para a skill decidir reinvocar).
- **Observação secundária (não corrigida aqui):** no Windows, `sf` no PATH apontava
  para `C:\Program Files\...` e alguns comandos quebraram com `'C:\Program' não é
  reconhecido` (aspas/espaços no caminho, mistura Git Bash × cmd). Contornado no run com
  `powershell -Command`. Candidato a hardening futuro do `apex-coverage.mjs`/fallbacks.
- **Próximo passo:** re-rodar a homologação e confirmar, pelo trace, que TODA iteração
  (não só a primeira) passa pelos subagentes — e que interrupções do orquestrador
  resultam em **reinvocação**, não em o agente principal assumir.

### R-0041 — V2 homologação: loop perguntou "quer prosseguir com o Portão 2?" (violação de autonomia)
- **Status:** 🟢 Aprovada e aplicada nesta mesma rodada
- **Data:** 2026-07-23
- **Gatilho:** run de homologação da V2 via OpenCode + DeepSeek V4 Flash Free
  (`invoiceSummary_ctr`). Ao bater o Portão 1 (99%, 28/28 passando), o loop apresentou
  o Portão 2 como um item de uma lista "Próximos passos possíveis" e **perguntou ao
  humano "Quer prosseguir com o Portão 2?"** — parando para aguardar resposta. O humano
  respondeu "sim" e só então rodou o `deploy validate`.
- **Problema:** o Portão 2 é parte do critério de conclusão — automático e obrigatório
  quando o Portão 1 bate — não um ponto de decisão humana. Perguntar viola a autonomia
  de 100% do orquestrador e transforma um passo mandatório em opcional (risco de o
  usuário dizer "não" e a classe ser declarada pronta sem a confirmação oficial de
  deployabilidade). Modelo fraco (DeepSeek Flash) amplifica a tendência de "pedir
  permissão", mas a regra tem de ser explícita para qualquer modelo.
- **Melhoria aplicada:**
  1. `loop-rules.md` (critério de conclusão): bloco novo "O Portão 2 é AUTOMÁTICO e
     OBRIGATÓRIO — NUNCA pergunte ao humano se deve rodá-lo", citando os sintomas
     exatos (pergunta de confirmação, listar como "próximo passo possível").
  2. `loop-rules.md` (pontos de decisão humana): a lista das 5 pausas legítimas agora
     é declarada **exaustiva**, com nota de que rodar o Portão 2 não está nela.
  3. `apex-orchestrator.md`: aviso explícito citando a falha — após o Portão 1, a
     próxima ação é sempre invocar `--validate` na hora, sem pergunta.
- **Próximo passo:** re-rodar e confirmar, pelo trace, que ao bater 99% o loop dispara
  o `deploy validate` sozinho e só fala com o humano no veredito final (concluído com
  Portão 2 confirmado, ou bloqueado se o validate falhar).

### R-0042 — Volta ao contexto único (híbrido): 1 agente + governança da V2
- **Status:** 🟡 Proposta (na branch `claude/apex-test-loop-hibrido`, aguardando homologação)
- **Data:** 2026-07-24
- **Gatilho:** após a homologação da V2 acumular 3 defeitos seguidos (R-0039 concluir sem
  Portão 2, R-0040 agente principal assumir o loop, R-0041 pedir permissão para o Portão
  2), o usuário observou que a versão monolítica anterior "parecia mais garantida e não
  quebrava". A análise confirmou: os 3 defeitos têm a MESMA raiz — cada passo da V2 é um
  `Task` separado, e toda fronteira de `Task` é (a) um ponto onde o harness corta por
  teto de tempo/tool-calls e (b) onde um modelo fraco perde contexto. O monolítico tinha
  um único contexto acumulando tudo, sem "entre passos".
- **Problema:** a decomposição em 5 subagentes ajuda o AUTOR (auditabilidade, separação
  de papéis) mas cobra da EXECUÇÃO (fragilidade de handoff, mais pontos de quebra, pior
  com DeepSeek Flash). Para um loop sequencial apertado sobre UMA classe, o saldo ficou
  negativo — ainda mais no alvo de custo zero (OpenCode + modelo free).
- **Decisão do usuário (aprovada):** híbrido — colapsar os 5 agentes num agente de
  **contexto único** que conduz o loop inteiro inline (robustez do monolítico), MANTENDO
  a governança estrutural que a V2 trouxe de bom.
- **Melhoria aplicada:**
  1. `SKILL.md` reescrito como executor de contexto único: Passo 0 → gate de pré-deploy
     → loop (escrever→deploy→analisar→gravar) → dois portões → conclusão. Sem `Task`,
     sem subagentes. Aponta para `loop-rules.md` (regras) e delega craft às skills oficiais.
  2. Os 5 arquivos `.claude/agents/apex-*.md` removidos (a parte frágil).
  3. `loop-rules.md`, `run-state.md`, `guard.mjs` (comentários) atualizados para o modelo
     de agente único — SEM perder nenhuma regra: fonte única, dois portões estruturais,
     allowlist de estado, gate de pré-deploy, regra do platô, portão de estabilidade e
     travas de segurança seguem idênticos.
  4. Governança preservada 1:1: `loop-rules.md` (fonte única), campos `portao_1_*`/
     `portao_2_*` no checkpoint, `guard.mjs` (deny destrutivo + ask sobrescrita produção
     + allowlist de estado), `apex-coverage.mjs` (sinal determinístico).
- **Observações abertas (candidatas a hardening, não bloqueiam o híbrido):** (a) o
  `apex-coverage.mjs` travou no timeout de 60s do harness na máquina do usuário (run
  síncrono + testes de callout) — o `SKILL.md` agora orienta timeout ≥300s; (b) o parser
  do modo `--validate` lê a estrutura da Metadata API e nunca foi exercitado end-to-end
  (no run real o usuário rodou o `deploy validate` na mão) — validar na homologação.
- **Próximo passo:** homologar o híbrido numa org real (1ª execução, retomada, bloqueio)
  e confirmar que rodar num contexto só elimina os defeitos R-0039/40/41. Se confirmar,
  mover R-0037/R-0038/R-0042 conforme o resultado e mergear na `main`.

### R-0043 — Auditoria de consistência do híbrido: 2 furos fechados + 3 docs alinhados
- **Status:** 🟢 Aprovada e aplicada (na branch `claude/apex-test-loop-consistencia`)
- **Data:** 2026-07-24
- **Gatilho:** após mergear o híbrido (R-0042), o usuário pediu uma auditoria de
  consistência focada em estabilidade/governança — garantir que nenhuma etapa do loop
  tem furo de lógica ou regra contraditória. O cruzamento de contratos (`SKILL.md` ↔
  `apex-coverage.mjs` ↔ `guard.mjs` ↔ `run-state.md` ↔ `loop-rules.md` ↔ `settings.json`)
  confirmou a espinha íntegra, mas achou 2 furos reais + 3 imprecisões de doc.
- **Furos fechados:**
  1. **Portão 2 — parser frágil + buraco de cobertura nula (ALTO).** No `--validate`,
     `deployWouldSucceed` dependia só do exit do `sf`, mas `coveredPercent` era lido de
     UMA estrutura (Metadata API). Se o `sf` devolvesse formato diferente, vinha
     `coveredPercent: null` com `deployWouldSucceed: true` → o critério de conclusão não
     confirmava e o loop podia travar/confundir. Nunca exercitado (o usuário sempre rodou
     o `deploy validate` na mão). **Fix:** parser tenta 2 estruturas (Metadata API + estilo
     `apex run test`); se nenhuma casar, emite `coverageUnreadable: true` + `hint` em vez
     de fingir. `loop-rules.md`/`SKILL.md` agora definem o fallback: com `coverageUnreadable`,
     usar o `coveredPercent` já confirmado no Portão 1 (deployWouldSucceed já garante
     deployabilidade).
  2. **Duplo portão era só instrução (MÉDIO).** Ao colapsar para 1 agente, perdeu-se o
     cross-check que o `apex-state-recorder` fazia (recusar `concluido` sem Portão 2).
     **Fix:** `guard.mjs` ganha `classifyConclusion` — bloqueia (`ask`) gravar
     `status: concluido` no checkpoint sem `portao_2_deploy_validate: confirmado`,
     inspecionando o conteúdo da escrita (Write `content` / Edit `new_string` + o arquivo
     em disco, para não dar falso-positivo). Recupera o cross-check sem reintroduzir
     subagentes. Testado com smoke test (8 casos, todos passam).
- **Docs alinhados:** (3) `parallel-methods.md` ganhou aviso "AVANÇADO/opt-in, o padrão é
  contexto único" (o fan-out reintroduz a fragilidade de R-0040) e trocou "orquestrador"
  por "agente do loop"; (4) `SKILL.md` passo 2 agora explica que o JSON varia por fase
  (`deploy` traz `deployErrors`/`blockedByDependency`; `test` traz `coveredPercent` etc.);
  (5) sobra de "orquestrador" em `loop-rules.md` corrigida. Também generalizei a mensagem
  de `ask` do `guard.mjs` (antes assumia sempre "sobrescrita de produção").
- **Verificado OK (sem furo):** flags do script ↔ SKILL; allowlist do guard (4 caminhos)
  ↔ run-state; `settings.json` (deny + hook) ↔ docs; `slowMs=8000` ↔ "≥8s"; `.gitignore`
  cobre `.apex-test-loop/`; zero referências aos 5 agentes removidos fora deste ledger.
- **Observação aberta:** o timeout de 60s do harness segue mitigado por instrução (≥300s
  no `SKILL.md`), não por trava no script — é ambiental, aceito por ora.
- **Próximo passo:** homologar (o `--validate` real numa org confirma qual das 2
  estruturas o `sf` da org devolve e se o `coverageUnreadable` some).

### R-0044 — 2ª rodada de auditoria: Portão 2 faltava no modo guiado + 3 blindagens
- **Status:** 🟢 Aprovada e aplicada (na branch `claude/consistencia-refs-guiado`)
- **Data:** 2026-07-24
- **Gatilho:** segunda rodada de auditoria de consistência (a pedido do usuário), agora
  varrendo as **referências secundárias** que a 1ª rodada não leu por inteiro. Uma
  varredura estruturada (subagente) cruzou 6 refs contra o modelo atual (contexto único,
  dois portões, meta ≥99%, allowlist de estado). Checagem determinística dos contratos
  que a 1ª rodada já cobria: limpa (campos de portão idênticos entre SKILL/loop-rules/
  run-state/guard/script; flags do SKILL ↔ script; zero referências fantasmas aos agentes).
- **Furo real (MÉDIO) — modo guiado concluía sem o Portão 2:** o `guided-mode.md` ia da
  Etapa 8 (bater ≥99% via `--test-only`) direto para o encerramento, sem nenhuma etapa de
  `deploy validate`. Um iniciante seguindo o roteiro literalmente pularia o Portão 2 —
  contradizendo `loop-rules.md` (o guiado herda as regras, muda só a comunicação).
  **Fix:** nova **Etapa 9 — Confirmação oficial de deploy (Portão 2, automática)** em
  linguagem simples (roda `--validate`, não pede permissão pois é check-only, trata
  `coverageUnreadable`), e o encerramento (agora Etapa 10) condicionado à confirmação.
- **Blindagens (baixas, contra leitura apressada de modelo fraco):**
  - `apex-test-loop-recommendations.md:19`: célula "fan-out" ganhou "(opt-in — ver
    parallel-methods.md)" para não sugerir fan-out como fluxo padrão.
  - `apex-test-loop-recommendations.md` P-0001 Estratégia 2 (refatorar produção via
    `@TestVisible`): marcada explicitamente como **FORA DO ESCOPO** (é da
    `platform-apex-generate`, com aprovação) — o texto já concluía contra ela, agora é
    inequívoco.
  - `sf-cli-and-coverage.md:76`: o "75% org-wide" (fato correto) ganhou cláusula de que
    **não é a meta desta skill** (≥99% na classe).
- **Verificado OK (sem furo):** `runtime-blockers.md`, `scaffolding-dependencies.md`,
  `contribution-guidelines.md` — 100% consistentes.
- **Ponteiro morto corrigido:** a árvore de "Estrutura" do `INFORMACOES.md` listava 3
  arquivos que **nunca existiram** no repo (`quality-checklist.md`,
  `testing-dml-and-exceptions.md`, `callouts-and-async.md`). O `SKILL.md` NÃO os
  referencia (verificado por grep) — o furo era só na doc de usuário. Removidas as 3
  linhas da árvore. (Também aparecem no `RECOMMENDATIONS.md:133`, mas ali é histórico de
  um plano antigo — mantido como registro.)

### R-0045 — Allowlist de escrita: guard impede arquivo solto na raiz/pastas
- **Status:** 🟢 Aprovada e aplicada
- **Data:** 2026-07-24
- **Gatilho:** o usuário pediu garantir uma regra que impeça o loop de gravar arquivos
  em qualquer lugar da raiz/pastas do projeto. Auditoria confirmou o buraco: não havia
  regra positiva de allowlist de escrita, e o `guard.mjs` só barrava `.md` solto dentro
  de `.apex-test-loop/` — um `notes.txt`/`debug.json`/pasta nova na raiz passava.
- **Fix:** `guard.mjs` ganha `classifyStrayFile` — ao CRIAR arquivo NOVO fora da
  allowlist (classe de teste/factory `.cls`/`-meta.xml`, metadados de scaffold, artefatos
  de estado em `.apex-test-loop/` + 2 ledgers), pede confirmação (`ask`). Editar arquivo
  existente é liberado (não atrapalha trabalho fora do loop no mesmo repo). `loop-rules.md`
  ganha a trava #7 (allowlist de escrita) como regra positiva na fonte única. Smoke test:
  12 casos, todos passam.

### R-0046 — Hastear script-first + anti-alucinação de `sf` para dentro do SKILL.md
- **Status:** 🟢 Aprovada e aplicada
- **Data:** 2026-07-24
- **Gatilho:** dois runs em campo (OpenCode/DeepSeek Flash, `invoiceSummary_ctr`)
  mostraram o modelo **ignorando o `apex-coverage.mjs`** e fazendo `sf` na mão, alucinando
  flags que a própria skill já documenta como inválidas: `sf apex get test --class-names`
  (precisa de `--test-run-id`) e `sf project deploy start --run-tests --code-coverage`
  (não existem). Também parseou a cobertura errado 3x até achar `result.coverage.coverage[]`.
- **Problema:** os avisos anti-alucinação e o "use o script" viviam SÓ nas referências
  (`sf-cli-and-coverage.md`), que o modelo fraco não abre. O `SKILL.md` — que carrega
  junto com a skill — não trazia esse aviso no passo operacional.
- **Melhoria aplicada:** hasteado para o passo 2 do `SKILL.md` um bloco curto e direto:
  "rode ESTE script, não improvise `sf`", com as 2 flags alucinadas nomeadas e a
  estrutura correta do JSON (`result.coverage.coverage[]`). Sem inchar (é hoist de
  conteúdo que já existia na referência, agora onde o modelo lê).
- **Expectativa honesta:** eleva o piso, mas não garante — um modelo que ignora
  instrução pode ignorar esta também. O gargalo segue sendo a capacidade do modelo
  (DeepSeek Flash freelanca; Claude conduz pela skill). Candidato futuro (opt-in, mais
  código): modo `--gate` no script que encadeia deploy→teste→validate num comando só,
  para o modelo não ter como pular o Portão 2 nem orquestrar na mão.

### R-0047 — v3: modo `--gate` (deploy→teste→validate num comando) vira o PADRÃO
- **Status:** ✅ Aplicada (v3)
- **Data:** 2026-07-24
- **Gatilho:** dois runs em campo (DeepSeek Flash, `invoiceSummary_ctr`) mostraram o
  modelo chegando a 99% **sem nunca rodar o Portão 2** — porque a validação era um passo
  separado que o modelo orquestrava (e pulava). O usuário pediu uma v3 que **garanta**
  que, ao bater 99%, o `deploy validate` roda.
- **Problema:** com os portões como comandos separados, a garantia dependia do modelo
  lembrar de rodar o `--validate`. Um modelo fraco não lembra.
- **Melhoria aplicada:** modo `--gate` no `apex-coverage.mjs` — uma chamada só faz
  deploy da classe de teste → roda o teste (Portão 1) → e **SÓ se o Portão 1 passar
  (≥99%, sem falhas, sem lentos), roda o `deploy validate` (Portão 2) automaticamente**.
  Emite `phase:"gate"` com `verdict: continuar|concluido|bloqueado`. Assim é
  **impossível** chegar aos 99% sem o Portão 2 disparar — a garantia é estrutural, não
  depende do modelo. `--gate` deploya só a classe de teste com `--ignore-conflicts`
  (seguro, remove o fumble de source-tracking visto em campo). Refatorado com parsers
  puros compartilhados (`extractClassCoverage`/`extractValidateCoverage`/...) e `main()`
  guardada por `invokedDirectly` (modulo testavel). Smoke test dos parsers: 9 casos, PASS.
- **Docs:** `SKILL.md` passo 2 usa `--gate` como padrão e a conclusão exige
  `verdict:"concluido"`; `loop-rules.md` descreve o `--gate` como mecanismo dos dois
  portões. Modos granulares (`--test-only`/`--validate`/`--deploy`) permanecem para
  depuração. A trava `classifyConclusion` (guard) segue reforçando o checkpoint.
- **Consolida a homologação:** fecha o buraco central que R-0039/R-0041 tentaram cobrir
  por instrução — agora é garantido por construção.

### R-0048 — v3 hotfix: Portão 2 do `--gate` incluía produção e quebrava o validate
- **Status:** ✅ Aplicada (v3 hotfix)
- **Data:** 2026-07-24
- **Gatilho:** PRIMEIRA homologação end-to-end da v3 (OpenCode/DeepSeek Flash,
  `invoiceSummary_ctr`, org OdinArchitect). **Boa notícia:** o modelo usou o `--gate` toda
  iteração, manteve o checkpoint e iterou 92%→93%→97%→99% com 30 testes — o script-first +
  `--gate` puxaram o modelo pro trilho. **Bug:** o `--gate`/`--validate` falharam no Portão
  2 com `No source-backed components present in the package`, porque o `runValidate`
  incluía `ApexClass:<producao>` no `--metadata` — e a produção não estava no source local
  (fluxo normal do loop: produção já na org, só o teste é local). O modelo contornou na mão
  validando só a classe de teste (30/30, Succeeded).
- **Problema:** a premissa "incluir produção no validate é seguro porque é check-only"
  estava certa quanto a NÃO sobrescrever, mas ignorava que `deploy validate` exige
  **source-backed components** — sem o `.cls` da produção local, quebra.
- **Fix:** `runValidate()` passa a validar **somente a classe de teste** (`--metadata
  ApexClass:<Test>` + extras). A cobertura da produção continua sendo calculada porque
  `--test-level RunSpecifiedTests` roda o teste, que exercita a produção. `loop-rules.md` e
  `sf-cli-and-coverage.md` corrigidos (removida a inclusão da produção; documentado o erro
  "No source-backed components"). Parsers inalterados (9 casos, PASS).
- **Resultado da homologação:** com este fix, o `--gate` fecha o Portão 2 sozinho (como o
  fallback manual provou). A garantia estrutural da v3 está validada em campo.

<!-- A skill anexa novas propostas ABAIXO desta linha, como R-0049, R-0050... -->
