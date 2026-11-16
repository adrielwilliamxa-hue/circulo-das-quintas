import { describe, expect, test } from 'vitest';
import { classificar, fraseDaTecla, nomeNaTonalidade } from './classificacao';
import { acordesDoTom } from './tons';
import type { AcordeDoTom, Formato, Tom } from './tipos';

const PREFIXO = { acorde: '', tensao: 'T', passagem: 'P', fora: 'X' } as const;

/** Fórmula no formato das notas do vault: "1 – T9 – 3 – P4 – 5 – 6 – 7". */
function formula(acorde: AcordeDoTom, tom: Tom, formato: Formato = 'tetrade'): string {
  return acorde.escala.notas
    .map((nota) => {
      const { marca, rotulo } = classificar(nota, acorde, tom, formato);
      return PREFIXO[marca] + rotulo;
    })
    .join(' ');
}

const GABARITO_MAIOR = [
  '1 T9 3 P4 5 6 7',
  '1 T9 ♭3 T11 5 P6 ♭7',
  '1 P♭2 ♭3 T11 5 P♭6 ♭7',
  '1 T9 3 T#11 5 6 7',
  '1 T9 3 P4 5 T13 ♭7',
  '1 T9 ♭3 T11 5 P♭6 ♭7',
  '1 P♭2 ♭3 T11 ♭5 T♭13 ♭7',
];

describe('gabarito das escalas de acorde (notas do vault)', () => {
  for (const tonica of ['C', 'Eb', 'F#']) {
    test(`tom maior de ${tonica}`, () => {
      const tom: Tom = { tonica, modo: 'maior' };
      expect(acordesDoTom(tom).map((a) => formula(a, tom))).toEqual(GABARITO_MAIOR);
    });
  }

  test('Lá menor: campo natural, IVm7 com T13 e V7 com T♭9, P4 e T♭13', () => {
    const tom: Tom = { tonica: 'A', modo: 'menor' };
    expect(acordesDoTom(tom).map((a) => formula(a, tom))).toEqual([
      '1 T9 ♭3 T11 5 P♭6 ♭7',
      '1 P♭2 ♭3 T11 ♭5 T♭13 ♭7',
      '1 T9 3 P4 5 6 7',
      '1 T9 ♭3 T11 5 T13 ♭7',
      '1 P♭2 ♭3 T11 5 P♭6 ♭7',
      '1 T9 3 T#11 5 6 7',
      '1 T9 3 P4 5 T13 ♭7',
      '1 T♭9 3 P4 5 T♭13 ♭7',
    ]);
  });

  test('♭13 sobre o E7 de Lá menor é tensão aceita no acorde de voltar', () => {
    const tom: Tom = { tonica: 'A', modo: 'menor' };
    const e7 = acordesDoTom(tom).find((a) => a.id === 'V7')!;
    expect(fraseDaTecla('C', e7, tom, 'tetrade')).toBe(
      'C sobre E7: nota de tensão (♭13) — fica meio tom acima do B, a 5ª do E7, mas nos acordes de voltar essa tensão é aceita e aumenta a vontade de resolver.',
    );
  });

  test('G natural sobre o E7 de Lá menor fica fora', () => {
    const tom: Tom = { tonica: 'A', modo: 'menor' };
    const e7 = acordesDoTom(tom).find((a) => a.id === 'V7')!;
    expect(classificar('G', e7, tom, 'tetrade').marca).toBe('fora');
  });

  test('em tríade, a 7ª e o 6 do 7M viram tensão; o resto não muda', () => {
    const tom: Tom = { tonica: 'C', modo: 'maior' };
    const [i, ii, , , v] = acordesDoTom(tom);
    expect(formula(i, tom, 'triade')).toBe('1 T9 3 P4 5 T6 T7');
    expect(formula(ii, tom, 'triade')).toBe('1 T9 ♭3 T11 5 P6 T♭7');
    expect(formula(v, tom, 'triade')).toBe('1 T9 3 P4 5 T13 T♭7');
  });
});

describe('frase da tecla', () => {
  const tom: Tom = { tonica: 'C', modo: 'maior' };
  const acordes = acordesDoTom(tom);
  const g = acordes[4];

  test('nota de passagem sobre G (frase do design)', () => {
    expect(fraseDaTecla('C', g, tom, 'triade')).toBe('C sobre G: nota de passagem — fica meio tom acima do B, a 3ª do G');
  });

  test('nota do acorde, tensão e fora do tom', () => {
    expect(fraseDaTecla('B', g, tom, 'triade')).toBe('B sobre G: nota do acorde (a 3ª) — pode parar e segurar.');
    expect(fraseDaTecla('A', g, tom, 'triade')).toBe(
      'A sobre G: nota de tensão (9) — fica 1 tom acima do G, a fundamental do G; colore o acorde, melhor em tempo fraco.',
    );
    expect(fraseDaTecla('C#', g, tom, 'triade')).toBe('C♯ sobre G: fora do tom — evite por enquanto.');
  });

  test('a 6ª do ii no tom maior explica a sensível', () => {
    expect(fraseDaTecla('B', acordes[1], tom, 'triade')).toContain('sensível');
  });
});

describe('nome da nota na tonalidade', () => {
  test('usa a grafia do tom e, fora dele, o acidente da armadura', () => {
    expect(nomeNaTonalidade(61, { tonica: 'C', modo: 'maior' })).toBe('C#');
    expect(nomeNaTonalidade(61, { tonica: 'Eb', modo: 'maior' })).toBe('Db');
    expect(nomeNaTonalidade(63, { tonica: 'Eb', modo: 'maior' })).toBe('Eb');
    expect(nomeNaTonalidade(68, { tonica: 'A', modo: 'menor' })).toBe('G#');
    expect(nomeNaTonalidade(65, { tonica: 'F#', modo: 'maior' })).toBe('E#');
  });
});
