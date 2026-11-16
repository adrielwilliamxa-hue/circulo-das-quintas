import { Note } from 'tonal';
import { acordesDoTom, armadura, nomeDoTom, simbolo } from '../cerebro/tons';
import { classificar } from '../cerebro/classificacao';
import { classe, fmt, meiasTeclas, midiAPartirDe } from '../cerebro/notas';
import { baixo, vozMaisProxima, vozesCandidatas } from '../cerebro/vozes';
import { PROGRESSOES } from '../cerebro/progressoes';
import { TERMO_DA_FUNCAO, NOME_DA_FUNCAO } from '../ui/cores';
import { embaralhar, escolher, type Aleatorio } from './aleatorio';
import type { Tom } from '../cerebro/tipos';

/** Como a resposta de teclado é conferida. */
export type Conferencia =
  | { tipo: 'uma-classe'; classes: number[] }
  | { tipo: 'classes'; classes: number[] }
  | { tipo: 'baixo-e-triade'; baixo: number; classes: number[] }
  | { tipo: 'inversao'; classes: number[]; grave: number };

interface Base {
  habilidade: string;
  enunciado: string;
  explicacao: string;
  /** Acordes (números MIDI) para tocar ao mostrar a pergunta. */
  tocar?: number[][];
}

export type Pergunta =
  | (Base & { tipo: 'botoes'; opcoes: string[]; certa: string })
  | (Base & {
      tipo: 'teclado';
      conferencia: Conferencia;
      dica: string;
      /** Notas pedidas com a grafia do tom (para mostrar a resposta certa sem trocar E♭ por D♯). */
      nomes: string[];
    });

export type RespostaDada = string | number[];

const BRANCAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const TONS_SIMPLES = ['C', 'G', 'D', 'A', 'F', 'Bb', 'Eb'];
const MENORES_SIMPLES = ['A', 'E', 'D', 'B', 'G', 'C'];

function opcoes(rng: Aleatorio, certa: string, erradas: string[]): string[] {
  const unicas = [...new Set(erradas.filter((e) => e !== certa))];
  return embaralhar(rng, [certa, ...embaralhar(rng, unicas).slice(0, 3)]);
}

function botoes(habilidade: string, enunciado: string, rng: Aleatorio, certa: string, erradas: string[], explicacao: string, tocar?: number[][]): Pergunta {
  return { tipo: 'botoes', habilidade, enunciado, opcoes: opcoes(rng, certa, erradas), certa, explicacao, tocar };
}

function triadeMidis(notas: string[]): number[] {
  return vozMaisProxima(notas, null).midis;
}

const ONDE_FICA: Record<number, string> = {
  0: 'logo à esquerda do grupo de 2 teclas pretas',
  2: 'entre as 2 teclas pretas do grupo de 2',
  4: 'logo à direita do grupo de 2 teclas pretas',
  5: 'logo à esquerda do grupo de 3 teclas pretas',
  7: 'entre a 1ª e a 2ª tecla preta do grupo de 3',
  9: 'entre a 2ª e a 3ª tecla preta do grupo de 3',
  11: 'logo à direita do grupo de 3 teclas pretas',
  1: 'a 1ª tecla preta do grupo de 2',
  3: 'a 2ª tecla preta do grupo de 2',
  6: 'a 1ª tecla preta do grupo de 3',
  8: 'a tecla preta do meio do grupo de 3',
  10: 'a 3ª tecla preta do grupo de 3',
};

const GERADORES: Record<string, (rng: Aleatorio) => Pergunta> = {
  'n1-notas': (rng) => {
    const c = Math.floor(rng() * 12);
    const sustenido = Note.pitchClass(Note.fromMidiSharps(60 + c));
    const bemol = Note.pitchClass(Note.fromMidi(60 + c));
    const nome = sustenido === bemol ? fmt(sustenido) : `${fmt(sustenido)} (também chamada ${fmt(bemol)})`;
    return {
      tipo: 'teclado',
      habilidade: 'n1-notas',
      enunciado: `Clique numa tecla ${nome}.`,
      dica: 'Qualquer oitava vale. Clique uma tecla e depois em Responder.',
      conferencia: { tipo: 'uma-classe', classes: [c] },
      nomes: [sustenido === bemol ? sustenido : `${sustenido}/${bemol}`],
      explicacao: `${fmt(sustenido)} é ${ONDE_FICA[c]}.${sustenido !== bemol ? ' A mesma tecla tem dois nomes: o som é um só.' : ''}`,
    };
  },

  'n1-tom-semitom': (rng) => {
    const de = escolher(rng, BRANCAS);
    const distancia = escolher(rng, [1, 2]);
    const ate = Note.pitchClass(Note.fromMidiSharps(midiAPartirDe(de, 60) + distancia));
    const explicacao = 'Semitom (meio tom) = duas teclas vizinhas, contando as pretas. Tom = dois semitons: pula uma tecla.';
    if (rng() < 0.5) {
      return botoes('n1-tom-semitom', `De ${fmt(de)} até ${fmt(ate)} (subindo), a distância é:`, rng, distancia === 1 ? 'Meio tom (semitom)' : '1 tom', ['Meio tom (semitom)', '1 tom'], explicacao);
    }
    return {
      tipo: 'teclado',
      habilidade: 'n1-tom-semitom',
      enunciado: `Clique a nota ${distancia === 1 ? 'meio tom' : '1 tom'} acima de ${fmt(de)}.`,
      dica: 'Clique uma tecla e depois em Responder.',
      conferencia: { tipo: 'uma-classe', classes: [classe(ate)] },
      nomes: [ate],
      explicacao: `${explicacao} ${distancia === 1 ? 'Meio tom' : '1 tom'} acima de ${fmt(de)} é ${fmt(ate)}.`,
    };
  },

  'n1-tempos': (rng) => {
    const NOMES = ['forte', 'fraco', 'meio forte', 'fraco'];
    const explicacao = 'No compasso de 4 tempos: 1 forte, 2 fraco, 3 meio forte, 4 fraco. No tempo forte, a melhor nota é uma nota do acorde.';
    if (rng() < 0.6) {
      const t = Math.floor(rng() * 4);
      return botoes('n1-tempos', `No compasso de 4 tempos, o tempo ${t + 1} é:`, rng, NOMES[t], ['forte', 'fraco', 'meio forte'], explicacao);
    }
    return botoes('n1-tempos', 'Qual é a melhor hora para parar numa nota do acorde?', rng, 'No tempo 1', ['No tempo 2', 'No tempo 4', 'Tanto faz'], explicacao);
  },

  'n1-triade': (rng) => {
    const raiz = escolher(rng, TONS_SIMPLES);
    const menor = rng() < 0.5;
    const notas = [raiz, Note.transpose(raiz, menor ? '3m' : '3M'), Note.transpose(raiz, '5P')];
    const nome = fmt(raiz + (menor ? 'm' : ''));
    return {
      tipo: 'teclado',
      habilidade: 'n1-triade',
      enunciado: `Clique as 3 notas do acorde ${nome}.`,
      dica: 'Qualquer oitava vale. Clique as teclas e depois em Responder.',
      conferencia: { tipo: 'classes', classes: notas.map(classe) },
      nomes: notas,
      explicacao: `${nome} =${fmt(notas[0])} + ${fmt(notas[1])} (${menor ? 3 : 4} meias-teclas acima) + ${fmt(notas[2])} (7 meias-teclas acima). ${menor ? 'Menor = terça menor + terça maior.' : 'Maior = terça maior + terça menor.'}`,
      tocar: [triadeMidis(notas)],
    };
  },

  'n1-baixo-triade': (rng) => {
    const tom: Tom = { tonica: escolher(rng, ['C', 'G', 'F', 'D']), modo: 'maior' };
    const acorde = escolher(rng, acordesDoTom(tom).slice(0, 6));
    const nome = fmt(simbolo(acorde, 'triade'));
    return {
      tipo: 'teclado',
      habilidade: 'n1-baixo-triade',
      enunciado: `Monte o ${nome} com as duas mãos: o baixo ${fmt(acorde.fundamental)} na mão esquerda (oitava de baixo) e a tríade na mão direita.`,
      dica: 'A mão esquerda é a 1ª oitava do teclado da tela; a direita, as duas de cima.',
      conferencia: { tipo: 'baixo-e-triade', baixo: classe(acorde.fundamental), classes: acorde.triade.map(classe) },
      nomes: [acorde.fundamental, ...acorde.triade],
      explicacao: `Baixo ${fmt(acorde.fundamental)} na esquerda; ${acorde.triade.map(fmt).join(', ')} na direita. A esquerda segura o chão do acorde e a direita fica livre para o acorde ou a melodia.`,
      tocar: [[baixo(acorde, 'fundamental'), ...triadeMidis(acorde.triade)]],
    };
  },

  'n2-intervalos': (rng) => {
    const INTERVALOS: [string, string, number][] = [
      ['2M', '2ª maior', 2], ['3m', '3ª menor', 3], ['3M', '3ª maior', 4], ['4P', '4ª justa', 5],
      ['5P', '5ª justa', 7], ['6M', '6ª maior', 9], ['7m', '7ª menor', 10], ['8P', '8ª justa (oitava)', 12],
    ];
    const de = escolher(rng, ['C', 'D', 'E', 'F', 'G', 'A']);
    const [codigo, nome, meias] = escolher(rng, INTERVALOS);
    const ate = Note.transpose(de, codigo);
    return botoes(
      'n2-intervalos',
      `De ${fmt(de)} até ${fmt(ate)} (subindo), qual é o intervalo?`,
      rng,
      nome,
      INTERVALOS.map((i) => i[1]),
      `Conte as meias-teclas: de ${fmt(de)} até ${fmt(ate)} são ${meias}. ${meias} meias-teclas = ${nome}.`,
    );
  },

  'n2-escalas': (rng) => {
    const tonica = escolher(rng, ['C', 'G', 'F']);
    const tom: Tom = { tonica, modo: 'maior' };
    const notas = acordesDoTom(tom)[0].escala.notas;
    if (rng() < 0.5) {
      return {
        tipo: 'teclado',
        habilidade: 'n2-escalas',
        enunciado: `Clique as 7 notas da escala de ${nomeDoTom(tom)}.`,
        dica: 'Qualquer oitava vale. Clique as 7 teclas e depois em Responder.',
        conferencia: { tipo: 'classes', classes: notas.map(classe) },
        nomes: notas,
        explicacao: `${nomeDoTom(tom)}:${notas.map(fmt).join(' ')}. Padrão da escala maior: tom, tom, semitom, tom, tom, tom, semitom.`,
      };
    }
    const acidente = tonica === 'C' ? 'Nenhuma' : fmt(notas.find((n) => n.length > 1)!);
    return botoes(
      'n2-escalas',
      `Qual nota tem acidente (♯ ou ♭) na escala de ${nomeDoTom(tom)}?`,
      rng,
      acidente,
      ['Nenhuma', 'F♯', 'B♭', 'C♯', 'E♭'],
      `${nomeDoTom(tom)}: ${notas.map(fmt).join(' ')}. ${tonica === 'C' ? 'É a única escala maior só com teclas brancas.' : `Para manter o padrão tom-tom-semitom…, ${acidente} entra no lugar da nota natural.`}`,
    );
  },

  'n2-circulo': (rng) => {
    const tonica = escolher(rng, ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab']);
    const tom: Tom = { tonica, modo: 'maior' };
    const forma = Math.floor(rng() * 3);
    if (forma === 0) {
      const { quantidade, tipo } = armadura(tom);
      const rotulo = (q: number, t: 'sustenidos' | 'bemóis') => (q === 1 ? `1 ${t === 'sustenidos' ? 'sustenido' : 'bemol'}` : `${q} ${t}`);
      const certa = quantidade === 0 || tipo === 'nenhum' ? 'Nenhum acidente' : rotulo(quantidade, tipo);
      return botoes('n2-circulo', `Quantos acidentes tem a armadura de ${nomeDoTom(tom)}?`, rng, certa,
        ['Nenhum acidente', ...[1, 2, 3, 4].flatMap((q) => [rotulo(q, 'sustenidos'), rotulo(q, 'bemóis')])],
        'No sentido do relógio, cada fatia soma 1 sustenido; no sentido contrário, 1 bemol. Dó maior não tem nenhum.');
    }
    if (forma === 1) {
      const relativa = acordesDoTom(tom)[5].fundamental;
      return botoes('n2-circulo', `Qual é a relativa menor de ${nomeDoTom(tom)}?`, rng, `${fmt(relativa)} menor`,
        ['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb'].map((n) => `${fmt(n)} menor`),
        `A relativa menor começa no 6º grau da escala maior e usa as mesmas notas. No círculo, fica na mesma fatia, no anel do meio: ${fmt(relativa)} menor.`);
    }
    const escala = acordesDoTom(tom)[0].escala.notas;
    const certa = `${nomeDoTom({ tonica: escala[3], modo: 'maior' })} e ${nomeDoTom({ tonica: escala[4], modo: 'maior' })}`;
    const outros = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab', 'B'].filter((n) => n !== escala[3] && n !== escala[4] && n !== tonica);
    return botoes('n2-circulo', `Quais são os tons maiores vizinhos de ${nomeDoTom(tom)} no círculo?`, rng, certa,
      [0, 1, 2, 3].map((i) => `${nomeDoTom({ tonica: outros[(i * 2) % outros.length], modo: 'maior' })} e ${nomeDoTom({ tonica: outros[(i * 2 + 3) % outros.length], modo: 'maior' })}`),
      `Os vizinhos ficam nas fatias ao lado: o IV (${fmt(escala[3])}) e o V (${fmt(escala[4])}). Eles diferem em só 1 acidente.`);
  },

  'n2-campo': (rng) => {
    const tom: Tom = { tonica: escolher(rng, ['C', 'G', 'D', 'F', 'Bb']), modo: 'maior' };
    const acordes = acordesDoTom(tom);
    const alvo = escolher(rng, acordes);
    return botoes('n2-campo', `Em ${nomeDoTom(tom)}, qual é o acorde do grau ${alvo.grau}?`, rng, fmt(simbolo(alvo, 'triade')),
      acordes.map((a) => fmt(simbolo(a, 'triade'))),
      `Os 7 acordes de ${nomeDoTom(tom)}: ${acordes.map((a) => `${a.grau} ${fmt(simbolo(a, 'triade'))}`).join(', ')}. Padrão em qualquer tom maior: I, IV e V maiores; ii, iii e vi menores; vii° diminuto.`);
  },

  'n2-inversoes': (rng) => {
    if (rng() < 0.5) {
      const INV = [['Posição fundamental', '1-3-5'], ['1ª inversão', '1-2-5'], ['2ª inversão', '1-3-5']];
      const i = Math.floor(rng() * 2);
      const [nome, dedos] = INV[i === 0 ? 1 : 0];
      return botoes('n2-inversoes', `Qual é o dedilhado da mão direita na ${nome.toLowerCase()} de uma tríade?`, rng, dedos,
        ['1-3-5', '1-2-5', '1-2-4', '5-3-1'].filter((d) => !(dedos === '1-3-5' && d === '1-2-4')),
        'Mão direita: fundamental 1-3-5; 1ª inversão 1-2-5 (o intervalo de cima é uma 4ª, mais largo); 2ª inversão 1-3-5. 1 = polegar, 5 = mindinho.');
    }
    const raiz = escolher(rng, ['C', 'G', 'F', 'D', 'A']);
    const notas = [raiz, Note.transpose(raiz, '3M'), Note.transpose(raiz, '5P')];
    const inversao = escolher(rng, [1, 2]);
    const grave = notas[inversao];
    return {
      tipo: 'teclado',
      habilidade: 'n2-inversoes',
      enunciado: `Clique a ${inversao}ª inversão de ${fmt(raiz)}: as notas do acorde com o ${fmt(grave)} embaixo.`,
      dica: 'Clique as 3 teclas e depois em Responder. A mais grave precisa ser a pedida.',
      conferencia: { tipo: 'inversao', classes: notas.map(classe), grave: classe(grave) },
      nomes: [...notas.slice(inversao), ...notas.slice(0, inversao)],
      explicacao: `Mesmas notas (${notas.map(fmt).join(', ')}), outra ordem: na ${inversao}ª inversão a ${inversao === 1 ? '3ª' : '5ª'} (${fmt(grave)}) vai para baixo.`,
    };
  },

  'n3-funcoes': (rng) => {
    const tom: Tom = { tonica: escolher(rng, ['C', 'G', 'D', 'F']), modo: 'maior' };
    const alvo = escolher(rng, acordesDoTom(tom));
    const rotulo = (f: 'casa' | 'sair' | 'voltar') => `${NOME_DA_FUNCAO[f]} (${TERMO_DA_FUNCAO[f]})`;
    return botoes('n3-funcoes', `Em ${nomeDoTom(tom)}, o acorde ${fmt(simbolo(alvo, 'triade'))} (grau ${alvo.grau}) faz o papel de:`, rng, rotulo(alvo.funcao),
      [rotulo('casa'), rotulo('sair'), rotulo('voltar')],
      'Casa: I, iii, vi (repouso). Sair: IV e ii (afastam sem muita tensão). Voltar: V e vii° (têm a nota meio tom abaixo da tônica, que pede o acorde de casa).');
  },

  'n3-cadencias': (rng) => {
    const tom: Tom = { tonica: escolher(rng, ['C', 'G', 'F', 'D']), modo: 'maior' };
    const [I, ii, , IV, V, vi] = acordesDoTom(tom);
    const n = (a: typeof I) => fmt(simbolo(a, 'triade'));
    const tocarDois = (a: typeof I, b: typeof I) => [[baixo(a, 'fundamental'), ...triadeMidis(a.triade)], [baixo(b, 'fundamental'), ...triadeMidis(b.triade)]];
    const CADENCIAS = [
      { nome: 'Perfeita', texto: `${n(V)} → ${n(I)}`, explica: 'V → I com os dois acordes na posição fundamental: ponto final.', tocar: tocarDois(V, I) },
      { nome: 'Imperfeita', texto: `${n(V)}/${fmt(V.triade[1])} → ${n(I)}`, explica: 'V → I com um acorde invertido: conclui, mas menos (ponto continuativo).', tocar: [[baixo(V, 'terca'), ...triadeMidis(V.triade)], [baixo(I, 'fundamental'), ...triadeMidis(I.triade)]] },
      { nome: 'Deceptiva', texto: `${n(V)} → ${n(vi)}`, explica: 'O V vai para outro acorde que não é o I: o ouvido esperava casa e é surpreendido.', tocar: tocarDois(V, vi) },
      { nome: 'Meia cadência', texto: `${n(ii)} → ${n(V)} (e para no ${n(V)})`, explica: 'A frase para no acorde de voltar: fica suspense, "algo no ar".', tocar: tocarDois(ii, V) },
      { nome: 'Plagal', texto: `${n(IV)} → ${n(I)}`, explica: 'IV → I, sem passar pelo V: conclui com pouca expectativa. É a cadência do "Amém".', tocar: tocarDois(IV, I) },
    ];
    const c = escolher(rng, CADENCIAS);
    return botoes('n3-cadencias', `Em ${nomeDoTom(tom)}, a passagem ${c.texto} é uma cadência:`, rng, c.nome, CADENCIAS.map((x) => x.nome), c.explica, c.tocar);
  },

  'n3-menor': (rng) => {
    const tonica = escolher(rng, MENORES_SIMPLES);
    const tom: Tom = { tonica, modo: 'menor' };
    const acordes = acordesDoTom(tom);
    if (rng() < 0.5) {
      const alvo = escolher(rng, acordes.slice(0, 7));
      return botoes('n3-menor', `Em ${nomeDoTom(tom)}, qual é o acorde do grau ${alvo.grau}?`, rng, fmt(simbolo(alvo, 'triade')),
        acordes.slice(0, 7).map((a) => fmt(simbolo(a, 'triade'))),
        `Campo de ${nomeDoTom(tom)}: ${acordes.slice(0, 7).map((a) => `${a.grau} ${fmt(simbolo(a, 'triade'))}`).join(', ')}.`);
    }
    const v7 = acordes[7];
    return botoes('n3-menor', `Em ${nomeDoTom(tom)}, qual acorde volta com força para a tônica (vem da escala menor harmônica)?`, rng, fmt(simbolo(v7, 'tetrade')),
      [fmt(simbolo(acordes[4], 'tetrade')), fmt(simbolo(acordes[6], 'tetrade')), fmt(simbolo(acordes[3], 'tetrade'))],
      `A escala menor natural não tem a nota meio tom abaixo da tônica. A harmônica sobe o 7º grau e cria o ${fmt(simbolo(v7, 'tetrade'))}, que puxa para o ${fmt(simbolo(acordes[0], 'triade'))}.`);
  },

  'n3-tempo-forte': (rng) => {
    const tom: Tom = escolher(rng, [{ tonica: 'C', modo: 'maior' }, { tonica: 'A', modo: 'menor' }, { tonica: 'G', modo: 'maior' }] as Tom[]);
    const acorde = escolher(rng, acordesDoTom(tom).slice(0, 6).filter((a) => a.qualidade !== 'diminuta'));
    const nome = fmt(simbolo(acorde, 'triade'));
    if (rng() < 0.6) {
      return {
        tipo: 'teclado',
        habilidade: 'n3-tempo-forte',
        enunciado: `Tempo 1 (forte), com o ${nome} tocando: clique uma nota boa para a melodia parar.`,
        dica: 'Escolha uma tecla da mão direita e clique em Responder.',
        conferencia: { tipo: 'uma-classe', classes: acorde.triade.map(classe) },
        nomes: acorde.triade,
        explicacao: `No tempo forte, a melodia para numa nota do acorde: ${acorde.triade.map(fmt).join(', ')}.`,
        tocar: [[baixo(acorde, 'fundamental'), ...triadeMidis(acorde.triade)]],
      };
    }
    // Só acordes que têm nota de passagem de verdade (o IV, na escala Lídia, não tem nenhuma).
    const passagemDe = (a: typeof acorde) => a.escala.notas.find((n) => classificar(n, a, tom, 'triade').marca === 'passagem');
    const comPassagem = escolher(rng, acordesDoTom(tom).slice(0, 6).filter((a) => a.qualidade !== 'diminuta' && passagemDe(a)));
    const nota = passagemDe(comPassagem)!;
    return botoes(
      'n3-tempo-forte',
      `Em ${nomeDoTom(tom)}, no tempo 2 (fraco), sobre o ${fmt(simbolo(comPassagem, 'triade'))}, a nota ${fmt(nota)} pode aparecer na melodia?`,
      rng,
      'Sim, de passagem, sem parar nela',
      ['Não, nunca', 'Sim, e deve segurar bastante', 'Só no tempo 1'],
      `${fmt(nota)} é nota de passagem sobre o ${fmt(simbolo(comPassagem, 'triade'))}: cabe num tempo fraco, no caminho entre duas notas do acorde, sem parar nela. No tempo forte, prefira uma nota do acorde.`,
    );
  },

  'n3-progressoes': (rng) => {
    const prog = escolher(rng, PROGRESSOES);
    const tom: Tom = prog.modo === 'maior' ? { tonica: escolher(rng, ['C', 'G', 'D', 'F']), modo: 'maior' } : { tonica: escolher(rng, MENORES_SIMPLES), modo: 'menor' };
    const acordes = acordesDoTom(tom);
    const nomeDe = (graus: string[]) => graus.map((g) => fmt(simbolo(acordes.find((a) => a.id === g)!, 'triade'))).join(' – ');
    const certa = nomeDe(prog.graus);
    const ids = acordes.slice(0, 7).map((a) => a.id);
    const erradas = [0, 1, 2, 3, 4].map((i) => nomeDe(prog.graus.map((g, j) => ids[(ids.indexOf(g) + (j === i % prog.graus.length ? 1 + (i % 3) : 0)) % 7])));
    return botoes('n3-progressoes', `Em ${nomeDoTom(tom)}, a progressão ${prog.graus.join('–')} fica:`, rng, certa, erradas,
      `Cada número romano é um grau do tom. Em ${nomeDoTom(tom)}: ${prog.graus.map((g) => `${g} = ${fmt(simbolo(acordes.find((a) => a.id === g)!, 'triade'))}`).join(', ')}.`);
  },

  'n3-pentatonica': (rng) => {
    const tonica = escolher(rng, ['C', 'G', 'F', 'D']);
    const escala = acordesDoTom({ tonica, modo: 'maior' })[0].escala.notas;
    const penta = [escala[0], escala[1], escala[2], escala[4], escala[5]];
    if (rng() < 0.5) {
      return {
        tipo: 'teclado',
        habilidade: 'n3-pentatonica',
        enunciado: `Clique as 5 notas da pentatônica maior de ${fmt(tonica)}.`,
        dica: 'Qualquer oitava vale. Clique as 5 teclas e depois em Responder.',
        conferencia: { tipo: 'classes', classes: penta.map(classe) },
        nomes: penta,
        explicacao: `Pentatônica maior de ${fmt(tonica)}: ${penta.map(fmt).join(' ')}. É a escala maior sem o 4º e o 7º graus (${fmt(escala[3])} e ${fmt(escala[6])}), as notas que formam semitom.`,
      };
    }
    return botoes('n3-pentatonica', 'Quais graus a pentatônica maior tira da escala maior?', rng, 'O 4º e o 7º', ['O 2º e o 6º', 'O 3º e o 7º', 'O 1º e o 5º'],
      'A pentatônica maior tira o 4º e o 7º graus, que formam semitom com a nota vizinha. Por isso quase nada soa "errado" nela. A menor tira o 2º e o 6º.');
  },
};

export function gerarPergunta(habilidade: string, rng: Aleatorio): Pergunta {
  const gerar = GERADORES[habilidade];
  if (!gerar) throw new Error(`Habilidade sem perguntas: ${habilidade}`);
  return gerar(rng);
}

export function temPerguntas(habilidade: string): boolean {
  return habilidade in GERADORES;
}

function mesmasClasses(midis: number[], classes: number[]): boolean {
  const dadas = new Set(midis.map((m) => m % 12));
  const pedidas = new Set(classes);
  return dadas.size === pedidas.size && [...pedidas].every((c) => dadas.has(c));
}

export function verificar(p: Pergunta, resposta: RespostaDada): boolean {
  if (p.tipo === 'botoes') return resposta === p.certa;
  if (!Array.isArray(resposta) || resposta.length === 0) return false;
  const c = p.conferencia;
  switch (c.tipo) {
    case 'uma-classe':
      return resposta.length === 1 && c.classes.includes(resposta[0] % 12);
    case 'classes':
      return resposta.length === c.classes.length && mesmasClasses(resposta, c.classes);
    case 'inversao':
      return resposta.length === 3 && mesmasClasses(resposta, c.classes) && Math.min(...resposta) % 12 === c.grave;
    case 'baixo-e-triade': {
      const esquerda = resposta.filter((m) => m < 60);
      const direita = resposta.filter((m) => m >= 60);
      return esquerda.length === 1 && esquerda[0] % 12 === c.baixo && direita.length === 3 && mesmasClasses(direita, c.classes);
    }
  }
}

/** A resposta certa em texto, com a grafia do tom (E♭, G, B♭ — nunca D♯, G, A♯). */
export function textoDaRespostaCerta(p: Pergunta): string {
  if (p.tipo === 'botoes') return p.certa;
  const nomes = p.nomes.map(fmt);
  switch (p.conferencia.tipo) {
    case 'uma-classe':
      return nomes.length === 1 ? nomes[0] : `qualquer uma destas: ${nomes.join(', ')}`;
    case 'classes':
      return nomes.join(', ');
    case 'inversao':
      return `${nomes.join(', ')} (com ${nomes[0]} embaixo)`;
    case 'baixo-e-triade':
      return `baixo ${nomes[0]} na mão esquerda + ${nomes.slice(1).join(', ')} na direita`;
  }
}

/** Nome de uma tecla na pergunta: a grafia das notas pedidas; nas outras, bemol se a pergunta usa bemóis. */
export function nomeDaTeclaNaPergunta(midi: number, p: Pergunta): string {
  if (p.tipo === 'teclado') {
    const pedida = p.nomes.find((n) => classe(n.split('/')[0]) === midi % 12);
    if (pedida) return fmt(pedida);
    if (p.nomes.some((n) => /^[A-G]b/.test(n))) return fmt(Note.pitchClass(Note.fromMidi(midi)));
  }
  return fmt(Note.pitchClass(Note.fromMidiSharps(midi)));
}

/** Uma resposta certa (para testes e para mostrar a solução). */
export function respostaCerta(p: Pergunta): RespostaDada {
  if (p.tipo === 'botoes') return p.certa;
  const c = p.conferencia;
  switch (c.tipo) {
    case 'uma-classe':
      return [60 + c.classes[0]];
    case 'classes':
      return c.classes.map((k) => 60 + k);
    case 'inversao': {
      const voz = vozesCandidatas(c.classes.map((k) => Note.pitchClass(Note.fromMidi(60 + k)))).find((v) => v.midis[0] % 12 === c.grave)!;
      return voz.midis;
    }
    case 'baixo-e-triade':
      return [48 + c.baixo, ...c.classes.map((k) => 60 + k)];
  }
}

export function respostaErrada(p: Pergunta): RespostaDada {
  if (p.tipo === 'botoes') return p.opcoes.find((o) => o !== p.certa)!;
  const certa = respostaCerta(p) as number[];
  const errada = [...certa];
  const i = p.conferencia.tipo === 'baixo-e-triade' ? 1 : 0;
  errada[i] = errada[i] + 1;
  if (p.conferencia.tipo === 'uma-classe' && p.conferencia.classes.includes(errada[0] % 12)) errada[0] += 1;
  return errada;
}
