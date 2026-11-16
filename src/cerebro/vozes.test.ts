import { describe, expect, test } from 'vitest';
import { baixo, dedilhado, montagem, vozDoFormato, vozMaisProxima, vozesCandidatas, vozesDoLoop } from './vozes';
import { acordesDoTom } from './tons';

const [C, , , F, G, Am] = acordesDoTom({ tonica: 'C', modo: 'maior' });

describe('vozes da mão direita (C4 a B5)', () => {
  test('candidatas fechadas de C', () => {
    expect(vozesCandidatas(C.triade).map((v) => v.midis)).toEqual([
      [60, 64, 67], [72, 76, 79], [64, 67, 72], [67, 72, 76],
    ]);
  });

  test('primeiro acorde fica na posição fundamental a partir do C4', () => {
    expect(vozMaisProxima(C.triade, null)).toEqual({ midis: [60, 64, 67], inversao: 0 });
    expect(vozMaisProxima(G.triade, null)).toEqual({ midis: [67, 71, 74], inversao: 0 });
  });

  test('em empate, fica a mais grave', () => {
    expect(vozMaisProxima(C.triade, [62, 66, 69]).midis).toEqual([60, 64, 67]);
  });

  test('loop Pop em Dó usa a segunda volta', () => {
    expect(vozesDoLoop([C.triade, G.triade, Am.triade, F.triade])).toEqual([
      { midis: [64, 67, 72], inversao: 1 },
      { midis: [62, 67, 71], inversao: 2 },
      { midis: [64, 69, 72], inversao: 2 },
      { midis: [65, 69, 72], inversao: 0 },
    ]);
  });
});

describe('formatos, baixo, dedilhado e montagem', () => {
  test('tétrade e só a quinta do G', () => {
    expect(vozDoFormato(G, 'tetrade', 0)).toEqual([67, 71, 74, 77]);
    expect(vozDoFormato(G, 'quinta', 0)).toEqual([67, 74]);
    expect(vozDoFormato(G, 'triade', 1)).toEqual([71, 74, 79]);
  });

  test('baixo do G na mão esquerda', () => {
    expect(baixo(G, 'fundamental')).toBe(55);
    expect(baixo(G, 'terca')).toBe(59);
    expect(baixo(G, 'quinta')).toBe(50);
  });

  test('dedilhado por inversão', () => {
    expect(dedilhado('triade', 0)).toEqual({ direita: '1-3-5', esquerda: '5-3-1' });
    expect(dedilhado('triade', 1)).toEqual({ direita: '1-2-5', esquerda: '5-3-1' });
    expect(dedilhado('triade', 2)).toEqual({ direita: '1-3-5', esquerda: '5-2-1' });
  });

  test('montagem do G mostra as meias-teclas', () => {
    expect(montagem(G, 'triade')).toEqual([
      { nota: 'G', papel: 'fundamental', meiasTeclas: 0 },
      { nota: 'B', papel: '3ª', meiasTeclas: 4 },
      { nota: 'D', papel: '5ª', meiasTeclas: 7 },
    ]);
  });
});
