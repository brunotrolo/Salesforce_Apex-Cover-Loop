# AGENTS.md — Salesforce Apex Cover Loop

Instruções para qualquer agente de código que trabalhe **neste repositório**.
Vendor-neutral por design (Claude Code, Cursor, Codex e afins). `CLAUDE.md` aponta para cá
para que exista uma única fonte de verdade.

## O que é este repositório

Este repositório **é uma skill**, não um projeto Salesforce. O que se entrega é o conteúdo
de `.claude/` — a skill autoral `apex-test-loop`, 7 skills oficiais importadas e as
settings — instalado dentro do projeto SFDX de outra pessoa.

A skill conduz um **loop autônomo**: dada uma classe de produção, o agente escreve a classe
de teste, deploya, roda, mede cobertura real na org e itera até os dois portões
(cobertura ≥99% com todos passando; `deployWouldSucceed=true`).

Consequência prática para você: aqui você quase nunca escreve Apex. Você escreve
**instruções que um agente vai executar sozinho, em loop, contra uma org real** — onde um
erro não aparece como exceção, aparece como um número verde que não prova nada.

## Autoridade e fonte única

1. `.claude/skills/apex-test-loop/references/loop-rules.md` — **fonte única** das regras de
   negócio do loop (meta, os dois portões, travas de segurança). Se uma regra precisa
   mudar, muda **ali**, uma vez só. Nunca reimplemente nem reinterprete uma regra dentro do
   `SKILL.md` ou de outra reference.
2. `.claude/rules/karpathy-guidelines.md` — disciplina comportamental, sempre válida.
3. `SKILL.md` é o **executor** que conduz o loop lendo dessas regras, não um segundo lugar
   onde elas vivem.

## Disciplina comportamental

`.claude/rules/karpathy-guidelines.md` vale para o trabalho **neste repositório** tanto
quanto para a execução da skill:

1. **Pense antes de codar** — não codifique um `Assert` sobre comportamento que você não
   entendeu; isso é um teste que finge certeza.
2. **Simplicidade primeiro** — o menor teste que cobre. Nada de framework onde um mock
   resolve.
3. **Mudanças cirúrgicas** — preservar produção, deployar apenas teste. Nunca mexa na
   classe de produção para facilitar a cobertura.
4. **Execução orientada a objetivo** — cobertura é critério forte de execução e **fraco de
   qualidade**. O número satisfaz o portão, não o objetivo.

## Regras inegociáveis

### 1. Conteúdo autoral vs. importado
- **Autoral:** `.claude/skills/apex-test-loop/` e `.claude/rules/`. É aqui que mora o
  conhecimento do projeto.
- **Importado:** as 7 skills `platform-*` vêm de
  [forcedotcom/sf-skills](https://github.com/forcedotcom/sf-skills) (Apache-2.0),
  **na íntegra, sem modificação**, com snapshot pinado em
  `.claude/skills/VENDOR-ATTRIBUTION.md`. Não reescrever. Uma correção que pertence a elas
  vai para o upstream; aqui ela quebraria a promessa de "importado sem modificação" e o
  pin deixaria de descrever o que está no disco.

### 2. As 7 skills importadas são invocáveis de propósito
Elas ficam um nível abaixo de `skills/`, então o Claude Code as expõe como comandos `/`
(`/platform-apex-test-generate` etc.). Isso é intencional — a `apex-test-loop` **delega** o
craft a elas, e a própria descrição da skill redireciona para elas quando o pedido é um
teste avulso sem loop. Não aninhe mais fundo "para limpar o menu".

### 3. Regra nova de negócio vai para `loop-rules.md`
Nunca para o `SKILL.md`, nunca duplicada numa reference. O `SKILL.md` executa; as regras
moram num lugar só.

### 4. Scripts são o caminho, não sugestão
`scripts/apex-coverage.mjs` existe porque o agente **não deve improvisar `sf` na mão** — o
script normaliza cobertura, falhas e portões num JSON estável. Se você mudar o contrato de
saída dele, atualize quem o consome na mesma mudança.

### 5. Nada de nome real
Nenhum nome de empresa, org, cliente, vendor, classe ou identificador vindo de uma org
real — em conteúdo, nomes de arquivo, mensagens de commit ou metadados de autoria do git.

### 6. Idioma
Conteúdo autoral e `README.md` em PT-BR; as skills importadas permanecem em inglês, como
vieram. Falar com o usuário em PT-BR.

## Mapa do repositório

```
.claude/
├── skills/apex-test-loop/          # skill autoral (invocável: /apex-test-loop)
│   ├── SKILL.md                    # executor do loop
│   ├── references/loop-rules.md    # FONTE ÚNICA das regras de negócio
│   ├── references/                 # guided-mode, run-state, sf-cli, blockers…
│   └── scripts/                    # apex-coverage.mjs, guard.mjs
├── skills/platform-*/              # 7 skills oficiais importadas (Apache-2.0)
├── skills/VENDOR-ATTRIBUTION.md    # origem, licença e commit pinado
├── rules/karpathy-guidelines.md    # disciplina comportamental (MIT)
└── settings.json
```

## Definição de pronto

- [ ] A mudança rastreia a um pedido explícito (nada especulativo)
- [ ] Regra de negócio nova está em `loop-rules.md`, e só lá
- [ ] Nenhuma skill importada foi modificada (o pin continua verdadeiro)
- [ ] `node --check` passa nos scripts `.mjs` alterados
- [ ] Nenhum nome real reintroduzido
- [ ] README/INFORMACOES refletem mudanças estruturais

## Licenças de terceiros

- `.claude/skills/platform-*/` — [forcedotcom/sf-skills](https://github.com/forcedotcom/sf-skills),
  Apache-2.0 — ver `.claude/skills/VENDOR-ATTRIBUTION.md` e
  `VENDOR-sf-skills-LICENSE-Apache-2.0.txt`
- `.claude/rules/karpathy-guidelines.md` — derivado de
  [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills), MIT
