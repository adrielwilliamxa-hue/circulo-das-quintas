import type { Funcao } from '../cerebro/tipos';
import { tecla } from './geometriaTeclado';

export interface VozDaChuva {
  midis: number[];
  baixo: number;
  funcao: Funcao;
}

export interface Bloco {
  compasso: number;
  midi: number;
  baixo: boolean;
  funcao: Funcao;
  x: number;
  largura: number;
  y: number;
  altura: number;
}

/** Quantos compassos aparecem acima do teclado. */
export const COMPASSOS_VISIVEIS = 2;

/**
 * Blocos que aparecem na chuva. `posicao` é o tempo do loop em compassos (0,5 = metade do 1º compasso).
 * Cada acorde ocupa um compasso e chega ao teclado (fundo da área) quando começa a soar.
 */
export function blocosVisiveis(posicao: number, vozes: VozDaChuva[], alturaPx: number, porTempo: boolean): Bloco[] {
  const agora = porTempo ? Math.floor(posicao * 4) / 4 : posicao;
  const porCompasso = alturaPx / COMPASSOS_VISIVEIS;
  const blocos: Bloco[] = [];
  for (let m = Math.floor(agora); m <= Math.floor(agora) + COMPASSOS_VISIVEIS; m++) {
    const voz = vozes[((m % vozes.length) + vozes.length) % vozes.length];
    const base = alturaPx - (m - agora) * porCompasso;
    const y = base - porCompasso;
    if (base <= 0 || y >= alturaPx) continue;
    for (const midi of [voz.baixo, ...voz.midis]) {
      const t = tecla(midi);
      blocos.push({ compasso: m, midi, baixo: midi === voz.baixo, funcao: voz.funcao, x: t.x, largura: t.largura, y, altura: porCompasso });
    }
  }
  return blocos;
}
