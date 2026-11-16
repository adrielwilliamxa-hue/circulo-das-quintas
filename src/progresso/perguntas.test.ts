import { expect, test } from 'vitest';
import { gerarPergunta, respostaCerta, respostaErrada, verificar } from './perguntas';
import { criarAleatorio } from './aleatorio';
import { NIVEIS } from './niveis';

const TESTAVEIS = NIVEIS.filter((n) => n.versao === '0.5').flatMap((n) => n.habilidades);

test('as 16 habilidades da v0.5 têm perguntas', () => {
  expect(TESTAVEIS).toHaveLength(16);
});

for (const h of TESTAVEIS) {
  test(`${h.id}: 50 perguntas; a resposta certa passa e uma errada falha`, () => {
    const rng = criarAleatorio(42);
    for (let i = 0; i < 50; i++) {
      const p = gerarPergunta(h.id, rng);
      expect(p.habilidade).toBe(h.id);
      expect(p.enunciado.length).toBeGreaterThan(10);
      expect(p.explicacao.length).toBeGreaterThan(10);
      expect(verificar(p, respostaCerta(p))).toBe(true);
      expect(verificar(p, respostaErrada(p))).toBe(false);
    }
  });
}

test('cadências usam os 5 nomes do vault', () => {
  const rng = criarAleatorio(7);
  const nomes = new Set<string>();
  for (let i = 0; i < 80; i++) {
    const p = gerarPergunta('n3-cadencias', rng);
    if (p.tipo === 'botoes') p.opcoes.forEach((o) => nomes.add(o));
  }
  expect([...nomes].sort()).toEqual(['Deceptiva', 'Imperfeita', 'Meia cadência', 'Perfeita', 'Plagal']);
});

test('mesma semente, mesmas perguntas', () => {
  expect(gerarPergunta('n2-campo', criarAleatorio(3)).enunciado).toBe(gerarPergunta('n2-campo', criarAleatorio(3)).enunciado);
});
