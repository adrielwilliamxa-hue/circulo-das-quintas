import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { dataLocal, type Resposta } from './dominio';
import { apiDoServidor, carregarProgresso, navegador, salvarProgresso, type Api, type Armazenamento, type EstadoGravacao } from './salvar';
import { gerarMarkdown, juntar } from './arquivo';

interface EstadoProgresso {
  respostas: Resposta[];
  gravacao: EstadoGravacao;
  erro?: string;
  carregar(): Promise<void>;
  registrar(habilidade: string, acertou: boolean): Promise<void>;
  exportar(): void;
}

export function criarLojaProgresso(api: Api, local: Armazenamento) {
  /** Só grava depois que a leitura inicial do vault terminou (evita sobrescrever o que ainda não foi lido). */
  let leitura: Promise<void> = Promise.resolve();

  return createStore<EstadoProgresso>()((set, get) => ({
    respostas: [],
    gravacao: 'carregando',
    carregar() {
      leitura = (async () => {
        const { respostas, estado, erro } = await carregarProgresso(api, local, get().respostas);
        set({ respostas: juntar(respostas, get().respostas), gravacao: estado, erro });
      })();
      return leitura;
    },
    async registrar(habilidade, acertou) {
      const agora = new Date();
      const nova: Resposta = {
        id: `${agora.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        habilidade,
        acertou,
        data: dataLocal(agora),
        quando: agora.toISOString(),
      };
      set({ respostas: [...get().respostas, nova] });
      await leitura;
      const { estado, respostas } = await salvarProgresso(get().respostas, api, local, get().gravacao === 'arquivo-ilegivel');
      set({ respostas: juntar(respostas, get().respostas), gravacao: estado });
    },
    exportar() {
      const texto = gerarMarkdown(get().respostas, new Date());
      const url = URL.createObjectURL(new Blob([texto], { type: 'text/markdown;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'App Círculo das Quintas - Progresso.md';
      link.click();
      URL.revokeObjectURL(url);
    },
  }));
}

export const lojaProgresso = criarLojaProgresso(apiDoServidor, navegador);

export function useProgresso<T>(seletor: (s: EstadoProgresso) => T): T {
  return useStore(lojaProgresso, seletor);
}
