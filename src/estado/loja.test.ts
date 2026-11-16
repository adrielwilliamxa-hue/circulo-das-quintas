import { expect, test } from 'vitest';
import { acordeEmFoco, criarLoja, vozDaMaoDireita } from './loja';

test('com o loop tocando, a troca de tom espera o próximo compasso', () => {
  const loja = criarLoja();
  loja.getState().setTocando(true);
  loja.getState().escolherTom({ tonica: 'G', modo: 'maior' });
  expect(loja.getState().tom).toEqual({ tonica: 'C', modo: 'maior' });
  expect(loja.getState().tomPendente).toEqual({ tonica: 'G', modo: 'maior' });
  loja.getState().aplicarPendentes();
  expect(loja.getState().tom).toEqual({ tonica: 'G', modo: 'maior' });
  expect(loja.getState().tomPendente).toBeNull();
});

test('trocar de maior para menor volta a progressão para Triste', () => {
  const loja = criarLoja();
  loja.getState().escolherTom({ tonica: 'A', modo: 'menor' });
  expect(loja.getState().progressaoId).toBe('triste');
  expect(loja.getState().selecionadoId).toBe('i');
});

test('selecionar outro acorde volta formato, inversão e baixo ao padrão', () => {
  const loja = criarLoja();
  const s = loja.getState();
  s.escolherFormato('tetrade');
  s.escolherInversao(2);
  s.escolherBaixo('terca');
  s.selecionarAcorde('V');
  const depois = loja.getState();
  expect([depois.formato, depois.inversaoManual, depois.baixoOpcao]).toEqual(['triade', null, 'fundamental']);
});

test('o acorde novo usa a inversão mais perto do anterior', () => {
  const loja = criarLoja();
  expect(vozDaMaoDireita(loja.getState())).toEqual({ midis: [60, 64, 67], inversao: 0 });
  loja.getState().selecionarAcorde('V');
  expect(vozDaMaoDireita(loja.getState())).toEqual({ midis: [62, 67, 71], inversao: 2 });
});

test('erro 8 — pausar o loop aplica o tom que estava esperando o compasso', () => {
  const loja = criarLoja();
  loja.getState().setTocando(true);
  loja.getState().escolherTom({ tonica: 'Eb', modo: 'maior' });
  loja.getState().setTocando(false);
  expect(loja.getState().tom).toEqual({ tonica: 'Eb', modo: 'maior' });
  expect(loja.getState().tomPendente).toBeNull();
});

test('erro 9 — trocar de progressão com o loop tocando espera o próximo compasso', () => {
  const loja = criarLoja();
  loja.getState().setTocando(true);
  loja.getState().setPosicao({ compasso: 1, tempo: 2 });
  loja.getState().escolherProgressao('anos50');
  expect(loja.getState().progressaoId).toBe('pop');
  expect(acordeEmFoco(loja.getState()).id).toBe('V');
  loja.getState().aplicarPendentes();
  expect(loja.getState().progressaoId).toBe('anos50');
});

test('erro 6 — escolher "só a quinta" num diminuto é ignorado', () => {
  const loja = criarLoja();
  loja.getState().selecionarAcorde('vii°');
  loja.getState().escolherFormato('quinta');
  expect(loja.getState().formato).toBe('triade');
});

test('erro 13 — depois de G5, o C escolhe a voz mais perto (G-C-E)', () => {
  const loja = criarLoja();
  loja.getState().selecionarAcorde('V');
  loja.getState().escolherFormato('quinta');
  loja.getState().selecionarAcorde('I');
  expect(vozDaMaoDireita(loja.getState()).midis).toEqual([67, 72, 76]);
});

test('com o loop tocando, o foco é o acorde do loop', () => {
  const loja = criarLoja();
  loja.getState().setTocando(true);
  loja.getState().setPosicao({ compasso: 1, tempo: 0 });
  expect(acordeEmFoco(loja.getState()).id).toBe('V');
  expect(vozDaMaoDireita(loja.getState()).midis).toEqual([62, 67, 71]);
});
