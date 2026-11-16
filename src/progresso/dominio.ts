import { NIVEIS } from './niveis';

export interface Resposta {
  id: string;
  habilidade: string;
  acertou: boolean;
  /** Dia local do computador, AAAA-MM-DD. */
  data: string;
  /** Momento exato (ISO). */
  quando: string;
}

export type EstadoDaHabilidade = 'não começada' | 'praticando' | 'dominada';

const JANELA = 10;
const PARA_DOMINAR = 8;
const PARA_PERDER = 6;
const DIAS_MINIMOS = 2;

/** Dia local (não UTC): uma resposta às 23h30 conta no mesmo dia. */
export function dataLocal(d: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/**
 * Estado de uma habilidade a partir das respostas dela, na ordem em que foram dadas.
 * Dominada: pelo menos 8 acertos nas últimas 10, com acertos em pelo menos 2 dias diferentes.
 * Volta para "praticando" quando os acertos nas últimas 10 caem abaixo de 6.
 */
export function estadoDaHabilidade(respostas: Resposta[]): EstadoDaHabilidade {
  let estado: EstadoDaHabilidade = 'não começada';
  respostas.forEach((_, i) => {
    const janela = respostas.slice(Math.max(0, i + 1 - JANELA), i + 1);
    const acertos = janela.filter((r) => r.acertou);
    const dias = new Set(acertos.map((r) => r.data)).size;
    if (estado !== 'dominada' && acertos.length >= PARA_DOMINAR && dias >= DIAS_MINIMOS) estado = 'dominada';
    else if (estado === 'dominada' && acertos.length < PARA_PERDER) estado = 'praticando';
    else if (estado === 'não começada') estado = 'praticando';
  });
  return estado;
}

export function respostasDa(habilidade: string, respostas: Resposta[]): Resposta[] {
  return respostas.filter((r) => r.habilidade === habilidade);
}

export function acertosRecentes(habilidade: string, respostas: Resposta[]): { acertos: number; total: number } {
  const ultimas = respostasDa(habilidade, respostas).slice(-JANELA);
  return { acertos: ultimas.filter((r) => r.acertou).length, total: ultimas.length };
}

/** Primeiro nível que ainda tem habilidade não dominada. */
export function nivelAtual(respostas: Resposta[]): number {
  for (const nivel of NIVEIS) {
    if (nivel.habilidades.some((h) => estadoDaHabilidade(respostasDa(h.id, respostas)) !== 'dominada')) return nivel.numero;
  }
  return NIVEIS[NIVEIS.length - 1].numero;
}
