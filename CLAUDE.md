# CLAUDE.md

**As regras deste repositório estão em [`AGENTS.md`](AGENTS.md). Leia-o antes de qualquer
mudança.** Fonte única, vendor-neutral — este arquivo não as duplica, para não divergir.

O essencial, em três linhas:

1. Este repositório **é uma skill**, não um projeto Salesforce. Você escreve instruções que
   um agente executa **sozinho, em loop, contra uma org real**.
2. `references/loop-rules.md` é a **fonte única** das regras de negócio do loop. Regra nova
   vai para lá — nunca para o `SKILL.md`, nunca duplicada numa reference.
3. Preservar produção, deployar apenas teste. E lembrar que cobertura é critério forte de
   execução e **fraco de qualidade**: um teste sem asserts bate 99% e não prova nada.

## Específico do Claude Code

- **Skill invocável:** `.claude/skills/apex-test-loop/SKILL.md` está um nível abaixo de
  `skills/`, então vira o comando `/apex-test-loop`. Frontmatter usa `name` e `description`
  — se um dia precisar restringir ferramentas, o campo é `allowed-tools` (skills), **não**
  `tools:` (esse é o campo de subagentes, e trocá-los é ignorado em silêncio).
- **As 7 `platform-*` também são invocáveis**, e isso é de propósito: a `apex-test-loop`
  delega o craft a elas e redireciona para elas quando o pedido é um teste avulso. Não
  aninhe mais fundo para "limpar o menu".
- **Importadas sem modificação:** `.claude/skills/VENDOR-ATTRIBUTION.md` pina commit e
  release do snapshot. Editar uma skill importada quebra essa promessa — a correção vai
  para o upstream.
- **`.claude/rules/karpathy-guidelines.md`** não tem `paths:`, então carrega sempre.
- **Scripts:** `scripts/apex-coverage.mjs` existe para o agente não improvisar `sf` na mão.
  Mudou o contrato de saída dele, atualize quem consome na mesma mudança.
