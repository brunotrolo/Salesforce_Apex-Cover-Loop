// Rodar: node --test .claude/skills/apex-test-loop/tests/guard.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, classifySelfContainment } from '../scripts/guard.mjs';

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

// --- Autocontencao da classe de teste (loop-rules.md regra 7) ---
test('query SOQL literal contra RecordType por DeveloperName pede confirmacao', () => {
  const src = `
    @isTest
    private class CardServiceTest {
      @isTest
      static void testHappyPath() {
        RecordType rt = [SELECT Id FROM RecordType WHERE DeveloperName = 'Platinum' LIMIT 1];
      }
    }
  `;
  const r = classifySelfContainment('force-app/main/default/classes/CardServiceTest.cls', src);
  assert.equal(r.blocked, true);
  assert.equal(r.decision, 'ask');
});

test('query SOQL literal contra Profile por Name pede confirmacao', () => {
  const src = `[SELECT Id FROM Profile WHERE Name = 'System Administrator']`;
  const r = classifySelfContainment('force-app/main/default/classes/CardServiceTest.cls', src);
  assert.equal(r.blocked, true);
  assert.equal(r.decision, 'ask');
});

test('describe de RecordType (sem SOQL) e permitido — caminho seguro recomendado', () => {
  const src = `
    @isTest
    private class CardServiceTest {
      @isTest
      static void testHappyPath() {
        Id rtId = Schema.SObjectType.Card__c.getRecordTypeInfosByDeveloperName().get('Platinum').getRecordTypeId();
      }
    }
  `;
  const r = classifySelfContainment('force-app/main/default/classes/CardServiceTest.cls', src);
  assert.equal(r.blocked, false);
});

test('chamada a metodo estatico de OUTRA classe de teste pede confirmacao', () => {
  const src = `
    @isTest
    private class CardServiceTest {
      @isTest
      static void testHappyPath() {
        AccountServiceTest.setupDados();
      }
    }
  `;
  const r = classifySelfContainment('force-app/main/default/classes/CardServiceTest.cls', src);
  assert.equal(r.blocked, true);
  assert.equal(r.decision, 'ask');
});

test('chamada a metodo estatico DA PROPRIA classe de teste e permitido', () => {
  const src = `
    @isTest
    private class CardServiceTest {
      @isTest
      static void testHappyPath() {
        CardServiceTest.setupDados();
      }
      static void setupDados() {}
    }
  `;
  const r = classifySelfContainment('force-app/main/default/classes/CardServiceTest.cls', src);
  assert.equal(r.blocked, false);
});

test('classe de PRODUCAO nao e avaliada por classifySelfContainment (nome nao bate com teste)', () => {
  const src = `[SELECT Id FROM Profile WHERE Name = 'System Administrator']`;
  const r = classifySelfContainment('force-app/main/default/classes/CardService.cls', src);
  assert.equal(r.blocked, false);
});
