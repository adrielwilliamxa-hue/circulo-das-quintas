/** Geometria do teclado do rascunho 2: três oitavas, de C3 (48) a B5 (83). */
export const PRIMEIRA = 48;
export const ULTIMA = 83;
export const BRANCA = { largura: 31, altura: 138 } as const;
export const PRETA = { largura: 20, altura: 84 } as const;
export const LARGURA_OITAVA = 217;
export const LARGURA_TECLADO = 651;

const DESLOCAMENTO_DA_PRETA: Record<number, number> = { 1: 21, 3: 52, 6: 114, 8: 145, 10: 176 };
const INDICE_DA_BRANCA: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };

export interface Tecla {
  midi: number;
  preta: boolean;
  x: number;
  largura: number;
  altura: number;
}

export function tecla(midi: number): Tecla {
  const oitava = Math.floor((midi - PRIMEIRA) / 12);
  const classe = midi % 12;
  const base = oitava * LARGURA_OITAVA;
  if (classe in DESLOCAMENTO_DA_PRETA) {
    return { midi, preta: true, x: base + DESLOCAMENTO_DA_PRETA[classe], largura: PRETA.largura, altura: PRETA.altura };
  }
  return { midi, preta: false, x: base + INDICE_DA_BRANCA[classe] * BRANCA.largura, largura: BRANCA.largura, altura: BRANCA.altura };
}

export function teclas(): Tecla[] {
  return Array.from({ length: ULTIMA - PRIMEIRA + 1 }, (_, i) => tecla(PRIMEIRA + i));
}

export function centroX(midi: number): number {
  const t = tecla(midi);
  return t.x + t.largura / 2;
}
