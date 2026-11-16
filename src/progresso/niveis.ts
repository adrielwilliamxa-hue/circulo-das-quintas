export interface Habilidade {
  id: string;
  nome: string;
}

export interface Nivel {
  numero: number;
  nome: string;
  /** Versão do app em que os testes deste nível entram. */
  versao: '0.5' | '1.0' | '2.0';
  habilidades: Habilidade[];
}

/** Mapa de 7 níveis aprovado em 23/10/2026 (§6.10 do design). */
export const NIVEIS: Nivel[] = [
  {
    numero: 1,
    nome: 'Iniciante',
    versao: '0.5',
    habilidades: [
      { id: 'n1-notas', nome: 'Achar as notas no teclado' },
      { id: 'n1-tom-semitom', nome: 'Tom e semitom' },
      { id: 'n1-tempos', nome: 'Tempo forte e tempo fraco' },
      { id: 'n1-triade', nome: 'Montar tríade maior e menor' },
      { id: 'n1-baixo-triade', nome: 'Baixo na esquerda + tríade na direita' },
    ],
  },
  {
    numero: 2,
    nome: 'Iniciante+',
    versao: '0.5',
    habilidades: [
      { id: 'n2-intervalos', nome: 'Intervalos' },
      { id: 'n2-escalas', nome: 'Escala maior em Dó, Sol e Fá' },
      { id: 'n2-circulo', nome: 'Ler o círculo (armadura, relativa, vizinhos)' },
      { id: 'n2-campo', nome: 'Os 7 acordes do tom maior' },
      { id: 'n2-inversoes', nome: 'Inversões e dedilhado' },
    ],
  },
  {
    numero: 3,
    nome: 'Do iniciante ao intermediário',
    versao: '0.5',
    habilidades: [
      { id: 'n3-funcoes', nome: 'Função de cada acorde (casa, sair, voltar)' },
      { id: 'n3-cadencias', nome: 'Cadências' },
      { id: 'n3-menor', nome: 'Tom menor: escala e acordes' },
      { id: 'n3-tempo-forte', nome: 'Nota do acorde no tempo forte' },
      { id: 'n3-progressoes', nome: 'Progressões comuns' },
      { id: 'n3-pentatonica', nome: 'Pentatônica' },
    ],
  },
  {
    numero: 4,
    nome: 'Intermediário básico',
    versao: '1.0',
    habilidades: [
      { id: 'n4-tetrades', nome: 'Tétrades (7M, m7, 7, m7(♭5))' },
      { id: 'n4-tritono', nome: 'Trítono e por que o V7 resolve' },
      { id: 'n4-dominante-secundario', nome: 'Dominante secundário (ponte)' },
      { id: 'n4-two-five', nome: 'Two-five-one' },
      { id: 'n4-tensao-passagem', nome: 'Notas de tensão e de passagem' },
      { id: 'n4-menor-harmonica', nome: 'Menor harmônica e melódica' },
    ],
  },
  {
    numero: 5,
    nome: 'Intermediário avançado',
    versao: '1.0',
    habilidades: [
      { id: 'n5-subv7', nome: 'SubV7' },
      { id: 'n5-v7sus4', nome: 'V7sus4' },
      { id: 'n5-estendidos', nome: 'Dominantes estendidos' },
      { id: 'n5-diminutos', nome: 'Diminutos de preparação' },
      { id: 'n5-aproximacoes', nome: 'Aproximações' },
      { id: 'n5-emprestimo', nome: 'Empréstimo modal' },
      { id: 'n5-linhas-internas', nome: 'Linhas internas' },
      { id: 'n5-escalas-menor', nome: 'Escalas de acorde do tom menor' },
    ],
  },
  {
    numero: 6,
    nome: 'Avançado básico',
    versao: '2.0',
    habilidades: [
      { id: 'n6-modos', nome: 'Modos gregos e harmonia modal' },
      { id: 'n6-escalas-dominantes', nome: 'Escalas para dominantes (Mixo ♭9 ♭13, Alterada…)' },
      { id: 'n6-extensoes', nome: 'Extensões (9ª, 11ª, 13ª) e voicings' },
    ],
  },
  {
    numero: 7,
    nome: 'Avançado',
    versao: '2.0',
    habilidades: [
      { id: 'n7-rearmonizar', nome: 'Rearmonizar uma progressão' },
      { id: 'n7-ritmo', nome: 'Quiálteras e compassos irregulares' },
      { id: 'n7-compor', nome: 'Compor progressão + melodia a partir de um clima' },
    ],
  },
];

export function habilidadePorId(id: string): Habilidade | undefined {
  return NIVEIS.flatMap((n) => n.habilidades).find((h) => h.id === id);
}

export function nivelDaHabilidade(id: string): Nivel | undefined {
  return NIVEIS.find((n) => n.habilidades.some((h) => h.id === id));
}
