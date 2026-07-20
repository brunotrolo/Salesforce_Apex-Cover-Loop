# Documentacao Completa — Salesforce-LoopAgentApex

> **Voce esta aqui:** [README.md](./README.md) (comeco rapido) ← → **DOCUMENTATION.md** (referencia)

Guia detalhado de instalacao, arquitetura, seguranca e troubleshooting da skill `apex-test-loop`.

---

## Indice

1. [Como funciona (arquitetura)](#como-funciona-arquitetura)
2. [Skills oficiais importadas](#skills-oficiais-importadas)
3. [Pre-requisitos](#pre-requisitos)
4. [Instalacao detalhada](#instalacao-detalhada)
5. [Travas de seguranca](#travas-de-seguranca)
6. [Rodar na Web (claude.ai/code)](#rodar-na-web-claudeaicode)
7. [Estrutura de arquivos](#estrutura-de-arquivos)
8. [Memoria de estado](#memoria-de-estado)
9. [Autoaprendizado](#autoaprendizado)
10. [Contribuir de volta](#contribuir-de-volta)
11. [Observacoes e troubleshooting](#observacoes-e-troubleshooting)

---

## Como funciona (arquitetura)

Arquitetura **hibrida** para o Claude Code criar **classes de teste Apex** no **minimo viavel deployavel**: meta padrao `>= 99%` de cobertura com **todos os testes passando e portaveis entre ambientes** (o que a plataforma exige para deploy). Quer verificacao exaustiva com asserts? Peca o modo `--rigoroso`.

- **Craft (o "como" fazer)** vem das **skills oficiais da Salesforce** (`forcedotcom/sf-skills`, Apache-2.0) importadas neste projeto — mocks, asserts, data factory, bulk, async, DML, objetos/campos, debug de logs.
- **Orquestracao (o nosso valor)** e a skill **`apex-test-loop`**: o **agent loop** de cobertura, as **travas de seguranca**, o **modo guiado em portugues** e o **modo scaffold** (dev/treino).

Voce informa uma classe (`/apex-test-loop AccountService`), e o Claude Code entra num ciclo fechado, **delegando o craft** as skills oficiais:

```
escrever teste  →  deploy (sf)  →  rodar teste + cobertura  →  ler linhas nao cobertas
      ↑                                                                 ↓
      +----------- melhorar o cenario que falta, em loop --------+
```

O loop so termina quando a cobertura atinge a meta **com todos os testes passando** (no modo `--rigoroso`, tambem com asserts significativos), ou quando bate uma condicao de parada segura (e ai gera um relatorio para o humano).

### O que faz diferente

- **Craft oficial + orquestracao nossa.** Nao reinventamos o "como escrever um bom teste" — isso vem das skills oficiais mantidas pela Salesforce. A nossa camada e o loop que **dirige** o processo ate a meta, com seguranca e UX.
- **Dois niveis de qualidade.** Padrao = **MVP deployavel** (cobertura + testes passando + portabilidade; asserts so quando baratos/estaveis — menos falhas entre ambientes e menos iteracoes). Opcional = **`--rigoroso`** (assert de valor exato com mensagem em todo metodo). Em ambos: nunca mexer na producao, sem SeeAllData, sem IDs hardcoded.
- **Sinal deterministico.** Um script auxiliar (`scripts/apex-coverage.mjs`) roda o teste, faz o parse do JSON do `sf` e devolve **exatamente as linhas nao cobertas**, em vez de o agente adivinhar.
- **Seguranca contra acoes destrutivas (3 camadas).** A `apex-test-loop` so cria/edita a classe de TESTE. Apagar/mover/deletar producao, org ou registros e **bloqueio duro** (`deny` + hook); **sobrescrever** producao existente **pede aprovacao** (`ask`) — assim a `platform-apex-generate` refatora producao com o seu ok, e nunca ha sobrescrita **silenciosa** (o bug que originou tudo isso). Veja "Travas de seguranca" abaixo.

---

## Skills oficiais importadas

Importamos **na integra** 7 skills do `forcedotcom/sf-skills` (Apache-2.0, snapshot `v1.31.0`) para `.claude/skills/`. Elas fornecem o craft; a nossa `apex-test-loop` delega a elas. Detalhes/atribuicao em `.claude/skills/VENDOR-ATTRIBUTION.md`.

| Skill oficial | Para que a nossa loop a usa |
|---|---|
| `platform-apex-test-generate` | escrever/melhorar a classe de teste (mocks, asserts, bulk 251+, async, DML) |
| `platform-apex-test-run` | rodar teste, analisar cobertura, padroes de fix |
| `platform-data-manage` | criar/seedar dados de teste (TestDataFactory, bulk) |
| `platform-apex-logs-debug` | diagnosticar falha por log / governor limit |
| `platform-apex-generate` | autorar/refatorar producao (fora do loop, com aprovacao) |
| `platform-custom-object-generate` | criar objeto `__c` faltante (modo scaffold) |
| `platform-custom-field-generate` | criar campo `__c`/`__mdt` faltante (modo scaffold) |

Cada uma tem os proprios gatilhos (TRIGGER / DO NOT TRIGGER), entao **coexistem sem colisao**: a `apex-test-loop` dispara no "cobrir a classe X ate ~99% em loop"; as oficiais, em pedidos diretos ("escreva um teste", "rode os testes", "crie um objeto").

---

## Pre-requisitos

Na maquina onde o loop roda:

- [Salesforce CLI v2](https://developer.salesforce.com/tools/salesforcecli) (`sf`), autenticado numa org (scratch org ou sandbox): `sf org login web --alias minhaOrg`.
- Node 18+ (para o script auxiliar).
- Um projeto SFDX com a estrutura `force-app/**/classes/`.

---

## Instalacao detalhada

Nao precisa ser especialista. O Claude Code carrega skills **automaticamente** a partir da pasta `.claude/skills/` do projeto.

> **Onde o loop roda de verdade?** O ciclo de cobertura depende do **Salesforce CLI (`sf`)** conectado a uma org. Isso funciona de forma simples no **Claude Code via CLI (no seu computador)**. Na **Web** (claude.ai/code) ha uma limitacao importante — explicada mais abaixo.

### Metodo recomendado — UM comando

Copie **tudo** — nao so a `apex-test-loop`. A skill delega o "craft" para 7 skills **oficiais** da Salesforce. Se voce copiar so `apex-test-loop/`, a delegacao **nao encontra** essas skills e falha silenciosamente. 

Rode **de dentro da pasta do seu projeto Salesforce** (onde esta `force-app`):

**Windows (PowerShell):**
```powershell
git clone --depth 1 https://github.com/brunotrolo/Salesforce-LoopAgentApex.git .skill-tmp; New-Item -ItemType Directory -Force .claude | Out-Null; Copy-Item -Recurse -Force .skill-tmp\.claude\* .claude\; Remove-Item -Recurse -Force .skill-tmp
```

**Mac / Linux / Git Bash:**
```bash
git clone --depth 1 https://github.com/brunotrolo/Salesforce-LoopAgentApex.git .skill-tmp && mkdir -p .claude && cp -r .skill-tmp/.claude/. .claude/ && rm -rf .skill-tmp
```

Ele clona numa pasta temporaria, copia **so o conteudo do `.claude`** (a skill inteira + as 7 oficiais + `settings.json`) pra raiz do seu projeto, e apaga a temporaria.

**Estrutura instalada:**
```
meu-projeto-salesforce/
└── .claude/
    ├── settings.json              ← travas de seguranca (deny/ask) + guard
    └── skills/
        ├── apex-test-loop/        ← a nossa (orquestracao)
        ├── platform-apex-test-generate/
        ├── platform-apex-test-run/
        ├── platform-apex-generate/
        ├── platform-apex-logs-debug/
        ├── platform-data-manage/
        ├── platform-custom-object-generate/
        ├── platform-custom-field-generate/
        ├── VENDOR-ATTRIBUTION.md
        └── VENDOR-sf-skills-LICENSE-Apache-2.0.txt
```

### Atualizar

Para atualizar a skill depois, rode **o mesmo comando** de novo — ele sobrescreve o `.claude` com a versao mais nova da `main`.

⚠️ **Consequencia (por ser copia, nao clone):** a pasta do seu projeto **nao e um clone** deste repo, entao o agente **nao consegue dar `git push`** de recomendacoes daqui. Para registrar aprendizados de um run, veja ["Contribuir de volta"](#contribuir-de-volta) abaixo.

### Alternativas

**Instalacao manual (copiar na mao):**

```bash
# por PROJETO (vale so nesse projeto):
cp -R .claude/skills /caminho/do/seu-projeto-sfdx/.claude/
cp .claude/settings.json /caminho/do/seu-projeto-sfdx/.claude/

# OU global (vale em TODOS os seus projetos no seu computador):
cp -R .claude/skills ~/.claude/
```

> Ja tem um `.claude/settings.json` no seu projeto? O comando acima **sobrescreve** — se voce tinha configuracoes proprias, mescle o bloco `permissions` (`deny`) e `hooks.PreToolUse` deste repositorio com o seu (veja "Travas de seguranca" abaixo).

**Evite:** nao copie so a `apex-test-loop/`. Sempre copie **todas** as 7 skills oficiais juntas.

---

## Travas de seguranca

A skill so pode **criar/editar a classe de TESTE**. Apagar, mover ou sobrescrever a classe de producao (no disco ou na org), rodar deploy destrutivo, ou excluir org/registros e bloqueado em **tres camadas independentes**, ja incluidas no `.claude/settings.json` deste repositorio:

### Camada 1: Instrucoes (SKILL.md)

Uma secao "🚫 NUNCA FACA" no topo do `SKILL.md`, lida antes de qualquer acao.

### Camada 2: Regras deny (permissions.deny)

Bloqueio duro (sem aprovacao possivel) de:
- `sf project delete`
- `sf org delete`
- `sf data delete`

Aplicado a Bash e PowerShell.

### Camada 3: Hook PreToolUse (guard.mjs)

Inspeciona cada acao com **duas respostas**:

- **`deny` (bloqueio duro)** para **comandos** destrutivos:
  - `sf project/org/data delete`
  - Deploy com `--pre`/`--post-destructive-changes`
  - `rm`/`del`/`Remove-Item` de `.cls`/`.cls-meta.xml`
  - `find ... -delete` sobre codigo Apex
  - `rm -rf` de `force-app`/`classes`
  - `mv`/`move` de `.cls`/`.trigger`
  
  Nao ha aprovacao possivel.

- **`ask` (pede aprovacao)** quando um `Write`/`Edit` **sobrescreve** um `.cls`/`.trigger` de **PRODUCAO ja existente** (inclui a classe sob teste) — foi o vetor do bug. A `apex-test-loop` nunca faz isso; mas a `platform-apex-generate` pode refatorar producao **com o seu ok**, e nunca ha sobrescrita **silenciosa**. **Criar arquivo NOVO e liberado** (nunca destroi nada) — e o que permite o modo scaffold criar stubs de dependencias faltantes.

### Rodar em bypass (modo sem prompts, com travas ativas)

Por padrao, o Claude Code pede confirmacao antes de rodar comandos. Em um loop que roda dezenas de vezes, isso incomoda. Por isso o `.claude/settings.json` deste repositorio ja vem com **`bypassPermissions`**: zero prompts pra qualquer ferramenta (Bash, PowerShell, Write, Edit, leitura, etc.) — **mantendo as travas de seguranca ativas**:

```json
{
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": ["Bash(*)", "PowerShell(*)", "Write", "Edit"],
    "deny": [
      "Bash(sf project delete *)", "Bash(sf org delete *)", "Bash(sf data delete *)",
      "PowerShell(sf project delete *)", "PowerShell(sf org delete *)", "PowerShell(sf data delete *)"
    ]
  },
  "hooks": { "PreToolUse": [ /* guard.mjs */ ] }
}
```

**Por que isso e seguro mesmo no bypass:**
- **`deny` continua valendo em `bypassPermissions`** — comandos destrutivos seguem bloqueados, mesmo com zero prompts para o resto.
- **O hook `PreToolUse` (`guard.mjs`) tambem continua valendo** — "hook decisions don't bypass permission rules... Claude Code evaluates deny and ask rules regardless of what a PreToolUse hook returns". O guarda que impede apagar/sobrescrever a producao **funciona igual**, com ou sem bypass.

**O que muda de verdade:** nenhum prompt de aprovacao pra nada — nem Bash/PowerShell, nem escrever/editar arquivo, nem ler. So continuam parando: os `deny` acima, o guard, e alguns circuit-breakers do proprio Claude Code.

**Avisos:**
- **Na primeira sessao**, o Claude Code mostra **um aviso unico** pedindo para voce aceitar responsabilidade por acoes sem checagem — fica salvo na sua conta, aparece uma so vez.
- **So funciona no Claude Code local (CLI).** Na sessao Web (claude.ai/code), este campo e **ignorado silenciosamente** — a sessao la sempre pede aprovacao normal.
- Se o seu administrador tiver bloqueado bypass via `disableBypassPermissionsMode`, este campo tambem e ignorado.

**Quer trocar?**
- Remova a linha `"defaultMode": "bypassPermissions"` e ponha em `.claude/settings.local.json` (nao versionado) so quando quiser usar.
- Ou rode `/permissions` no Claude Code para trocar o modo na hora.

### Limite honesto

O bloqueio por texto e forte para comandos diretos, mas nao e uma fronteira absoluta — wrappers exoticos (`npx`, `docker exec`), variaveis de ambiente ou substituicao de comando podem, em tese, escapar. Por isso as tres camadas coexistem. Mantenha o habito de revisar o que o agente faz em uma org real, e prefira uma **scratch org** descartavel para os primeiros testes.

Para testar o guard voce mesmo: peca ao agente para rodar `sf project delete source ...` — ele deve ser **bloqueado** com uma mensagem da skill.

---

## Rodar na Web (claude.ai/code)

### Conecte este repositorio

No claude.ai/code, conecte a conta do GitHub e selecione o repositorio que contem `.claude/skills/apex-test-loop/`. Ao iniciar uma sessao, o Claude clona o repo e **carrega automaticamente** as skills em `.claude/skills/`.

> Nota: skills pessoais em `~/.claude/skills/` **nao** valem na Web — precisam estar no repositorio.

### Dispare do mesmo jeito

No chat da sessao web, use `/apex-test-loop AccountService` ou peca em linguagem natural.

### ⚠️ Limitacao importante (leia antes)

A sessao web roda num ambiente na nuvem que, por padrao, **nao tem o Salesforce CLI (`sf`) instalado, nao tem a sua org autenticada e nao suporta login interativo**. Ou seja, o passo de **deploy + rodar testes** do loop **nao funciona na Web sem configuracao extra** do ambiente (script de setup para instalar o `sf`, liberacao de rede e credenciais nao-interativas).

**Na pratica:**
- Use a **Web** para escrever, revisar e ajustar a skill e as classes de teste.
- Rode o **loop de cobertura de verdade no CLI local**, onde o `sf` esta instalado e conectado a sua org.
- Se voce realmente precisa rodar na Web, e necessario configurar o ambiente da sessao (setup avancado).

---

## Estrutura de arquivos

```
.claude/skills/
  apex-test-loop/                   # A NOSSA skill (orquestracao)
    SKILL.md                        # o loop, delegacao, regras de ouro, parada
    RECOMMENDATIONS.md              # livro-razao de autoaprendizado
    scripts/
      apex-coverage.mjs             # deploy + run test + parse -> JSON com linhas nao cobertas
      guard.mjs                     # hook PreToolUse: deny destrutivo / ask sobrescrita de producao
    references/
      run-state.md                  # memoria de estado: checkpoint por classe (retomar o loop)
      runtime-blockers.md           # falha por causa da ORG (Flow/config/limites): o que (nao) fazer
      parallel-methods.md           # classes grandes: fan-out por metodo com autoria paralela/deploy sequencial
      guided-mode.md                # roteiro do modo guiado (para leigos, PT)
      scaffolding-dependencies.md   # orquestracao do scaffold dev (__c/__mdt/classes)
      sf-cli-and-coverage.md        # comandos sf crus (deploy/run/cobertura) + fallback quando o script falha
      contribution-guidelines.md    # como registrar aprendizados (R-XXXX)
      apex-test-loop-recommendations.md  # banco de dados de padroes descobertos
      quality-checklist.md          # checklist final antes de marcar "done"
      testing-dml-and-exceptions.md # padroes de teste para DML e excecoes
      callouts-and-async.md         # padroes de teste para callouts e async
      testing-flows.md              # padroes de teste para Flows
  platform-apex-test-generate/      # \
  platform-apex-test-run/           #  |
  platform-apex-generate/           #  |  7 skills OFICIAIS importadas (craft),
  platform-apex-logs-debug/         #  |  snapshot Apache-2.0 do forcedotcom/sf-skills
  platform-data-manage/             #  |
  platform-custom-object-generate/  #  |
  platform-custom-field-generate/   # /
  VENDOR-ATTRIBUTION.md             # de onde vieram as oficiais + licenca
  VENDOR-sf-skills-LICENSE-Apache-2.0.txt
```

> O craft (mocks, asserts, data factory, bulk, async, DML) agora vive nas skills oficiais — por isso a nossa `apex-test-loop` ficou enxuta (so o loop + seguranca + guiado + scaffold).

---

## Memoria de estado

O loop salva um **checkpoint por classe** num caminho **neutro de ferramenta** — `.apex-test-loop/state/<Classe>.md` na raiz do seu projeto (fora de `.claude`/`.opencode`, para Claude Code e OpenCode lerem o MESMO estado): cobertura atual, iteracao, linhas que faltam, o que ja foi feito e o **proximo passo**. 

**Na pratica:**
- Fechou o terminal no meio? Caiu a sessao? E so dizer **"continue de onde paramos"** (ou `/apex-test-loop CardHandler` de novo) — ele le o checkpoint e **retoma dali**, sem recomecar do zero.
- O arquivo e um Markdown legivel: voce pode abrir e ver o progresso a qualquer momento.
- Se o loop parou **bloqueado** (ex.: dependencia faltando), o checkpoint guarda o motivo e o que voce precisa decidir — resolvido isso, ele retoma.

> Nao confundir com o `RECOMMENDATIONS.md` (a memoria LONGA, do que a skill aprende entre runs). O checkpoint e a memoria de UM run sobre UMA classe.

---

## Autoaprendizado

No fim de cada run **com friccao real** (o guard bloqueou algo, uma dependencia travou, precisou de decisao humana, faltou orientacao numa referencia...), a skill anexa recomendacoes de melhoria em `.claude/skills/apex-test-loop/RECOMMENDATIONS.md` — com um ID, o gatilho real, o problema e a mudanca proposta, no status `🟡 Proposta`. Em runs limpos, nao registra nada (evita ruido).

Como o arquivo viaja junto com a skill, ele fica atualizado na copia dentro do seu projeto. Quando quiser incorporar, **basta pedir**: *"leia as recomendacoes e ajuste a skill se concordar"*. Ai cada item vira `🟢 Aprovada` / `⚪ Reprovada` (com motivo) / `✅ Aplicada` (com o PR), e as aprovadas sao implementadas.

O historico das melhorias ja aplicadas (`R-0001` em diante, com o PR de cada uma) esta la como exemplo do formato — inclusive a propria arquitetura hibrida e a memoria de estado nasceram desse ciclo.

---

## Contribuir de volta

O metodo de instalacao de um comando **copia** o `.claude` para o seu projeto — otimo para RODAR o loop, mas essa pasta **nao e um clone** deste repositorio, entao o agente nao consegue `git push` de dali. Ha dois jeitos de registrar aprendizados na `main`:

### Opcao 1: Trazer para o repositorio-casa (simples)

1. Rode o loop no seu projeto normalmente.
2. Quando ele anexar recomendacoes ao `RECOMMENDATIONS.md`, traga esse arquivo para uma sessao **neste repositorio** (que e um clone com `origin`).
3. A revisao/vet e o `git push` acontecem aqui.
4. Depois, no seu projeto, rode o comando de instalacao de novo para puxar a versao atualizada.

### Opcao 2: Trabalhar dentro de um clone (o agente empurra sozinho)

Em vez de copiar o `.claude`, **clone** este repo:

```bash
git clone https://github.com/brunotrolo/Salesforce-LoopAgentApex.git meu-loop
cd meu-loop
```

Trabalhe dentro dele, colocando o seu codigo Salesforce (`force-app` + `sfdx-project.json`) na mesma pasta — se for confidencial, adicione-o ao `.gitignore` para nunca subir:

```bash
# dentro do clone
echo "force-app/" >> .gitignore
echo "sfdx-project.json" >> .gitignore
```

Assim o loop roda e o agente comita/empurra melhorias da skill direto na `main`.

### Troubleshooting: "fatal: not a git repository"

O erro classico e `fatal: not a git repository`: acontece quando a pasta foi **baixada (zip)** em vez de **clonada**. Pasta baixada nao tem `.git` → nenhum commit/push funciona.

**Solucao definitiva:** usar um CLONE, nao um download.

```bash
# Clonar o repo (cria .git + remote automaticamente):
git clone https://github.com/brunotrolo/Salesforce-LoopAgentApex.git

# Trabalhar SEMPRE dentro dessa pasta clonada.
```

Se o push pedir senha/der erro de autenticacao:
- **Opcao A (mais fácil):** `gh auth login` (GitHub CLI) guarda a credencial.
- **Opcao B:** Personal Access Token em github.com → Settings → Developer settings → Tokens.

Enquanto a pasta nao for um clone, as recomendacoes ficam salvas localmente, mas nao sobem sozinhas. O agente deve DIZER isso ao usuario (nao fingir que subiu) e apontar esta receita — nunca deixar o trabalho "perdido no disco" sem avisar.

---

## Observacoes e troubleshooting

### Meta de cobertura

A meta padrao e `>= 99%`. 100% nem sempre e alcancavel (linhas genuinamente inatingiveis); nesses casos a skill **documenta** a linha em vez de forcar um caminho artificial.

A cobertura lida no loop e a atribuivel a classe de teste dedicada. A metrica org-wide (minimo 75% para deploy em producao) e diferente e depende de todos os testes da org.

### Dependencias faltando (modo dev/treino)

Se voce baixou so a classe (sem a org com `__c`/`__mdt`/classes de apoio), o loop nao trava de vez. 

- Em **uso real** ele para e pede para apontar a org com o schema.
- Em **dev/treino**, com seu ok (`--scaffold` ou "estou treinando, sem a org"), ele cria o **minimo** das dependencias faltantes como **arquivos novos** (`__c`/`__mdt` viram metadata XML, nao Apex) — **sem nunca tocar na classe sob teste**.

Detalhes em `references/scaffolding-dependencies.md`. Ideal: uma **scratch org** descartavel.

### Teste falhando por causa da ORG

Falha por Flow, config ausente, limite de CPU? O loop **NAO remove teste que passa nem entrega teste falhando** (Travas). Ele diagnostica a causa e tenta o caminho legitimo primeiro.

- No **MVP padrao**, guardas de portabilidade (try/catch, `isEmpty()`) sao aceitas como fallback.
- No **`--rigoroso`**, nao.

Em ambos, ele tenta o caminho legitimo (criar o dado real, dividir o teste) e, se for limitacao genuina do ambiente, **para e te explica as opcoes** — inclusive re-pactuando a meta com transparencia ("neste ambiente o alcancavel e X%, porque...").

Problemas do codigo de producao descobertos pelos testes (ex.: SOQL em loop) viram a secao **"Achados de producao"** no relatorio final — reportados, nunca corrigidos por conta propria. Detalhes em `references/runtime-blockers.md`.

### Cobertura empacada (plateau)

Se a % ficar parada por 2 iteracoes enquanto os testes aumentam, o loop para de escrever testes e diagnostica quais linhas continuam descobertas (regra do platô) — testes novos passam a mirar linhas especificas.

---

## Ficou com duvida?

Consulte:
- [README.md](./README.md) — comeco rapido (2 minutos)
- `.claude/skills/apex-test-loop/SKILL.md` — orquestracao do loop
- `.claude/skills/apex-test-loop/references/` — guias por tema
- `.claude/skills/apex-test-loop/RECOMMENDATIONS.md` — historico de melhorias
