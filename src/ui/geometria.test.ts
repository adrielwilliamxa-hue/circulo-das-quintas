import { expect, test } from 'vitest';
import { LARGURA_TECLADO, centroX, teclas } from './geometriaTeclado';
import { blocosVisiveis } from './geometriaChuva';

test('teclado do rascunho 2: C3 a B5, 651 de largura', () => {
  expect(LARGURA_TECLADO).toBe(651);
  expect(teclas()).toHaveLength(36);
  expect(centroX(60)).toBe(232.5);
  expect(centroX(67)).toBe(356.5);
  expect(teclas().find((t) => t.midi === 61)).toMatchObject({ preta: true, x: 238, largura: 20 });
});

test('chuva: com posição 0,5, o bloco do compasso 1 fica na metade de cima', () => {
  const vozes = [
    { midis: [60, 64, 67], baixo: 48, funcao: 'casa' as const },
    { midis: [62, 67, 71], baixo: 55, funcao: 'voltar' as const },
  ];
  const blocos = blocosVisiveis(0.5, vozes, 400, false);
  const doCompasso1 = blocos.filter((b) => b.compasso === 1);
  expect(doCompasso1).toHaveLength(4);
  expect(doCompasso1[0]).toMatchObject({ y: 100, altura: 200 });
});

test('chuva: movimento por tempo anda em passos de um tempo', () => {
  const vozes = [{ midis: [60, 64, 67], baixo: 48, funcao: 'casa' as const }];
  expect(blocosVisiveis(0.3, vozes, 400, true)[0].y).toBe(blocosVisiveis(0.25, vozes, 400, false)[0].y);
});
