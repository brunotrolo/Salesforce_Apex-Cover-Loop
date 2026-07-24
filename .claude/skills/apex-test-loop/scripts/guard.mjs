#!/usr/bin/env node
// guard.mjs — Guarda de seguranca (hook PreToolUse) da skill apex-test-loop.
// ---------------------------------------------------------------------------
// Le o JSON da chamada de ferramenta no stdin e devolve uma decisao "deny"
// (bloqueio duro, sem aprovacao) quando a acao e destrutiva. Cobre DOIS vetores:
//
//   1) Comandos (Bash/PowerShell): apagar codigo Apex, deploy destrutivo,
//      apagar org, apagar registros em massa. Pega ate flags NO MEIO do comando
//      que regras de prefixo (permissions.deny) nao alcancam.
//   2) Escrita de arquivo (Write/Edit): sobrescrever a classe de PRODUCAO
//      (`.cls`/`.trigger` que nao e classe de teste). Este foi o vetor do bug
//      original — a classe de producao foi sobrescrita pelo tool Write, por
//      baixo das travas de Bash.
//
// E a 3a camada de protecao (alem de permissions.deny e das instrucoes do
// SKILL.md). LIMITACAO honesta: matching por texto/caminho nao e uma fronteira
// criptografica — wrappers exoticos, variaveis de ambiente ou substituicao de
// comando podem, em tese, escapar. Por isso as instrucoes do SKILL.md continuam
// essenciais.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs';

// --- Camada de COMANDOS ----------------------------------------------------
export const DESTRUCTIVE_RULES = [
  {
    re: /\bsf\b[\s\S]*\bproject\b[\s\S]*\bdelete\b/,
    why: 'sf project delete (apaga codigo-fonte Apex do disco e/ou da org)',
  },
  {
    re: /\bsf\b[\s\S]*\borg\b[\s\S]*\bdelete\b/,
    why: 'sf org delete (apaga uma org)',
  },
  {
    re: /\bsf\b[\s\S]*\bdata\b[\s\S]*\bdelete\b/,
    why: 'sf data delete (apaga registros)',
  },
  {
    re: /destructive-?changes/,
    why: 'deploy destrutivo (--pre/--post-destructive-changes) apaga metadados da org',
  },
  {
    re: /\b(rm|rmdir|rd|unlink|del|erase|remove-item|ri)\b[\s\S]*\.cls\b/,
    why: 'exclusao de arquivo .cls / .cls-meta.xml (classe Apex)',
  },
  {
    // find ... -delete que atinge codigo Apex (.cls/.trigger) OU o diretorio
    // force-app/classes. Nao tem verbo "rm", entao a regra acima nao pega.
    re: /\bfind\b(?=[\s\S]*-delete\b)(?=[\s\S]*(?:\.cls\b|\.trigger\b|force-app|[\\/]classes\b))/,
    why: 'find ... -delete sobre codigo Apex (force-app / .cls / .trigger)',
  },
  {
    // rm -rf / rmdir de um DIRETORIO de codigo-fonte (sem token .cls, a regra
    // acima nao pega): apagar force-app/ ou .../classes destroi as classes.
    re: /\b(rm|rmdir|rd|remove-item|ri)\b(?=[\s\S]*(?:force-app|[\\/]classes\b))/,
    why: 'exclusao de diretorio de codigo-fonte Apex (force-app / classes)',
  },
  {
    // mover/renomear .cls/.trigger (o NUNCA FACA proibe mover producao). mv/move
    // nao apagam, mas remontam a arvore de codigo por baixo das travas.
    re: /\b(mv|move)\b(?=[\s\S]*\.(?:cls|trigger)\b)/,
    why: 'mover/renomear classe ou trigger Apex (.cls/.trigger)',
  },
];

// Classificacao de comando: texto -> { blocked, why, decision }.
// Comando destrutivo -> 'deny' (bloqueio duro, sem aprovacao possivel).
export function classify(cmd) {
  const c = String(cmd || '').toLowerCase();
  for (const r of DESTRUCTIVE_RULES) {
    if (r.re.test(c)) return { blocked: true, why: r.why, decision: 'deny' };
  }
  return { blocked: false };
}

// --- Camada de ESCRITA DE ARQUIVO ------------------------------------------
// Bloqueia SOBRESCREVER/EDITAR a classe/trigger de PRODUCAO que JA EXISTE (foi
// o vetor do bug: a classe sob teste foi sobrescrita). Regras:
//  - arquivo de teste (nome comeca/termina com "test") ou factory  -> permitido;
//  - .cls/.trigger de producao que NAO existe ainda (arquivo NOVO) -> permitido
//    (criar um stub de dependencia faltante nunca destroi nada — habilita o modo
//     scaffold);
//  - .cls/.trigger de producao que JA EXISTE                       -> pede APROVACAO
//    (decision 'ask'): a apex-test-loop nunca edita producao, mas a skill oficial
//    platform-apex-generate pode refatorar producao com o ok do usuario. Nunca ha
//    sobrescrita SILENCIOSA (o bug original) — sempre passa por um prompt.
// `existsOverride` (opcional) permite testar sem tocar no disco.
export function classifyWrite(filePath, existsOverride) {
  const p = String(filePath || '');
  const lower = p.toLowerCase();

  const isApexClass = lower.endsWith('.cls') || lower.endsWith('.cls-meta.xml');
  const isTrigger = lower.endsWith('.trigger') || lower.endsWith('.trigger-meta.xml');
  if (!isApexClass && !isTrigger) return { blocked: false }; // metadata (.object/.field/.md) e outros: ok

  // Classe/trigger de TESTE (ou factory de teste): sempre pode criar/editar.
  const name = baseName(lower)
    .replace(/-meta\.xml$/, '')
    .replace(/\.(cls|trigger)$/, '');
  const isTestName = /^test/.test(name) || /test$/.test(name);
  const isFactory = /factory$/.test(name) || name.includes('testdata');
  if (isTestName || isFactory) return { blocked: false };

  // Producao: so bloqueia se o arquivo JA EXISTE (sobrescrita/edicao destrutiva).
  const exists = existsOverride !== undefined ? existsOverride : fileExists(p);
  if (!exists) return { blocked: false }; // arquivo novo -> criar stub/scaffold e permitido

  return {
    blocked: true,
    decision: 'ask',
    why:
      'sobrescrita/edicao da classe/trigger de PRODUCAO existente ' +
      baseName(p) +
      ' (a apex-test-loop nunca altera producao — incl. a classe sob teste). ' +
      'Editar producao e trabalho da platform-apex-generate, com sua aprovacao',
  };
}

// --- Camada de ESTADO/APRENDIZADO -------------------------------------------
// A escrita de infraestrutura de estado/aprendizado (fora da classe de teste) so pode
// cair nos 4 caminhos da allowlist FECHADA — qualquer escrita dentro de
// `.apex-test-loop/` ou apontando
// para os dois ledgers de aprendizado que NAO bater com um destes 4 padroes exatos
// e bloqueada (evita arquivo solto poluindo a raiz do projeto ou pastas soltas):
//   1) <projeto>/.apex-test-loop/state/<Classe>.md         (checkpoint vivo)
//   2) <projeto>/.apex-test-loop/state/<Classe>.log.md      (historico opcional)
//   3) .../apex-test-loop/RECOMMENDATIONS.md                (friccao da skill)
//   4) .../apex-test-loop/references/apex-test-loop-recommendations.md (padrao agnostico)
const STATE_DIR_RE = /(^|[\\/])\.apex-test-loop[\\/]/;
// Nome de classe Apex: identificador simples (letras/numeros/underscore), sem
// sufixos de "copia/versao paralela" — isso e o que barra CaseHandler-Copia.md,
// CaseHandler-backup.md, CaseHandler-2026-07-19.md etc.
const STATE_ALLOWED_RE = [
  /(^|[\\/])\.apex-test-loop[\\/]state[\\/][A-Za-z0-9_]+\.md$/,
  /(^|[\\/])\.apex-test-loop[\\/]state[\\/][A-Za-z0-9_]+\.log\.md$/,
];
const RECOMMENDATIONS_ALLOWED_RE = [
  /(^|[\\/])apex-test-loop[\\/]RECOMMENDATIONS\.md$/i,
  /(^|[\\/])apex-test-loop[\\/]references[\\/]apex-test-loop-recommendations\.md$/i,
];
// Nomes de arquivo que sugerem "mais um lugar de anotar estado/licao" fora da
// allowlist — bloqueados mesmo se caem dentro de references/ (que humanos tambem
// editam legitimamente; so barramos o padrao de nome tipico de despejo de agente).
const STRAY_STATE_NAME_RE = /(recommend|licao|licoes|lesson|notes?|log|state|historico|history)[^\\/]*\.md$/i;

export function classifyStateWrite(filePath) {
  const p = String(filePath || '');
  if (!p.toLowerCase().endsWith('.md')) return { blocked: false };

  if (STATE_DIR_RE.test(p)) {
    if (STATE_ALLOWED_RE.some((re) => re.test(p))) return { blocked: false };
    return {
      blocked: true,
      decision: 'deny',
      why:
        'escrita dentro de .apex-test-loop/ fora do padrao permitido (' +
        baseName(p) +
        '). So state/<Classe>.md e state/<Classe>.log.md sao permitidos — nada de copias, ' +
        'backups ou arquivos soltos (allowlist fechada de estado)',
    };
  }

  if (/[\\/]apex-test-loop[\\/]/.test(p) && STRAY_STATE_NAME_RE.test(baseName(p))) {
    if (RECOMMENDATIONS_ALLOWED_RE.some((re) => re.test(p))) return { blocked: false };
    return {
      blocked: true,
      decision: 'ask',
      why:
        'novo arquivo de aprendizado/estado fora dos dois ledgers permitidos (' +
        baseName(p) +
        '). Use RECOMMENDATIONS.md (friccao da skill) ou ' +
        'references/apex-test-loop-recommendations.md (padrao agnostico) — nunca crie um terceiro lugar',
    };
  }

  return { blocked: false };
}

// --- Camada de CONCLUSAO (trava estrutural do duplo portao) -----------------
// Recupera, num modelo de agente unico, o cross-check que antes era feito por um
// segundo agente: e PROIBIDO gravar `status: concluido` no checkpoint sem o campo
// `portao_2_deploy_validate: confirmado`. Sem isso, um modelo fraco poderia declarar
// pronto so pelo Portao 1 (ja aconteceu em campo — ver RECOMMENDATIONS.md R-0039).
// So se aplica ao checkpoint `state/<Classe>.md`. Decisao 'ask' (nao 'deny'): surge
// ao humano para confirmar, em vez de travar duro — recupera o cross-check perdido.
const STATE_CHECKPOINT_RE = /(^|[\\/])\.apex-test-loop[\\/]state[\\/][A-Za-z0-9_]+\.md$/;
export function classifyConclusion(filePath, content, diskOverride) {
  const p = String(filePath || '');
  if (!STATE_CHECKPOINT_RE.test(p)) return { blocked: false };

  const fragment = String(content || '');
  // So interessa quando ESTA escrita marca `status: concluido`.
  if (!/status:\s*concluido/i.test(fragment)) return { blocked: false };

  // Um Edit pode trazer so um fragmento — combine com o arquivo em disco (estado
  // anterior) para nao dar falso-positivo se o portao_2 ja foi confirmado antes.
  const disk = diskOverride !== undefined ? diskOverride : safeRead(p);
  const combined = fragment + '\n' + disk;
  if (/portao_2_deploy_validate:\s*confirmado/i.test(combined)) return { blocked: false };

  return {
    blocked: true,
    decision: 'ask',
    why:
      'checkpoint sendo marcado como `status: concluido` SEM `portao_2_deploy_validate: ' +
      'confirmado`. O Portao 2 (sf project deploy validate, check-only) e OBRIGATORIO antes ' +
      'de concluir — bater 99% no Portao 1 (apex run test) nao basta. Rode o --validate primeiro',
  };
}

// --- Camada de ARQUIVO SOLTO (allowlist de escrita) -------------------------
// Impede o loop de "sair gravando arquivo em qualquer lugar da raiz ou pastas do
// projeto". Regra positiva: ao CRIAR um arquivo NOVO, ele so pode ser (a) codigo
// Apex ou metadado (governados por classifyWrite / criados legitimamente: classe de
// teste, stub de scaffold), ou (b) um artefato de estado da allowlist
// (.apex-test-loop/state/<Classe>.md|.log.md|cov-*.json|.err) ou os 2 ledgers.
// QUALQUER OUTRO arquivo novo (notes.txt, debug.json, scratch.md na raiz, etc.) pede
// confirmacao ('ask') — nunca cria sujeira silenciosa. Editar arquivo que JA EXISTE
// nao e "sujeira nova" -> liberado (nao atrapalha trabalho fora do loop no mesmo repo).
const COV_ARTIFACT_RE =
  /(^|[\\/])\.apex-test-loop[\\/]state[\\/][A-Za-z0-9_-]+\.(json|err)$/i;
const CODE_META_EXT_RE = /\.(cls|trigger|[a-z0-9]+-meta\.xml)$/i;
export function classifyStrayFile(filePath, existsOverride) {
  const p = String(filePath || '');
  if (!p) return { blocked: false };
  const exists = existsOverride !== undefined ? existsOverride : fileExists(p);
  if (exists) return { blocked: false }; // editar existente nao e criacao de sujeira

  // Alvos legitimos que o loop cria:
  if (CODE_META_EXT_RE.test(p)) return { blocked: false }; // classe de teste / metadado de scaffold
  if (STATE_ALLOWED_RE.some((re) => re.test(p))) return { blocked: false }; // state/<Classe>.md|.log.md
  if (RECOMMENDATIONS_ALLOWED_RE.some((re) => re.test(p))) return { blocked: false }; // 2 ledgers
  if (COV_ARTIFACT_RE.test(p)) return { blocked: false }; // cov-*.json/.err da iteracao

  return {
    blocked: true,
    decision: 'ask',
    why:
      'criacao de arquivo NOVO fora da allowlist de escrita do loop (' +
      baseName(p) +
      '). O loop so cria: a classe de TESTE/factory, metadados de scaffold, e os ' +
      'artefatos de estado em .apex-test-loop/ — NADA de arquivos soltos na raiz ou ' +
      'em pastas do projeto',
  };
}

function baseName(p) {
  const parts = String(p).split(/[\\/]/);
  return parts[parts.length - 1] || String(p);
}

function safeRead(p) {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function fileExists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

// --- Mensagem e hook -------------------------------------------------------
function reasonMessage(verdict) {
  if (verdict.decision === 'ask') {
    return (
      'ATENCAO (apex-test-loop): esta acao precisa de confirmacao — ' +
      verdict.why +
      '. Na duvida, recuse: aprovar por engano pode reintroduzir um bug ' +
      '(sobrescrever producao) ou furar uma regra do loop (concluir sem o Portao 2).'
    );
  }
  return (
    'BLOQUEADO pela skill apex-test-loop: acao proibida — ' +
    verdict.why +
    '. Nunca apagar/mover/deletar classe de producao, org ou registros, nem gravar ' +
    'estado fora da allowlist. Se realmente precisa, faca manualmente, com revisao humana.'
  );
}

function runHook() {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    let ti = {};
    try {
      ti = JSON.parse(raw || '{}').tool_input || {};
    } catch {
      process.exit(0); // nao conseguiu parsear -> nao bloqueia
    }

    let verdict = { blocked: false };
    if (ti.command !== undefined) {
      verdict = classify(ti.command);
    } else if (ti.file_path !== undefined) {
      verdict = classifyWrite(ti.file_path);
      if (!verdict.blocked) verdict = classifyStateWrite(ti.file_path);
      // Write traz o conteudo em `content`; Edit, em `new_string`.
      if (!verdict.blocked)
        verdict = classifyConclusion(ti.file_path, ti.content ?? ti.new_string);
      if (!verdict.blocked) verdict = classifyStrayFile(ti.file_path);
    } else {
      // fallback: varre o JSON inteiro por padrao de comando destrutivo
      verdict = classify(JSON.stringify(ti));
    }

    if (verdict.blocked) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: verdict.decision || 'deny',
            permissionDecisionReason: reasonMessage(verdict),
          },
        })
      );
    }
    process.exit(0);
  });
}

// So roda o hook (le stdin) quando executado diretamente pelo Claude Code.
// Quando importado (em testes), apenas as funcoes acima ficam disponiveis.
import { fileURLToPath } from 'node:url';
const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) runHook();
