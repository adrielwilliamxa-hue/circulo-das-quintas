import { describe, expect, test } from 'vitest';
import { gerarPergunta, nomeDaTeclaNaPergunta, textoDaRespostaCerta } from './perguntas';
import { criarAleatorio } from './aleatorio';
import { classificar } from '../cerebro/classificacao';
import { acordesDoTom, fmt, nomeDoTom, simbolo } from '../cerebro/tons';
import type { Tom } from '../cerebro/tipos';

const TONS: Tom[] = [
  { tonica: 'C', modo: 'maior' },
  { tonica: 'A', modo: 'menor' },
  { tonica: 'G', modo: 'maior' },
];

describe('erro 2 — a pergunta do tempo fraco só usa nota de passagem de verdade', () => {
  test('em 300 perguntas, a nota perguntada é sempre de passagem sobre o acorde', () => {
    const rng = criarAleatorio(11);
    let conferidas = 0;
    for (let i = 0; i < 300; i++) {
      const p = gerarPergunta('n3-tempo-forte', rng);
      if (p.tipo !== 'botoes') continue;
      const m = /^Em (.+?), no tempo 2 \(fraco\), sobre o (\S+), a nota (\S+) pode/.exec(p.enunciado);
      expect(m, p.enunciado).not.toBeNull();
      const tom = TONS.find((t) => nomeDoTom(t) === m![1])!;
      const acorde = acordesDoTom(tom).find((a) => fmt(simbolo(a, 'triade')) === m![2])!;
      const nota = acorde.escala.notas.find((n) => fmt(n) === m![3])!;
      expect(classificar(nota, acorde, tom, 'triade').marca, p.enunciado).toBe('passagem');
      conferidas++;
    }
    expect(conferidas).toBeGreaterThan(50);
  });
});

describe('erro 4 — resposta certa e teclas escolhidas com a grafia do tom', () => {
  function acharPergunta(enunciado: string) {
    const rng = criarAleatorio(5);
    for (let i = 0; i < 2000; i++) {
      const p = gerarPergunta('n1-triade', rng);
      if (p.enunciado === enunciado) return p;
    }
    throw new Error(`não gerou: ${enunciado}`);
  }

  test('E♭ mostra E♭, G, B♭ (não D♯, G, A♯)', () => {
    const p = acharPergunta('Clique as 3 notas do acorde E♭.');
    expect(textoDaRespostaCerta(p)).toBe('E♭, G, B♭');
    expect(nomeDaTeclaNaPergunta(63, p)).toBe('E♭');
    expect(nomeDaTeclaNaPergunta(70, p)).toBe('B♭');
  });

  test('Fm mostra A♭ (não G♯)', () => {
    expect(textoDaRespostaCerta(acharPergunta('Clique as 3 notas do acorde Fm.'))).toBe('F, A♭, C');
  });

  test('nenhuma pergunta de tom com bemol mostra sustenido na resposta', () => {
    const rng = criarAleatorio(9);
    for (const habilidade of ['n1-triade', 'n2-escalas', 'n1-baixo-triade', 'n3-pentatonica']) {
      for (let i = 0; i < 200; i++) {
        const p = gerarPergunta(habilidade, rng);
        if (p.tipo === 'teclado' && /♭/.test(p.enunciado)) expect(textoDaRespostaCerta(p), p.enunciado).not.toMatch(/♯/);
      }
    }
  });
});
