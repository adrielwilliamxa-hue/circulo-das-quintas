import { classe, meiasTeclas, midiAPartirDe } from './notas';
import type { AcordeDoTom, BaixoOpcao, Formato, Inversao } from './tipos';

export const MAO_DIREITA = { min: 60, max: 83 } as const;
export const MAO_ESQUERDA = { min: 48, max: 59 } as const;

export interface Voz {
  midis: number[];
  inversao: Inversao;
}

/** Empilha as notas subindo a partir de `inicio`, cada uma acima da anterior. */
function empilhar(notas: string[], inicio: number): number[] {
  const midis = [inicio];
  for (const nota of notas.slice(1)) {
    const anterior = midis[midis.length - 1];
    midis.push(anterior + ((classe(nota) - (anterior % 12) + 12) % 12 || 12));
  }
  return midis;
}

/** Todas as tríades fechadas (fundamental, 1ª e 2ª inversão) que cabem na região da mão direita. */
export function vozesCandidatas(triade: string[]): Voz[] {
  const candidatas: Voz[] = [];
  ([0, 1, 2] as Inversao[]).forEach((inversao) => {
    const ordem = [...triade.slice(inversao), ...triade.slice(0, inversao)];
    for (let inicio = midiAPartirDe(ordem[0], MAO_DIREITA.min); inicio <= MAO_DIREITA.max; inicio += 12) {
      const midis = empilhar(ordem, inicio);
      if (midis[midis.length - 1] <= MAO_DIREITA.max) candidatas.push({ midis, inversao });
    }
  });
  return candidatas;
}

function distancia(a: number[], b: number[]): number {
  return a.reduce((soma, nota, i) => soma + Math.abs(nota - b[i]), 0);
}

/** A voz que menos move os dedos em relação ao acorde anterior; sem anterior, a fundamental a partir do C4. */
export function vozMaisProxima(triade: string[], anterior: number[] | null): Voz {
  if (!anterior) return { midis: empilhar(triade, midiAPartirDe(triade[0], MAO_DIREITA.min)), inversao: 0 };
  if (anterior.length !== triade.length) {
    // Voz anterior com 2 notas (só a quinta) ou 4 (tétrade): compara pelo centro das notas.
    const centro = (m: number[]) => m.reduce((s, n) => s + n, 0) / m.length;
    return vozesCandidatas(triade)
      .map((voz) => ({ voz, custo: Math.abs(centro(voz.midis) - centro(anterior)), base: voz.midis[0] }))
      .sort((a, b) => a.custo - b.custo || a.base - b.base)[0].voz;
  }
  return vozesCandidatas(triade)
    .map((voz) => ({ voz, custo: distancia(voz.midis, anterior), base: voz.midis[0] }))
    .sort((a, b) => a.custo - b.custo || a.base - b.base)[0].voz;
}

/** Vozes de um loop: calcula duas voltas e usa a segunda, para o 1º acorde ficar perto do último. */
export function vozesDoLoop(triades: string[][]): Voz[] {
  let anterior: number[] | null = null;
  const primeira = triades.map((t) => {
    const voz = vozMaisProxima(t, anterior);
    anterior = voz.midis;
    return voz;
  });
  anterior = primeira[primeira.length - 1].midis;
  return triades.map((t) => {
    const voz = vozMaisProxima(t, anterior);
    anterior = voz.midis;
    return voz;
  });
}

/** Notas da mão direita para o formato escolhido; a inversão só vale para a tríade. */
export function vozDoFormato(acorde: AcordeDoTom, formato: Formato, inversao: Inversao): number[] {
  const inicio = midiAPartirDe(acorde.fundamental, MAO_DIREITA.min);
  if (formato === 'tetrade') return empilhar(acorde.tetrade, inicio);
  if (formato === 'quinta') return [inicio, inicio + meiasTeclas(acorde.fundamental, acorde.triade[2])];
  return vozesCandidatas(acorde.triade).find((v) => v.inversao === inversao)!.midis;
}

export function baixo(acorde: AcordeDoTom, opcao: BaixoOpcao): number {
  const nota = { fundamental: acorde.triade[0], terca: acorde.triade[1], quinta: acorde.triade[2] }[opcao];
  return midiAPartirDe(nota, MAO_ESQUERDA.min);
}

export function dedilhado(formato: Formato, inversao: Inversao): { direita: string; esquerda: string } {
  if (formato === 'tetrade') return { direita: '1-2-3-5', esquerda: '5-3-2-1' };
  if (formato === 'quinta') return { direita: '1-5', esquerda: '5-1' };
  return [
    { direita: '1-3-5', esquerda: '5-3-1' },
    { direita: '1-2-5', esquerda: '5-3-1' },
    { direita: '1-3-5', esquerda: '5-2-1' },
  ][inversao];
}

const PAPEIS = ['fundamental', '3ª', '5ª', '7ª'];

export function montagem(acorde: AcordeDoTom, formato: Formato): { nota: string; papel: string; meiasTeclas: number }[] {
  const indices = formato === 'quinta' ? [0, 2] : formato === 'tetrade' ? [0, 1, 2, 3] : [0, 1, 2];
  return indices.map((i) => ({
    nota: acorde.tetrade[i],
    papel: PAPEIS[i],
    meiasTeclas: meiasTeclas(acorde.fundamental, acorde.tetrade[i]),
  }));
}
