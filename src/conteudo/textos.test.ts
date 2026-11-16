import { expect, test } from 'vitest';
import { oQueFaz } from './textos';
import { acordesDoTom } from '../cerebro/tons';
import type { Tom } from '../cerebro/tipos';

const doMaior: Tom = { tonica: 'C', modo: 'maior' };
const laMenor: Tom = { tonica: 'A', modo: 'menor' };
const [, ii, iii, , v, vi, vii] = acordesDoTom(doMaior);
const menor = acordesDoTom(laMenor);

test('voltar forte e vii° falam da sensível (frase do design)', () => {
  expect(oQueFaz(v, doMaior)).toBe(
    'A nota B deste acorde fica meio tom abaixo do C. Quando o acorde muda para C, ela sobe até o C, e o ouvido sente que chegou.',
  );
  expect(oQueFaz(vii, doMaior)).toContain('A nota B deste acorde fica meio tom abaixo do C');
  expect(oQueFaz(menor[7], laMenor)).toContain('A nota G♯ deste acorde fica meio tom abaixo do A');
});

test('casa fraco calcula as notas em comum de cada acorde', () => {
  expect(oQueFaz(vi, doMaior)).toBe('Tem 2 notas em comum com o C (C e E). Por isso também soa como casa, só que mais fraco.');
  expect(oQueFaz(iii, doMaior)).toBe('Tem 2 notas em comum com o C (E e G). Por isso também soa como casa, só que mais fraco.');
});

test('sair e voltar fraco', () => {
  expect(oQueFaz(ii, doMaior)).toBe('Afasta do acorde C sem criar muita tensão. Costuma vir antes de um acorde de voltar, como o G.');
  expect(oQueFaz(menor[4], laMenor)).toBe(
    'Faz o papel de voltar, mas fraco: a nota G fica 1 tom abaixo do A, então puxa menos para casa do que o E7.',
  );
});
