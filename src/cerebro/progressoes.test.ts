import { expect, test } from 'vitest';
import { PROGRESSOES, progressoesDoModo } from './progressoes';
import { acordesDoTom } from './tons';

test('5 progressões no maior e 4 no menor, começando por Pop e Triste', () => {
  expect(progressoesDoModo('maior').map((p) => p.id)).toEqual(['pop', 'anos50', 'classica', 'twofive', 'soulful']);
  expect(progressoesDoModo('menor').map((p) => p.id)).toEqual(['triste', 'sombria', 'hipnotica', 'skinny']);
});

test('todos os graus existem no tom do modo', () => {
  for (const p of PROGRESSOES) {
    const ids = acordesDoTom({ tonica: p.modo === 'maior' ? 'C' : 'A', modo: p.modo }).map((a) => a.id);
    for (const grau of p.graus) expect(ids).toContain(grau);
  }
});
