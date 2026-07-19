# Atribuição — skills oficiais importadas (forcedotcom/sf-skills)

As seguintes pastas de skill em `.claude/skills/` foram **importadas na íntegra**,
sem modificação, do repositório oficial da Salesforce:

- `platform-apex-test-generate/`
- `platform-apex-test-run/`
- `platform-apex-generate/`
- `platform-apex-logs-debug/`
- `platform-data-manage/`
- `platform-custom-object-generate/`
- `platform-custom-field-generate/`

## Origem

- **Repositório:** https://github.com/forcedotcom/sf-skills
- **Licença:** Apache License 2.0 — texto completo em
  `VENDOR-sf-skills-LICENSE-Apache-2.0.txt` (nesta pasta).
- **Copyright:** © 2026 Salesforce, Inc.
- **Snapshot (pin):** commit `a0b7442d8fa0dc506606f545fbbc2b4c1d8db240`,
  release `v1.31.0`, de 2026-07-17.

## Obrigações Apache-2.0 (cumpridas)

- Mantido o texto da licença e o aviso de copyright (arquivo acima).
- **Nenhuma modificação** foi feita nessas 7 pastas — são cópia fiel do upstream.
  Qualquer melhoria nossa vive **fora** delas (na skill `apex-test-loop/`).
- O upstream não distribui arquivo `NOTICE`, então não há aviso adicional a reproduzir.

## Por que importar (pin) em vez de referenciar

O sf-skills muda entre releases ("skills may be renamed/restructured"). Importar um
snapshot fixo evita quebra por *drift* e nos dá controle de versão. Para atualizar,
troque as pastas por um snapshot mais novo e atualize o commit/versão acima.

## Como se relacionam com a nossa skill

Estas 7 são o **craft** (como escrever/rodar teste, criar dados, objetos e campos).
A nossa `apex-test-loop/` é a **orquestração**: o agent loop de cobertura (repetir até
>= 99%), as travas de segurança, o modo guiado em PT e o modo scaffold — delegando o
craft a estas skills oficiais. Veja `apex-test-loop/SKILL.md`.
