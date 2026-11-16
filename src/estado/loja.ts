import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { acordesDoTom, formatosDoAcorde } from '../cerebro/tons';
import { PROGRESSOES, progressoesDoModo } from '../cerebro/progressoes';
import { baixo, vozDoFormato, vozMaisProxima, vozesDoLoop, type Voz } from '../cerebro/vozes';
import type { AcordeDoTom, BaixoOpcao, Formato, Inversao, Tom } from '../cerebro/tipos';

export type Aba = 'estudo' | 'pratica' | 'testes';
export type Mostrar = 'acorde' | 'tensao' | 'tudo';

export interface Estado {
  aba: Aba;
  tom: Tom;
  tomPendente: Tom | null;
  selecionadoId: string;
  formato: Formato;
  inversaoManual: Inversao | null;
  baixoOpcao: BaixoOpcao;
  /** Voz da mão direita do acorde selecionado antes (para escolher a inversão mais perto). */
  vozAnterior: number[] | null;
  progressaoId: string;
  /** Progressão escolhida com o loop tocando: entra no início do próximo compasso. */
  progressaoPendente: string | null;
  tocando: boolean;
  bpm: number;
  metronomo: boolean;
  volume: number;
  mostrar: Mostrar;
  posicao: { compasso: number; tempo: number };
  nomesNasTeclas: boolean;
  dedilhadoVisivel: boolean;
  movimentoPorTempo: boolean;
  teclaFalada: string | null;
  estadoSom: 'desligado' | 'carregando' | 'pronto' | 'sintetizado';

  setAba(aba: Aba): void;
  escolherTom(tom: Tom): void;
  /** Aplica o tom e a progressão que esperavam o início do compasso. */
  aplicarPendentes(): void;
  selecionarAcorde(id: string): void;
  escolherFormato(formato: Formato): void;
  escolherInversao(inversao: Inversao): void;
  escolherBaixo(opcao: BaixoOpcao): void;
  escolherProgressao(id: string): void;
  setTocando(tocando: boolean): void;
  setBpm(bpm: number): void;
  setMetronomo(ligado: boolean): void;
  setVolume(volume: number): void;
  setMostrar(mostrar: Mostrar): void;
  setPosicao(posicao: { compasso: number; tempo: number }): void;
  setNomesNasTeclas(ligado: boolean): void;
  setDedilhadoVisivel(ligado: boolean): void;
  setMovimentoPorTempo(ligado: boolean): void;
  setTeclaFalada(frase: string | null): void;
  setEstadoSom(estado: Estado['estadoSom']): void;
}

type Dados = Omit<Estado, { [K in keyof Estado]: Estado[K] extends (...args: never[]) => void ? K : never }[keyof Estado]>;

function prefereMenosMovimento(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function progressaoAtual(s: Dados) {
  return PROGRESSOES.find((p) => p.id === s.progressaoId)!;
}

/** Os acordes do loop, na ordem dos compassos. */
export function acordesDoLoop(s: Dados): AcordeDoTom[] {
  const acordes = acordesDoTom(s.tom);
  return progressaoAtual(s).graus.map((g) => acordes.find((a) => a.id === g)!);
}

export function vozesDoLoopAtual(s: Dados): Voz[] {
  return vozesDoLoop(acordesDoLoop(s).map((a) => a.triade));
}

export function acordeEmFoco(s: Dados): AcordeDoTom {
  if (s.tocando) return acordesDoLoop(s)[s.posicao.compasso % progressaoAtual(s).graus.length];
  return acordesDoTom(s.tom).find((a) => a.id === s.selecionadoId) ?? acordesDoTom(s.tom)[0];
}

export function formatoEmFoco(s: Dados): Formato {
  return s.tocando ? 'triade' : s.formato;
}

export function vozDaMaoDireita(s: Dados): Voz {
  const acorde = acordeEmFoco(s);
  if (s.tocando) return vozesDoLoopAtual(s)[s.posicao.compasso % progressaoAtual(s).graus.length];
  if (s.formato !== 'triade') return { midis: vozDoFormato(acorde, s.formato, 0), inversao: 0 };
  if (s.inversaoManual !== null) return { midis: vozDoFormato(acorde, 'triade', s.inversaoManual), inversao: s.inversaoManual };
  return vozMaisProxima(acorde.triade, s.vozAnterior);
}

export function baixoEmFoco(s: Dados): number {
  return baixo(acordeEmFoco(s), s.tocando ? 'fundamental' : s.baixoOpcao);
}

function aplicarTom(s: Dados, tom: Tom): Partial<Dados> {
  const mudouModo = tom.modo !== s.tom.modo;
  return {
    tom,
    tomPendente: null,
    selecionadoId: tom.modo === 'maior' ? 'I' : 'i',
    formato: 'triade',
    inversaoManual: null,
    baixoOpcao: 'fundamental',
    vozAnterior: null,
    progressaoId: mudouModo ? progressoesDoModo(tom.modo)[0].id : s.progressaoId,
  };
}

export function criarLoja() {
  return createStore<Estado>()((set, get) => ({
    aba: 'estudo',
    tom: { tonica: 'C', modo: 'maior' },
    tomPendente: null,
    selecionadoId: 'I',
    formato: 'triade',
    inversaoManual: null,
    baixoOpcao: 'fundamental',
    vozAnterior: null,
    progressaoId: 'pop',
    progressaoPendente: null,
    tocando: false,
    bpm: 70,
    metronomo: true,
    volume: 0.8,
    mostrar: 'acorde',
    posicao: { compasso: 0, tempo: 0 },
    nomesNasTeclas: true,
    dedilhadoVisivel: true,
    movimentoPorTempo: prefereMenosMovimento(),
    teclaFalada: null,
    estadoSom: 'desligado',

    setAba: (aba) => set({ aba }),
    escolherTom: (tom) => {
      if (get().tocando) set({ tomPendente: tom });
      else set(aplicarTom(get(), tom));
    },
    aplicarPendentes: () => {
      const { tomPendente, progressaoPendente } = get();
      if (tomPendente) set(aplicarTom(get(), tomPendente));
      if (progressaoPendente) {
        const progressao = PROGRESSOES.find((p) => p.id === progressaoPendente);
        // Uma progressão do outro modo (se o tom trocou de modo junto) perde a vez.
        set({ progressaoPendente: null, ...(progressao?.modo === get().tom.modo ? { progressaoId: progressaoPendente } : {}) });
      }
    },
    selecionarAcorde: (id) =>
      set({
        vozAnterior: vozDaMaoDireita(get()).midis,
        selecionadoId: id,
        formato: 'triade',
        inversaoManual: null,
        baixoOpcao: 'fundamental',
        teclaFalada: null,
      }),
    escolherFormato: (formato) => {
      if (formatosDoAcorde(acordeEmFoco(get())).includes(formato)) set({ formato });
    },
    escolherInversao: (inversao) => set({ inversaoManual: inversao }),
    escolherBaixo: (opcao) => set({ baixoOpcao: opcao }),
    escolherProgressao: (id) => {
      if (get().tocando) set({ progressaoPendente: id });
      else set({ progressaoId: id, progressaoPendente: null });
    },
    setTocando: (tocando) => {
      if (!tocando) get().aplicarPendentes();
      set({ tocando, posicao: { compasso: 0, tempo: 0 } });
    },
    setBpm: (bpm) => set({ bpm: Math.min(120, Math.max(40, Math.round(bpm))) }),
    setMetronomo: (metronomo) => set({ metronomo }),
    setVolume: (volume) => set({ volume }),
    setMostrar: (mostrar) => set({ mostrar }),
    setPosicao: (posicao) => set({ posicao }),
    setNomesNasTeclas: (nomesNasTeclas) => set({ nomesNasTeclas }),
    setDedilhadoVisivel: (dedilhadoVisivel) => set({ dedilhadoVisivel }),
    setMovimentoPorTempo: (movimentoPorTempo) => set({ movimentoPorTempo }),
    setTeclaFalada: (teclaFalada) => set({ teclaFalada }),
    setEstadoSom: (estadoSom) => set({ estadoSom }),
  }));
}

export const loja = criarLoja();

export function useLoja<T>(seletor: (s: Estado) => T): T {
  return useStore(loja, seletor);
}
