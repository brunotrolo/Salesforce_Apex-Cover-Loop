import { test } from 'node:test';
import assert from 'node:assert/strict';
import politica from '../scripts/politicas/sf-apex-cover-loop.mjs';

test('política do Odin: comando destrutivo é negado e leitura passa', () => {
  assert.equal(politica({ tool_name: 'Bash', tool_input: { command: 'sf org delete scratch -o x' } })?.decisao, 'negar');
  assert.equal(politica({ tool_name: 'Bash', tool_input: { command: 'git status' } }), null);
});
test('política do Odin: apagar ou sobrescrever classe de produção não passa em silêncio', () => {
  const r = politica({ tool_name: 'Bash', tool_input: { command: 'rm force-app/main/default/classes/CaseService.cls' } });
  assert.ok(r && ['negar', 'perguntar'].includes(r.decisao), 'rm de classe de produção precisa de decisão');
});
test('política do Odin: entrada sem comando nem arquivo é varrida; entrada vazia não quebra', () => {
  assert.equal(politica({ tool_name: 'Grep', tool_input: { pattern: 'foo' } }), null); assert.equal(politica(undefined), null);
});
