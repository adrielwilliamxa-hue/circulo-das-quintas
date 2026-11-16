import { expect, test } from 'vitest';
import { dataLocal, estadoDaHabilidade, nivelAtual, type Resposta } from './dominio';
import { NIVEIS } from './niveis';

let contador = 0;
function respostas(habilidade: string, acertos: boolean[], data: string): Resposta[] {
  return acertos.map((acertou) => ({ id: `r${contador++}`, habilidade, acertou, data, quando: `${data}T10:00:${String(contador % 60).padStart(2, '0')}` }));
}

test('16 habilidades testáveis nos níveis 1–3 (5 + 5 + 6)', () => {
  expect(NIVEIS).toHaveLength(7);
  expect(NIVEIS.slice(0, 3).map((n) => n.habilidades.length)).toEqual([5, 5, 6]);
  expect(NIVEIS.slice(0, 3).every((n) => n.versao === '0.5')).toBe(true);
});

test('sem respostas: não começada', () => {
  expect(estadoDaHabilidade([])).toBe('não começada');
});

test('8 de 10 com acertos em 2 dias: dominada', () => {
  const lista = [
    ...respostas('h', [true, true, true, true, false], '2026-10-23'),
    ...respostas('h', [true, true, true, true, false], '2026-10-24'),
  ];
  expect(estadoDaHabilidade(lista)).toBe('dominada');
});

test('8 de 10 num dia só: continua praticando', () => {
  expect(estadoDaHabilidade(respostas('h', [true, true, true, true, true, true, true, true, false, false], '2026-10-23'))).toBe('praticando');
});

test('dominada só cai com menos de 6 nas últimas 10', () => {
  const base = [
    ...respostas('h', [true, true, true, true, true], '2026-10-23'),
    ...respostas('h', [true, true, true, true, true], '2026-10-24'),
  ];
  const seis = [...base, ...respostas('h', [false, false, false, false], '2026-10-25')];
  expect(estadoDaHabilidade(seis)).toBe('dominada');
  const cinco = [...seis, ...respostas('h', [false], '2026-10-25')];
  expect(estadoDaHabilidade(cinco)).toBe('praticando');
});

test('data local, não UTC', () => {
  expect(dataLocal(new Date(2026, 9, 23, 23, 30))).toBe('2026-10-23');
});

test('nível atual é o primeiro com habilidade não dominada', () => {
  expect(nivelAtual([])).toBe(1);
  const tudoDoNivel1 = NIVEIS[0].habilidades.flatMap((h) => [
    ...respostas(h.id, [true, true, true, true, true], '2026-10-23'),
    ...respostas(h.id, [true, true, true, true, true], '2026-10-24'),
  ]);
  expect(nivelAtual(tudoDoNivel1)).toBe(2);
});
