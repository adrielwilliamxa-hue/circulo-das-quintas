import { Key } from 'tonal';
import { classe } from './notas';
import { acordesDoTom, relativaMaior, simbolo, TONS_MAIORES, TONS_MENORES } from './tons';
import type { Modo, Tom } from './tipos';

export type Anel = 'dentro' | 'meio' | 'fora';

/** Centro e raios do desenho (rascunho 2). */
export const CENTRO = 150;
export const RAIOS = { furo: 55, dentro: 95, meio: 125, fora: 148 } as const;
export const RAIO_DO_ROTULO: Record<Anel, number> = { dentro: 75, meio: 110, fora: 137 };

/** Fatia do círculo (0 = C no topo, 1 = G…) onde o tom fica. */
export function indiceDoTom(tom: Tom): number {
  return (classe(relativaMaior(tom)) * 7) % 12;
}

export function tomDaFatia(k: number, anel: Anel, modoAtual: Modo): Tom {
  const modo: Modo = anel === 'dentro' ? 'maior' : anel === 'meio' ? 'menor' : modoAtual;
  return { tonica: modo === 'maior' ? TONS_MAIORES[k] : TONS_MENORES[k], modo };
}

export interface Celula {
  anel: Anel;
  posicao: number;
  grauId: string;
}

export function celulasDaJanela(k: number, modo: Modo): Celula[] {
  const p = (d: number) => (k + d + 12) % 12;
  const [dentro, meio, fora] =
    modo === 'maior' ? [['IV', 'I', 'V'], ['ii', 'vi', 'iii'], 'vii°'] : [['VI', 'III', 'VII'], ['iv', 'i', 'v'], 'ii°'];
  return [
    ...(dentro as string[]).map((grauId, i) => ({ anel: 'dentro' as const, posicao: p(i - 1), grauId })),
    ...(meio as string[]).map((grauId, i) => ({ anel: 'meio' as const, posicao: p(i - 1), grauId })),
    { anel: 'fora', posicao: p(0), grauId: fora as string },
  ];
}

export function rotulosDosAneis(): { maiores: string[]; menores: string[]; diminutos: string[] } {
  return {
    maiores: TONS_MAIORES.map((t) => (t === 'F#' ? 'F#/Gb' : t)),
    menores: TONS_MENORES.map((t) => (t === 'Eb' ? 'D#m/Ebm' : `${t}m`)),
    diminutos: TONS_MAIORES.map((t) => `${Key.majorKey(t).scale[6]}°`),
  };
}

/** Texto de uma fatia: dentro da janela, a cifra do acorde do tom (grafia certa); fora dela, o rótulo do anel. */
export function textoDaFatia(anel: Anel, posicao: number, tom: Tom): string {
  const celula = celulasDaJanela(indiceDoTom(tom), tom.modo).find((c) => c.anel === anel && c.posicao === posicao);
  if (celula) return simbolo(acordesDoTom(tom).find((a) => a.id === celula.grauId)!, 'triade');
  const rotulos = rotulosDosAneis();
  return { dentro: rotulos.maiores, meio: rotulos.menores, fora: rotulos.diminutos }[anel][posicao];
}

/** Ponto no círculo: ângulo em graus a partir do topo, no sentido horário. */
export function ponto(raio: number, angulo: number): { x: number; y: number } {
  const rad = (angulo * Math.PI) / 180;
  return { x: CENTRO + raio * Math.sin(rad), y: CENTRO - raio * Math.cos(rad) };
}

const n = (x: number) => String(Number(x.toFixed(2)));
const xy = (raio: number, angulo: number) => {
  const { x, y } = ponto(raio, angulo);
  return `${n(x)} ${n(y)}`;
};

/** Caminho SVG de um pedaço de anel entre dois raios e dois ângulos. */
export function setor(r1: number, r2: number, a1: number, a2: number): string {
  return `M${xy(r2, a1)} A${r2} ${r2} 0 0 1 ${xy(r2, a2)} L${xy(r1, a2)} A${r1} ${r1} 0 0 0 ${xy(r1, a1)} Z`;
}

/** Novo ângulo da janela indo pelo caminho mais curto até a fatia `k`. */
export function anguloDaJanela(atual: number, k: number): number {
  const delta = ((((30 * k - atual) % 360) + 540) % 360) - 180;
  return atual + delta;
}
