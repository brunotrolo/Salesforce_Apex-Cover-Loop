// Rodar: node --test .claude/skills/apex-test-loop/tests/guard.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../scripts/guard.mjs';

// --- Quick deploy (NoTestRun) tem que ser escopado via --metadata, nunca --source-dir/--manifest ---
test('--source-dir com --test-level NoTestRun e negado (precisa de --metadata <Tipo>:<Nome>)', () => {
  const r = classify(
    'sf project deploy start --source-dir force-app/main/default/classes/CardService.cls --test-level NoTestRun --target-org dev'
  );
  assert.equal(r.blocked, true);
  assert.equal(r.decision, 'deny');
});

test('--source-dir force-app inteiro com NoTestRun tambem e negado', () => {
  const r = classify('sf project deploy start --source-dir force-app --test-level NoTestRun');
  assert.equal(r.blocked, true);
  assert.equal(r.decision, 'deny');
});

test('a ordem dos flags nao importa: --test-level antes de --source-dir tambem e negado', () => {
  const r = classify(
    'sf project deploy start --test-level NoTestRun --source-dir force-app/main/default/classes'
  );
  assert.equal(r.blocked, true);
  assert.equal(r.decision, 'deny');
});

test('--metadata com NoTestRun e permitido (padrao exigido pelo loop e pelo scaffold)', () => {
  const r = classify(
    'sf project deploy start --metadata ApexClass:CardServiceTest --test-level NoTestRun --target-org dev'
  );
  assert.equal(r.blocked, false);
});

test('--metadata com varios artefatos (scaffold) e NoTestRun e permitido', () => {
  const r = classify(
    'sf project deploy start --metadata CustomObject:Card__c,CustomField:Card__c.Amount__c,ApexClass:CardService,ApexClass:CardServiceTest --test-level NoTestRun'
  );
  assert.equal(r.blocked, false);
});

// --- RunLocalTests (finalizacao/scaffold "deploy real") nao e o alvo desta regra ---
test('--source-dir com --test-level RunLocalTests e permitido (nao e o quick deploy de ciclo rapido)', () => {
  const r = classify(
    'sf project deploy start --source-dir force-app --test-level RunLocalTests --target-org dev'
  );
  assert.equal(r.blocked, false);
});

test('--manifest com --test-level RunLocalTests e permitido pela mesma razao', () => {
  const r = classify(
    'sf project deploy start --manifest package.xml --test-level RunLocalTests --target-org dev'
  );
  assert.equal(r.blocked, false);
});

// --- Alias de org errado: este guard nao tem essa regra (nao existe DESTRUCTIVE_RULES para alias) ---
test('nao ha regra de alias de org neste guard.mjs — um alias qualquer nao e bloqueado por isso', () => {
  const r = classify('sf apex run test -n CardServiceTest --target-org qualquer-alias-usado');
  assert.equal(r.blocked, false);
});
