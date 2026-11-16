import { Key, Note } from 'tonal';
import { fmt, meiasTeclas } from './notas';
import type { AcordeDoTom, Tom } from './tipos';

export interface Ponte {
  simbolo: string;
  notas: string[];
  escala: string;
  /** Notas da escala para improvisar sobre a ponte, a partir da fundamental. */
  notasDaEscala: string[];
  texto: string;
  /** O acorde-alvo é a tônica: a ponte é o dominante do próprio tom. */
  primario: boolean;
}

const LETRAS = 'CDEFGAB';

/**
 * Regra da Berklee: a escala do dominante usa as notas do acorde e, nos outros graus (9ª, 11ª e 13ª),
 * as notas do tom (escala maior, ou menor natural). O nome sai da 9ª e da 13ª que o tom fornece.
 */
function escalaPelaRegraDaBerklee(notas: string[], tom: Tom): { nome: string; notas: string[] } {
  const doTom = tom.modo === 'maior' ? Key.majorKey(tom.tonica).scale : Key.minorKey(tom.tonica).natural.scale;
  const raiz = notas[0];
  const doTomNaLetra = (passos: number) => doTom.find((n) => n[0] === LETRAS[(LETRAS.indexOf(raiz[0]) + passos) % 7])!;
  const escala = [raiz, doTomNaLetra(1), notas[1], doTomNaLetra(3), notas[2], doTomNaLetra(5), notas[3]];
  const alteracoes = [meiasTeclas(raiz, escala[1]) === 1 && '♭9', meiasTeclas(raiz, escala[5]) === 8 && '♭13'].filter(Boolean);
  return { nome: alteracoes.length ? `Mixo ${alteracoes.join(' ')}` : 'Mixolídia', notas: escala };
}

/**
 * O acorde que prepara a chegada no alvo: um dominante (maior com 7ª menor) uma 5ª justa acima.
 * Acordes diminutos não recebem ponte.
 */
export function ponteDe(alvo: AcordeDoTom, tom: Tom): Ponte | null {
  if (alvo.qualidade === 'diminuta') return null;
  const raiz = Note.transpose(alvo.fundamental, '5P');
  const notas = [raiz, Note.transpose(raiz, '3M'), Note.transpose(raiz, '5P'), Note.transpose(raiz, '7m')];
  const escala = escalaPelaRegraDaBerklee(notas, tom);
  const simbolo = `${raiz}7`;
  return {
    simbolo,
    notas,
    escala: escala.nome,
    notasDaEscala: escala.notas,
    texto:
      `A 3ª do ${fmt(simbolo)} (${fmt(notas[1])}) fica meio tom abaixo do ${fmt(alvo.fundamental)} e sobe até ele; ` +
      `a 7ª (${fmt(notas[3])}) desce até o ${fmt(alvo.triade[1])}.`,
    primario: alvo.id === 'I' || (tom.modo === 'menor' && alvo.id === 'i'),
  };
}

/** Notas da escala para improvisar sobre a ponte. */
export function escalaDaPonte(ponte: Ponte): string[] {
  return ponte.notasDaEscala;
}
