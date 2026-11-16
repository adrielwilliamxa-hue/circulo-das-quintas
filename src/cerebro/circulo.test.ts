import { expect, test } from 'vitest';
import { anguloDaJanela, celulasDaJanela, indiceDoTom, rotulosDosAneis, setor, tomDaFatia } from './circulo';

test('posição de cada tom no círculo', () => {
  expect(indiceDoTom({ tonica: 'C', modo: 'maior' })).toBe(0);
  expect(indiceDoTom({ tonica: 'G', modo: 'maior' })).toBe(1);
  expect(indiceDoTom({ tonica: 'F', modo: 'maior' })).toBe(11);
  expect(indiceDoTom({ tonica: 'Eb', modo: 'menor' })).toBe(6);
  expect(indiceDoTom({ tonica: 'A', modo: 'menor' })).toBe(0);
});

test('janela no tom maior e no menor', () => {
  expect(celulasDaJanela(0, 'maior')).toEqual([
    { anel: 'dentro', posicao: 11, grauId: 'IV' },
    { anel: 'dentro', posicao: 0, grauId: 'I' },
    { anel: 'dentro', posicao: 1, grauId: 'V' },
    { anel: 'meio', posicao: 11, grauId: 'ii' },
    { anel: 'meio', posicao: 0, grauId: 'vi' },
    { anel: 'meio', posicao: 1, grauId: 'iii' },
    { anel: 'fora', posicao: 0, grauId: 'vii°' },
  ]);
  expect(celulasDaJanela(0, 'menor').map((c) => c.grauId)).toEqual(['VI', 'III', 'VII', 'iv', 'i', 'v', 'ii°']);
});

test('rótulos dos anéis', () => {
  const { maiores, menores, diminutos } = rotulosDosAneis();
  expect(maiores[6]).toBe('F#/Gb');
  expect(menores[6]).toBe('D#m/Ebm');
  expect(diminutos[6]).toBe('E#°');
  expect(diminutos[0]).toBe('B°');
});

test('clique numa fatia escolhe o tom pelo anel', () => {
  expect(tomDaFatia(1, 'dentro', 'menor')).toEqual({ tonica: 'G', modo: 'maior' });
  expect(tomDaFatia(1, 'meio', 'maior')).toEqual({ tonica: 'E', modo: 'menor' });
  expect(tomDaFatia(1, 'fora', 'menor')).toEqual({ tonica: 'E', modo: 'menor' });
});

test('setor do Am na janela de Dó (mesmo caminho do rascunho 2)', () => {
  expect(setor(95, 125, -15, 15)).toBe('M117.65 29.26 A125 125 0 0 1 182.35 29.26 L174.59 58.24 A95 95 0 0 0 125.41 58.24 Z');
});

test('a janela gira pelo caminho mais curto', () => {
  expect(anguloDaJanela(330, 0)).toBe(360);
  expect(anguloDaJanela(0, 11)).toBe(-30);
  expect(anguloDaJanela(30, 3)).toBe(90);
});
