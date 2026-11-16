import { expect, test } from 'vitest';
import { gerarMarkdown, juntar, lerMarkdown } from './arquivo';
import type { Resposta } from './dominio';

const respostas: Resposta[] = [
  { id: 'a', habilidade: 'n1-notas', acertou: true, data: '2026-10-23', quando: '2026-10-23T19:00:00.000Z' },
  { id: 'b', habilidade: 'n1-tom-semitom', acertou: false, data: '2026-10-23', quando: '2026-10-23T19:01:00.000Z' },
];

test('ida e volta: o app lê o que gravou', () => {
  const texto = gerarMarkdown(respostas, new Date(2026, 9, 23, 16, 5));
  expect(lerMarkdown(texto)).toEqual({ ok: true, respostas });
});

test('o arquivo é legível para pessoas', () => {
  const texto = gerarMarkdown(respostas, new Date(2026, 9, 23, 16, 5));
  expect(texto).toContain('**Nível atual:** 1 — Iniciante');
  expect(texto).toContain('## O que trabalhar agora');
  expect(texto).toContain('| 1 | Achar as notas no teclado | praticando | 1/1 | 2026-10-23 |');
  expect(texto).toContain('atualizado: 2026-10-23 16:05');
});

test('erro 15a — "o que trabalhar agora" lista só as habilidades em prática', () => {
  const texto = gerarMarkdown(respostas, new Date(2026, 9, 23, 16, 5));
  const secao = texto.split('## O que trabalhar agora')[1].split('##')[0];
  expect(secao).toContain('Achar as notas no teclado');
  expect(secao).toContain('Tom e semitom');
  expect(secao).not.toContain('Tempo forte e tempo fraco (não começada)');
  expect(secao).toContain('Ainda não começadas no nível atual: Tempo forte e tempo fraco, Montar tríade maior e menor, Baixo na esquerda + tríade na direita.');
});

test('texto sem o bloco de dados é ilegível', () => {
  expect(lerMarkdown('# Progresso\n\nalguém editou e apagou os dados').ok).toBe(false);
  expect(lerMarkdown('## Dados do app (não editar)\n\n```json\n{quebrado\n```').ok).toBe(false);
});

test('juntar não duplica e mantém a ordem do tempo', () => {
  const nova: Resposta = { id: 'c', habilidade: 'n1-notas', acertou: true, data: '2026-10-24', quando: '2026-10-24T10:00:00.000Z' };
  expect(juntar([respostas[1], nova], respostas).map((r) => r.id)).toEqual(['a', 'b', 'c']);
});
