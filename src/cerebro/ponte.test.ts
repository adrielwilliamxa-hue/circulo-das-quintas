import { describe, expect, test } from 'vitest';
import { escalaDaPonte, ponteDe } from './ponte';
import { acordesDoTom } from './tons';
import type { Tom } from './tipos';

const doMaior: Tom = { tonica: 'C', modo: 'maior' };
const laMenor: Tom = { tonica: 'A', modo: 'menor' };
const acordesDo = acordesDoTom(doMaior);

test('G em Dó é preparado pelo D7 (Mixolídia)', () => {
  const ponte = ponteDe(acordesDo[4], doMaior)!;
  expect(ponte.simbolo).toBe('D7');
  expect(ponte.notas).toEqual(['D', 'F#', 'A', 'C']);
  expect(ponte.escala).toBe('Mixolídia');
  expect(ponte.primario).toBe(false);
  expect(ponte.texto).toBe('A 3ª do D7 (F♯) fica meio tom abaixo do G e sobe até ele; a 7ª (C) desce até o B.');
});

test('o I é preparado pelo dominante primário G7', () => {
  const ponte = ponteDe(acordesDo[0], doMaior)!;
  expect(ponte.simbolo).toBe('G7');
  expect(ponte.primario).toBe(true);
});

test('o E7 que prepara Am (i de Lá menor, vi de Dó) usa a Mixo ♭9 ♭13', () => {
  expect(ponteDe(acordesDoTom(laMenor)[0], laMenor)).toMatchObject({ simbolo: 'E7', escala: 'Mixo ♭9 ♭13', primario: true });
  expect(ponteDe(acordesDo[5], doMaior)).toMatchObject({ simbolo: 'E7', escala: 'Mixo ♭9 ♭13' });
});

test('IV de E♭ é preparado pelo E♭7', () => {
  const tom: Tom = { tonica: 'Eb', modo: 'maior' };
  expect(ponteDe(acordesDoTom(tom)[3], tom)!.notas).toEqual(['Eb', 'G', 'Bb', 'Db']);
});

describe('escala da ponte pela regra da Berklee: notas do acorde + notas do tom', () => {
  const escalaPara = (tom: Tom, grau: string) => {
    const ponte = ponteDe(acordesDoTom(tom).find((a) => a.id === grau)!, tom)!;
    return { nome: ponte.escala, notas: escalaDaPonte(ponte) };
  };

  test('A7 → Dm em Dó maior: o B é do tom, então a 9ª é natural (Mixo ♭13)', () => {
    expect(escalaPara(doMaior, 'ii')).toEqual({ nome: 'Mixo ♭13', notas: ['A', 'B', 'C#', 'D', 'E', 'F', 'G'] });
  });

  test('A7 → Dm em Lá menor: Mixo ♭13', () => {
    expect(escalaPara(laMenor, 'iv')).toEqual({ nome: 'Mixo ♭13', notas: ['A', 'B', 'C#', 'D', 'E', 'F', 'G'] });
  });

  test('B7 → E7 em Lá menor: C e G são do tom (Mixo ♭9 ♭13)', () => {
    expect(escalaPara(laMenor, 'V7')).toEqual({ nome: 'Mixo ♭9 ♭13', notas: ['B', 'C', 'D#', 'E', 'F#', 'G', 'A'] });
  });

  test('C7 → Fm em Mi♭ maior: Mixo ♭13, escrita com bemóis', () => {
    expect(escalaPara({ tonica: 'Eb', modo: 'maior' }, 'ii')).toEqual({ nome: 'Mixo ♭13', notas: ['C', 'D', 'E', 'F', 'G', 'Ab', 'Bb'] });
  });

  test('onde as duas regras concordam, nada muda', () => {
    expect(escalaPara(doMaior, 'I')).toEqual({ nome: 'Mixolídia', notas: ['G', 'A', 'B', 'C', 'D', 'E', 'F'] });
    expect(escalaPara(doMaior, 'iii')).toEqual({ nome: 'Mixo ♭9 ♭13', notas: ['B', 'C', 'D#', 'E', 'F#', 'G', 'A'] });
    expect(escalaPara(doMaior, 'IV')).toEqual({ nome: 'Mixolídia', notas: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'] });
    expect(escalaPara(doMaior, 'V')).toEqual({ nome: 'Mixolídia', notas: ['D', 'E', 'F#', 'G', 'A', 'B', 'C'] });
    expect(escalaPara(doMaior, 'vi')).toEqual({ nome: 'Mixo ♭9 ♭13', notas: ['E', 'F', 'G#', 'A', 'B', 'C', 'D'] });
    expect(escalaPara(laMenor, 'i')).toEqual({ nome: 'Mixo ♭9 ♭13', notas: ['E', 'F', 'G#', 'A', 'B', 'C', 'D'] });
    expect(escalaPara(laMenor, 'III')).toEqual({ nome: 'Mixolídia', notas: ['G', 'A', 'B', 'C', 'D', 'E', 'F'] });
    expect(escalaPara(laMenor, 'v')).toEqual({ nome: 'Mixo ♭9 ♭13', notas: ['B', 'C', 'D#', 'E', 'F#', 'G', 'A'] });
    expect(escalaPara(laMenor, 'VI')).toEqual({ nome: 'Mixolídia', notas: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'] });
    expect(escalaPara(laMenor, 'VII')).toEqual({ nome: 'Mixolídia', notas: ['D', 'E', 'F#', 'G', 'A', 'B', 'C'] });
  });
});

test('acordes diminutos não têm ponte', () => {
  expect(ponteDe(acordesDo[6], doMaior)).toBeNull();
  expect(ponteDe(acordesDoTom(laMenor)[1], laMenor)).toBeNull();
});
