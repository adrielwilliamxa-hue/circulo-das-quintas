import type { Funcao } from '../cerebro/tipos';

/** Paleta Okabe-Ito em tons claros (§8): cada cor tem um único significado no app inteiro. */
export const COR: Record<Funcao, { fundo: string; borda: string; texto: string }> = {
  casa: { fundo: '#CDE9F8', borda: '#3A8FC7', texto: '#0C3B5E' },
  sair: { fundo: '#F2D7E6', borda: '#CC79A7', texto: '#5E1F40' },
  voltar: { fundo: '#F8E1B0', borda: '#E69F00', texto: '#5C3A00' },
};

export const NOME_DA_FUNCAO: Record<Funcao, string> = { casa: 'Casa', sair: 'Sair', voltar: 'Voltar' };
export const TERMO_DA_FUNCAO: Record<Funcao, string> = { casa: 'tônica', sair: 'subdominante', voltar: 'dominante' };
export const RESUMO_DA_FUNCAO: Record<Funcao, string> = {
  casa: 'Repouso',
  sair: 'Afasta de casa',
  voltar: 'Tensão, quer voltar',
};
