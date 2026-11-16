import type { Modo } from './tipos';

export interface Progressao {
  id: string;
  nome: string;
  modo: Modo;
  /** Graus pelo `id` de `acordesDoTom`, um por compasso. */
  graus: string[];
}

/** Progressões prontas do loop (§7.7 do design). Sequências de graus não pertencem a ninguém. */
export const PROGRESSOES: Progressao[] = [
  { id: 'pop', nome: 'Pop (I–V–vi–IV)', modo: 'maior', graus: ['I', 'V', 'vi', 'IV'] },
  { id: 'anos50', nome: 'Anos 50 (I–vi–IV–V)', modo: 'maior', graus: ['I', 'vi', 'IV', 'V'] },
  { id: 'classica', nome: 'Clássica (I–IV–V–I)', modo: 'maior', graus: ['I', 'IV', 'V', 'I'] },
  { id: 'twofive', nome: 'Two-Five-One (ii–V–I)', modo: 'maior', graus: ['ii', 'V', 'I', 'I'] },
  { id: 'soulful', nome: 'Soulful (I–V–vi)', modo: 'maior', graus: ['I', 'V', 'vi', 'vi'] },
  { id: 'triste', nome: 'Triste (i–VII–VI)', modo: 'menor', graus: ['i', 'VII', 'VI', 'VI'] },
  { id: 'sombria', nome: 'Sombria, hip-hop (i–iv)', modo: 'menor', graus: ['i', 'iv', 'i', 'iv'] },
  { id: 'hipnotica', nome: 'Hipnótica, trap (i–VI)', modo: 'menor', graus: ['i', 'VI', 'i', 'VI'] },
  { id: 'skinny', nome: 'Inspirada em Skinny Love (i–III–iv–i)', modo: 'menor', graus: ['i', 'III', 'iv', 'i'] },
];

export function progressoesDoModo(modo: Modo): Progressao[] {
  return PROGRESSOES.filter((p) => p.modo === modo);
}
