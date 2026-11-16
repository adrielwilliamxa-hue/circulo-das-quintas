import { gerarMarkdown, juntar, lerMarkdown } from './arquivo';
import type { Resposta } from './dominio';

export type EstadoGravacao = 'carregando' | 'salvo-no-vault' | 'so-no-navegador' | 'arquivo-ilegivel';

export interface Api {
  /** `versao` identifica o conteúdo atual do arquivo (o ETag do servidor). */
  get(): Promise<{ status: number; texto?: string; versao?: string }>;
  /** Grava só se o arquivo ainda estiver na `versao` lida (null = arquivo ainda não existe). */
  put(texto: string, versao: string | null): Promise<'ok' | 'conflito' | 'falha'>;
}

export interface Armazenamento {
  ler(): string | null;
  gravar(texto: string): void;
}

/** API do servidor local (§6.10): GET/PUT do Markdown de progresso, com controle de versão. */
export const apiDoServidor: Api = {
  async get() {
    const resposta = await fetch('/api/progresso', { cache: 'no-store' });
    return {
      status: resposta.status,
      texto: resposta.ok ? await resposta.text() : undefined,
      versao: resposta.headers.get('ETag') ?? undefined,
    };
  },
  async put(texto, versao) {
    const resposta = await fetch('/api/progresso', {
      method: 'PUT',
      headers: { 'Content-Type': 'text/markdown; charset=utf-8', ...(versao === null ? { 'If-None-Match': '*' } : { 'If-Match': versao }) },
      body: texto,
    });
    if (resposta.ok) return 'ok';
    return resposta.status === 409 || resposta.status === 412 ? 'conflito' : 'falha';
  },
};

export const navegador: Armazenamento = {
  ler() {
    try {
      return localStorage.getItem('circulo-progresso');
    } catch {
      return null;
    }
  },
  gravar(texto) {
    try {
      localStorage.setItem('circulo-progresso', texto);
    } catch {
      /* sem armazenamento no navegador: o vault continua sendo a fonte */
    }
  },
};

function lerLocal(local: Armazenamento): Resposta[] {
  try {
    const dados = JSON.parse(local.ler() ?? '[]');
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

const TENTATIVAS = 3;

/**
 * Grava sem nunca perder respostas: junta memória + navegador + o que já está no vault e só então grava,
 * exigindo que o arquivo não tenha mudado desde a leitura. Se outra aba gravou no meio, lê e junta de novo.
 * Um arquivo ilegível nunca é sobrescrito.
 */
export async function salvarProgresso(
  memoria: Resposta[],
  api: Api,
  local: Armazenamento,
  arquivoIlegivel: boolean,
): Promise<{ estado: EstadoGravacao; respostas: Resposta[] }> {
  let respostas = juntar(memoria, lerLocal(local));
  local.gravar(JSON.stringify(respostas));
  if (arquivoIlegivel) return { estado: 'arquivo-ilegivel', respostas };
  try {
    for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
      const { status, texto, versao } = await api.get();
      let versaoLida: string | null = null;
      if (status === 200 && texto !== undefined) {
        const lido = lerMarkdown(texto);
        if (!lido.ok) return { estado: 'arquivo-ilegivel', respostas };
        respostas = juntar(lido.respostas, respostas);
        versaoLida = versao ?? null;
      } else if (status !== 404) {
        return { estado: 'so-no-navegador', respostas };
      }
      local.gravar(JSON.stringify(respostas));
      const resultado = await api.put(gerarMarkdown(respostas, new Date()), versaoLida);
      if (resultado === 'ok') return { estado: 'salvo-no-vault', respostas };
      if (resultado === 'falha') return { estado: 'so-no-navegador', respostas };
    }
  } catch {
    /* rede ou servidor fora: o progresso fica no navegador */
  }
  return { estado: 'so-no-navegador', respostas };
}

/** Ao abrir: lê o vault e junta com o navegador e com o que já está na memória da tela. */
export async function carregarProgresso(
  api: Api,
  local: Armazenamento,
  memoria: Resposta[],
): Promise<{ respostas: Resposta[]; estado: EstadoGravacao; erro?: string }> {
  const daqui = juntar(memoria, lerLocal(local));
  try {
    const { status, texto } = await api.get();
    if (status === 404) {
      if (!daqui.length) return { respostas: daqui, estado: 'salvo-no-vault' };
      return salvarProgresso(daqui, api, local, false);
    }
    if (status !== 200 || texto === undefined) return { respostas: daqui, estado: 'so-no-navegador' };
    const lido = lerMarkdown(texto);
    if (!lido.ok) return { respostas: daqui, estado: 'arquivo-ilegivel', erro: lido.erro };
    const respostas = juntar(lido.respostas, daqui);
    if (respostas.length > lido.respostas.length) return salvarProgresso(respostas, api, local, false);
    local.gravar(JSON.stringify(respostas));
    return { respostas, estado: 'salvo-no-vault' };
  } catch {
    return { respostas: daqui, estado: 'so-no-navegador' };
  }
}
