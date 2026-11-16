import { Note } from 'tonal';

/** Classe da nota de 0 (C) a 11 (B). */
export function classe(nota: string): number {
  return Note.chroma(nota) ?? 0;
}

/** Distância em meias-teclas subindo de `de` até `ate`, entre 0 e 11. */
export function meiasTeclas(de: string, ate: string): number {
  return (classe(ate) - classe(de) + 12) % 12;
}

/** Troca b e # pelos símbolos ♭ e ♯ nas notas de um nome (inclusive depois de uma barra). */
export function fmt(texto: string): string {
  return texto.replace(/(^|\/)([A-G])([b#]*)/g, (_, inicio: string, letra: string, acidentes: string) =>
    inicio + letra + acidentes.replace(/b/g, '♭').replace(/#/g, '♯'),
  );
}

/** Menor número MIDI com a classe da nota que seja maior ou igual a `minimo`. */
export function midiAPartirDe(nota: string, minimo: number): number {
  return minimo + ((classe(nota) - (minimo % 12) + 12) % 12);
}
