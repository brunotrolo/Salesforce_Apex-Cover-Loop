#!/usr/bin/env node
// apex-coverage.mjs
// ---------------------------------------------------------------------------
// Sinal DETERMINISTICO do loop apex-test-loop: roda o(s) comando(s) `sf` certo(s),
// parseia o JSON gigante e imprime um resumo compacto (coveredPercent, linhas nao
// cobertas, falhas, portoes). O agente NUNCA deve improvisar `sf` na mao — este
// script existe justamente para evitar isso (flags alucinadas, JSON parseado errado).
//
// MODO RECOMENDADO — `--gate` (um comando so, o padrao do loop):
//   node apex-coverage.mjs --class MinhaClasse --test MinhaClasseTest --gate [--org alias] [--extra ...]
//   Faz, em sequencia: deploy da classe de TESTE -> roda o teste (Portao 1) -> e, SO
//   se o Portao 1 passar (>=99%, sem falhas, sem testes lentos), roda automaticamente
//   o `deploy validate` (Portao 2, check-only). Emite um veredito unico:
//     { phase:"gate", verdict:"continuar"|"concluido"|"bloqueado", portao1:{...}, portao2:{...} }
//   Assim o modelo nao tem como pular o Portao 2 nem orquestrar `sf` na mao.
//
// MODOS GRANULARES (avancado / depuracao):
//   --test-only  deploya SOMENTE a classe de teste + roda o teste (Portao 1 cru).
//   --deploy     deploya producao + teste (so se a producao for nova/alterada).
//   --validate   so o Portao 2 (deploy validate check-only), sem deploy/teste antes.
//   (sem flag de modo: nao deploya — so mede o que JA esta na org.)
//   --slow-ms N  limiar (ms) para sinalizar metodos LENTOS/FRAGEIS em "slowTests" (8000).
//
// IMPORTANTE (constraint do Salesforce): testes Apex SEMPRE rodam na ORG. Para a org
// executar um teste NOVO/ALTERADO, o codigo do teste PRECISA ser deployado antes.
// Requisitos: sf CLI instalado e autenticado; Node 18+.
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process';

function arg(name, def = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

const className = arg('class');
const testName = arg('test') || (className ? `${className}Test` : undefined);
const org = arg('org');
const gate = !!arg('gate', false); // um-comando-so: deploy -> teste -> (validate se P1)
const doDeploy = !!arg('deploy', false); // deploy classe de producao + teste
const testOnly = !!arg('test-only', false); // deploy SOMENTE a classe de teste
const doValidate = !!arg('validate', false); // so o Portao 2
const extra = arg('extra'); // "ApexClass:Foo,ApexClass:Bar"
// Limiar (ms de wall-clock) acima do qual um metodo de teste e sinalizado como
// LENTO/FRAGIL. Nao e CPU exato, mas e o melhor proxy deterministico: metodos lentos
// costumam "raspar" o limite de CPU e falhar INTERMITENTEMENTE conforme a carga da org.
const slowMs = Number(arg('slow-ms', 8000)) || 8000;
const willDeploy = doDeploy || testOnly;

const orgArgs = org ? ['--target-org', org] : [];
const extraMeta =
  typeof extra === 'string' ? extra.split(',').map((m) => m.trim()).filter(Boolean) : [];

// No Windows o sf e um .cmd, e o Node moderno exige shell para executa-lo.
const IS_WINDOWS = process.platform === 'win32';

function runSf(args) {
  const res = spawnSync('sf', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: IS_WINDOWS,
  });
  if (res.error && res.error.code === 'ENOENT') {
    emit(
      {
        phase: 'preflight',
        error:
          'Salesforce CLI (sf) nao encontrado no PATH. Instale: ' +
          'https://developer.salesforce.com/tools/salesforcecli e autentique com "sf org login web".',
      },
      1
    );
  }
  return res;
}

function parseJsonLoose(stdout) {
  if (!stdout) return null;
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return null;
  }
}

function emit(obj, exitCode) {
  console.log(JSON.stringify(obj, null, 2));
  process.exit(exitCode);
}

// ===========================================================================
// PARSERS PUROS (compartilhados por todos os modos — uma fonte de verdade)
// ===========================================================================

// Cobertura da classe alvo a partir da estrutura estilo `apex run test`
// (covList = result.coverage.coverage[] com item.lines { "3":1, "7":0 }).
export function extractClassCoverage(covListRaw, targetClass) {
  const covList = Array.isArray(covListRaw?.coverage)
    ? covListRaw.coverage
    : Array.isArray(covListRaw)
      ? covListRaw
      : [];
  const entry = covList.find((c) => (c.name || c.Name) === targetClass);
  const other = covList
    .filter((c) => (c.name || c.Name) !== targetClass)
    .map((c) => ({ name: c.name || c.Name, coveredPercent: c.coveredPercent }));
  if (!entry) {
    return {
      coverageFound: false,
      coveredPercent: null,
      uncoveredLines: [],
      totalLines: null,
      coveredLines: null,
      otherClassesTouched: other,
      available: covList.map((c) => c.name || c.Name),
    };
  }
  const lines = entry.lines || {};
  const nums = Object.keys(lines);
  const uncoveredLines = nums
    .filter((n) => Number(lines[n]) === 0)
    .map(Number)
    .sort((a, b) => a - b);
  const totalLines = entry.totalLines ?? nums.length;
  const coveredLines = entry.totalCovered ?? nums.length - uncoveredLines.length;
  const coveredPercent =
    entry.coveredPercent ?? (totalLines ? Math.round((coveredLines / totalLines) * 100) : null);
  return {
    coverageFound: true,
    coveredPercent,
    uncoveredLines,
    totalLines,
    coveredLines,
    otherClassesTouched: other,
    available: null,
  };
}

export function extractTestFailures(tests, testName) {
  return (tests || [])
    .filter((x) => (x.Outcome || x.outcome) !== 'Pass')
    .map((x) => ({
      method: `${x.ApexClass?.Name || x.apexClass?.name || testName}.${x.MethodName || x.methodName}`,
      message: x.Message || x.message,
      stackTrace: x.StackTrace || x.stackTrace,
    }));
}

export function extractSlowTests(tests, testName, limitMs) {
  return (tests || [])
    .map((x) => ({
      method: `${x.ApexClass?.Name || x.apexClass?.name || testName}.${x.MethodName || x.methodName}`,
      runtimeMs: Number(x.RunTime ?? x.runTime ?? x.runtime ?? 0),
    }))
    .filter((x) => Number.isFinite(x.runtimeMs) && x.runtimeMs >= limitMs)
    .sort((a, b) => b.runtimeMs - a.runtimeMs);
}

// Cobertura do `deploy validate --json`: tenta a estrutura da Metadata API e, se
// nao casar, a estrutura estilo `apex run test`. Se nenhuma casar -> coverageUnreadable.
export function extractValidateCoverage(result, targetClass) {
  const rtr = result?.details?.runTestResult || result?.runTestResult || {};
  let coveredPercent = null;
  let uncoveredLines = [];

  // (a) Metadata API: codeCoverage[] com numLocations / locationsNotCovered[].line
  const covA = Array.isArray(rtr.codeCoverage)
    ? rtr.codeCoverage
    : rtr.codeCoverage
      ? [rtr.codeCoverage]
      : [];
  const entryA = covA.find((c) => (c.name || c.Name) === targetClass);
  if (entryA && entryA.numLocations != null) {
    const total = Number(entryA.numLocations ?? 0);
    const notCovered = Number(entryA.numLocationsNotCovered ?? 0);
    coveredPercent = total ? Math.round(((total - notCovered) / total) * 100) : null;
    const locs = entryA.locationsNotCovered || [];
    uncoveredLines = (Array.isArray(locs) ? locs : [locs])
      .map((l) => Number(l?.line ?? l))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  }

  // (b) fallback: estrutura estilo `apex run test` (mapa de linhas)
  if (coveredPercent == null) {
    const covBraw =
      result?.coverage?.coverage || result?.details?.coverage?.coverage || result?.coverage || [];
    const cov = extractClassCoverage(covBraw, targetClass);
    if (cov.coverageFound) {
      coveredPercent = cov.coveredPercent;
      uncoveredLines = cov.uncoveredLines;
    }
  }

  const rtFailures = Array.isArray(rtr.failures) ? rtr.failures : rtr.failures ? [rtr.failures] : [];
  const failures = rtFailures.map((f) => ({
    method: `${f.name || ''}.${f.methodName || ''}`,
    message: f.message,
    stackTrace: f.stackTrace,
  }));

  return {
    coveredPercent,
    uncoveredLines,
    coverageUnreadable: coveredPercent == null,
    failures,
    testsRan: Number(rtr.numTestsRun ?? 0) || undefined,
  };
}

// Falha de deploy -> { failures[], blockedByDependency, hint }
function parseDeployFailure(dj, tName) {
  const result = dj?.result || {};
  let failures = [];
  for (const f of result.files || []) {
    if ((f.state || '').toLowerCase() === 'failed' || f.error) {
      failures.push({
        file: f.fullName || f.filePath,
        line: f.lineNumber,
        column: f.columnNumber,
        problem: f.error || f.problemType,
      });
    }
  }
  if (!failures.length) {
    const cf = result.details?.componentFailures || result.componentFailures || [];
    for (const f of Array.isArray(cf) ? cf : [cf]) {
      if (f && f.problem) {
        failures.push({ file: f.fullName || f.fileName, line: f.lineNumber, problem: f.problem });
      }
    }
  }
  const testFile = tName.toLowerCase();
  const testCaused = failures.some((f) => String(f.file || '').toLowerCase().includes(testFile));
  const prodOrDepCaused = failures.some(
    (f) => !String(f.file || '').toLowerCase().includes(testFile)
  );
  const blockedByDependency = prodOrDepCaused && !testCaused;
  return {
    failures: failures.length ? failures : [{ problem: dj?.message || 'Deploy falhou. Veja "raw".' }],
    blockedByDependency,
    hint: blockedByDependency
      ? 'A falha NAO e da classe de teste, e de uma dependencia (objeto __c, Custom ' +
        'Metadata __mdt, ou outra classe) ausente. NUNCA recrie/apague/sobrescreva a ' +
        'CLASSE SOB TESTE. Uso real: ofereca (a) rodar so o teste se a producao ja estiver ' +
        'na org; (b) "sf project retrieve start"; (c) apontar a org certa. Dev/treino sem a ' +
        'org: com --scaffold, crie o MINIMO das dependencias como arquivos NOVOS — veja ' +
        'references/scaffolding-dependencies.md.'
      : 'Erro provavelmente na classe de TESTE — ajuste o teste e rode de novo.',
  };
}

// ===========================================================================
// RUNNERS (executam o `sf` e devolvem struct parseada)
// ===========================================================================

// Deploy. includeProduction=false -> SOMENTE a classe de teste (padrao seguro).
// Para o deploy so-da-classe-de-teste, --ignore-conflicts e seguro (arquivo que o
// proprio loop controla) e evita o erro de source-tracking visto em campo. NUNCA com
// a producao no payload.
function runDeploy(includeProduction) {
  const meta = includeProduction
    ? [`ApexClass:${className}`, `ApexClass:${testName}`]
    : [`ApexClass:${testName}`];
  meta.push(...extraMeta);
  const dArgs = ['project', 'deploy', 'start'];
  for (const m of meta) dArgs.push('--metadata', m);
  dArgs.push('--test-level', 'NoTestRun', '--json', ...orgArgs);
  if (!includeProduction) dArgs.push('--ignore-conflicts');

  const d = runSf(dArgs);
  const dj = parseJsonLoose(d.stdout || '');
  const ok = d.status === 0 && dj && dj.status === 0;
  if (ok) return { ok: true };
  return {
    ok: false,
    ...parseDeployFailure(dj, testName),
    raw: (d.stdout || d.stderr || '').slice(0, 4000),
  };
}

// Roda o teste com cobertura (Portao 1).
function runTests() {
  const tArgs = [
    'apex', 'run', 'test',
    '--class-names', testName,
    '--code-coverage',
    '--result-format', 'json',
    '--synchronous',
    '--wait', '10',
    ...orgArgs,
  ];
  const t = runSf(tArgs);
  const tj = parseJsonLoose(t.stdout || '');
  if (!tj || !tj.result) {
    return { hasResult: false, raw: (t.stdout || t.stderr || '').slice(0, 4000) };
  }
  const r = tj.result;
  const summary = r.summary || {};
  const tests = r.tests || [];
  const cov = extractClassCoverage(r.coverage, className);
  return {
    hasResult: true,
    summary,
    failures: extractTestFailures(tests, testName),
    slowTests: extractSlowTests(tests, testName, slowMs),
    ...cov,
    testsRan: summary.testsRan ?? tests.length,
    passing: summary.passing,
    failing: summary.failing,
  };
}

// Roda o Portao 2 (deploy validate check-only).
// IMPORTANTE (bug corrigido em campo): valida SOMENTE a classe de TESTE, nao a de
// producao. A producao ja esta na org e, no fluxo do loop, NAO tem source local — incluir
// `ApexClass:<producao>` fazia o `deploy validate` quebrar com "No source-backed components
// present in the package". A cobertura da producao E calculada mesmo assim, porque
// `--test-level RunSpecifiedTests` roda o teste, que exercita a producao. Se voce precisar
// validar uma producao NOVA/alterada, faca um deploy validate separado com o source dela.
function runValidate() {
  const meta = [`ApexClass:${testName}`, ...extraMeta];
  const vArgs = ['project', 'deploy', 'validate'];
  for (const m of meta) vArgs.push('--metadata', m);
  vArgs.push(
    '--test-level', 'RunSpecifiedTests',
    '--tests', testName,
    '--coverage-formatters', 'json',
    '--json',
    ...orgArgs
  );
  const v = runSf(vArgs);
  const vj = parseJsonLoose(v.stdout || '');
  const result = vj?.result || {};
  const deployWouldSucceed = v.status === 0 && vj && vj.status === 0;
  const cov = extractValidateCoverage(result, className);
  return {
    deployWouldSucceed,
    ...cov,
    validateError: deployWouldSucceed
      ? undefined
      : vj?.message || result.errorMessage || 'Validacao de deploy falhou. Veja "raw".',
    raw:
      !deployWouldSucceed || cov.coverageUnreadable
        ? (v.stdout || v.stderr || '').slice(0, 4000)
        : undefined,
  };
}

// ===========================================================================
// MODOS (rodam so quando o script e chamado direto — nao ao importar p/ teste)
// ===========================================================================
function main() {
  if (!className || !testName) {
    console.error(
      'Uso: node apex-coverage.mjs --class <ApexClass> [--test <TestClass>] [--org <alias>]\n' +
        '  --gate       RECOMENDADO: deploy -> teste (Portao 1) -> validate (Portao 2 se P1 passar).\n' +
        '  --test-only  deploy SOMENTE a classe de teste + roda o teste.\n' +
        '  --deploy     deploy producao + teste (so se a producao e nova/alterada).\n' +
        '  --validate   so o Portao 2 (deploy validate check-only).'
    );
    process.exit(2);
  }

// --- MODO --gate (RECOMENDADO): deploy -> teste -> (validate se Portao 1) ----
if (gate) {
  const dep = runDeploy(false);
  if (!dep.ok) {
    emit(
      {
        phase: 'gate',
        verdict: dep.blockedByDependency ? 'bloqueado' : 'continuar',
        deploy: { succeeded: false, deployErrors: dep.failures, blockedByDependency: dep.blockedByDependency },
        reason: dep.hint,
        raw: dep.raw,
      },
      1
    );
  }

  const test = runTests();
  if (!test.hasResult) {
    emit(
      {
        phase: 'gate',
        verdict: 'continuar',
        reason: 'Nao foi possivel ler o resultado do teste a partir da saida do sf.',
        raw: test.raw,
      },
      1
    );
  }

  const p1pass =
    test.coverageFound &&
    (test.coveredPercent ?? 0) >= 99 &&
    test.failures.length === 0 &&
    test.slowTests.length === 0;

  const portao1 = {
    passed: p1pass,
    coveredPercent: test.coveredPercent,
    uncoveredLines: test.uncoveredLines,
    failures: test.failures,
    slowTests: test.slowTests.length ? test.slowTests : undefined,
    coverageFound: test.coverageFound,
    availableCoverage: test.coverageFound ? undefined : test.available,
    otherClassesTouched: test.otherClassesTouched.length ? test.otherClassesTouched : undefined,
  };

  if (!p1pass) {
    // Portao 1 nao passou -> continuar; NAO roda o Portao 2 (caro) ainda.
    let reason;
    if (!test.coverageFound) reason = 'A classe alvo nao apareceu na cobertura — confira o nome exato.';
    else if (test.failures.length) reason = `${test.failures.length} teste(s) falhando — corrija antes de seguir.`;
    else if (test.slowTests.length) reason = 'Ha teste(s) lento(s) (>=8s) — divida com startTest/stopTest antes de concluir.';
    else reason = `Cobertura ${test.coveredPercent}% < 99% — cubra as uncoveredLines restantes.`;
    emit({ phase: 'gate', verdict: 'continuar', portao1, portao2: null, reason }, 1);
  }

  // Portao 1 passou -> roda o Portao 2 AUTOMATICAMENTE (uma vez).
  const val = runValidate();
  const p2pass =
    val.deployWouldSucceed &&
    val.failures.length === 0 &&
    ((val.coveredPercent ?? 0) >= 99 || val.coverageUnreadable);

  const portao2 = {
    ran: true,
    deployWouldSucceed: val.deployWouldSucceed,
    coveredPercent: val.coveredPercent,
    coverageUnreadable: val.coverageUnreadable || undefined,
    failures: val.failures.length ? val.failures : undefined,
    validateError: val.validateError,
    raw: val.raw,
  };

  if (p2pass) {
    emit(
      {
        phase: 'gate',
        verdict: 'concluido',
        portao1,
        portao2,
        reason: val.coverageUnreadable
          ? 'Portao 1 >=99% e Portao 2 confirmou deployabilidade (cobertura do validate ilegivel — usei o Portao 1).'
          : 'Ambos os portoes confirmados: >=99% e deployWouldSucceed=true.',
      },
      0
    );
  }
  emit(
    {
      phase: 'gate',
      // deployWouldSucceed=false pode ser limitacao de ambiente (cobertura agregada da
      // org, dependencia) -> pode ser 'bloqueado' (decisao humana). O agente decide via
      // loop-rules; aqui devolvemos 'continuar' com o motivo real a vista.
      verdict: 'continuar',
      portao1,
      portao2,
      reason:
        val.validateError ||
        `Portao 2 nao confirmou (deployWouldSucceed=${val.deployWouldSucceed}, coveredPercent=${val.coveredPercent}).`,
    },
    1
  );
}

// --- MODO --validate: so o Portao 2 ----------------------------------------
if (doValidate) {
  const val = runValidate();
  emit(
    {
      phase: 'validate',
      deployWouldSucceed: val.deployWouldSucceed,
      class: className,
      coveredPercent: val.coveredPercent,
      coverageUnreadable: val.coverageUnreadable || undefined,
      uncoveredLines: val.uncoveredLines,
      testsRan: val.testsRan,
      failing: val.failures.length,
      failures: val.failures,
      validateError: val.validateError,
      hint:
        val.deployWouldSucceed && val.coverageUnreadable
          ? 'deploy validate PASSOU, mas a cobertura nao pode ser lida do JSON nesta versao do ' +
            'sf. NAO conclua as cegas: use o coveredPercent do Portao 1 (apex run test) para o >=99%.'
          : undefined,
      raw: val.raw,
    },
    val.deployWouldSucceed && val.failures.length === 0 && (val.coveredPercent ?? 0) >= 99 ? 0 : 1
  );
}

// --- MODO deploy+teste (--test-only / --deploy) ou so-medir -----------------
if (willDeploy) {
  const dep = runDeploy(doDeploy); // doDeploy=true inclui producao
  if (!dep.ok) {
    emit(
      {
        phase: 'deploy',
        deploySucceeded: false,
        deployErrors: dep.failures,
        blockedByDependency: dep.blockedByDependency,
        hint: dep.hint,
        raw: dep.raw,
      },
      1
    );
  }
}

const test = runTests();
if (!test.hasResult) {
  emit(
    {
      phase: 'test',
      error: 'Nao foi possivel ler o resultado do teste a partir da saida do sf.',
      raw: test.raw,
    },
    1
  );
}

emit(
  {
    phase: 'test',
    deploySucceeded: willDeploy ? true : undefined,
    testOutcome: test.summary.outcome || (test.failures.length ? 'Failed' : 'Passed'),
    testsRan: test.testsRan,
    passing: test.passing,
    failing: test.failing ?? test.failures.length,
    failures: test.failures,
    slowTests: test.slowTests.length ? test.slowTests : undefined,
    slowMs: test.slowTests.length ? slowMs : undefined,
    class: className,
    coverageFound: test.coverageFound,
    coveredPercent: test.coveredPercent,
    totalLines: test.totalLines,
    coveredLines: test.coveredLines,
    uncoveredLines: test.uncoveredLines,
    availableCoverage: test.coverageFound ? undefined : test.available,
    otherClassesTouched: test.otherClassesTouched.length ? test.otherClassesTouched : undefined,
  },
  test.failures.length || !test.coverageFound ? 1 : 0
);
}

// So roda a CLI quando executado diretamente pelo agente; ao importar (testes),
// apenas as funcoes puras exportadas ficam disponiveis.
import { fileURLToPath } from 'node:url';
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) main();
