import { describe, expect, test, vi } from 'vitest';
import { carregarProgresso, salvarProgresso, type Api, type Armazenamento } from './salvar';
import { gerarMarkdown, lerMarkdown } from './arquivo';
import type { Resposta } from './dominio';

let contador = 0;
function resposta(): Resposta {
  contador++;
  const quando = new Date(Date.UTC(2026, 9, 23, 10, 0, contador)).toISOString();
  return { id: `r${contador}`, habilidade: 'n1-notas', acertou: true, data: '2026-10-23', quando };
}
const varias = (n: number) => Array.from({ length: n }, resposta);

function memoria(inicial: string | null = null): Armazenamento & { valor: string | null } {
  return {
    valor: inicial,
    ler() {
      return this.valor;
    },
    gravar(texto: string) {
      this.valor = texto;
    },
  };
}

/** Servidor falso com versão do arquivo (como o servidor real): PUT com versão velha = conflito. */
function servidorFalso(inicial: Resposta[] | null | string) {
  const estado = {
    texto: inicial === null ? null : typeof inicial === 'string' ? inicial : gerarMarkdown(inicial, new Date()),
    versao: 1,
    fora: false,
    puts: 0,
  };
  const api: Api = {
    async get() {
      if (estado.fora) return { status: 503 };
      return estado.texto === null ? { status: 404 } : { status: 200, texto: estado.texto, versao: String(estado.versao) };
    },
    async put(texto, versao) {
      estado.puts++;
      if (estado.fora) return 'falha';
      const atual = estado.texto === null ? null : String(estado.versao);
      if (versao !== atual) return 'conflito';
      estado.texto = texto;
      estado.versao++;
      return 'ok';
    },
  };
  const noVault = () => {
    const lido = estado.texto === null ? null : lerMarkdown(estado.texto);
    return lido && lido.ok ? lido.respostas.length : -1;
  };
  return { estado, api, noVault };
}

describe('gravação básica', () => {
  test('falha de rede: guarda no navegador e avisa', async () => {
    const local = memoria();
    const s = servidorFalso(null);
    s.estado.fora = true;
    const r = await salvarProgresso([resposta()], s.api, local, false);
    expect(r.estado).toBe('so-no-navegador');
    expect(JSON.parse(local.valor!)).toHaveLength(1);
  });

  test('arquivo ilegível marcado: não toca no vault', async () => {
    const s = servidorFalso(varias(3));
    const put = vi.spyOn(s.api, 'put');
    expect((await salvarProgresso([resposta()], s.api, memoria(), true)).estado).toBe('arquivo-ilegivel');
    expect(put).not.toHaveBeenCalled();
  });

  test('gravação normal vai para o vault', async () => {
    const s = servidorFalso(null);
    expect((await salvarProgresso([resposta()], s.api, memoria(), false)).estado).toBe('salvo-no-vault');
    expect(s.noVault()).toBe(1);
  });
});

describe('erro 1 — nunca perder respostas que já estão no vault', () => {
  test('Drive fora ao abrir: depois de 1 resposta o vault fica com 21, não com 1', async () => {
    const s = servidorFalso(varias(20));
    s.estado.fora = true;
    const local = memoria();
    const aberto = await carregarProgresso(s.api, local, []);
    expect(aberto).toMatchObject({ estado: 'so-no-navegador', respostas: [] });
    s.estado.fora = false;
    const r = await salvarProgresso([resposta()], s.api, local, false);
    expect(r.estado).toBe('salvo-no-vault');
    expect(s.noVault()).toBe(21);
    expect(r.respostas).toHaveLength(21);
  });

  test('duas abas: as respostas das duas ficam no vault', async () => {
    const s = servidorFalso(varias(20));
    const abaA = await carregarProgresso(s.api, memoria(), []);
    const abaB = await carregarProgresso(s.api, memoria(), []);
    await salvarProgresso([...abaA.respostas, resposta(), resposta()], s.api, memoria(), false);
    expect(s.noVault()).toBe(22);
    await salvarProgresso([...abaB.respostas, resposta()], s.api, memoria(), false);
    expect(s.noVault()).toBe(23);
  });

  test('conflito no meio (outra aba gravou entre a leitura e a gravação): tenta de novo e junta', async () => {
    const s = servidorFalso(varias(5));
    const original = s.api.put;
    let primeira = true;
    s.api.put = async (texto, versao) => {
      if (primeira) {
        primeira = false;
        s.estado.texto = gerarMarkdown([...varias(0), ...lerMarkdownOk(s.estado.texto!), resposta()], new Date());
        s.estado.versao++;
      }
      return original(texto, versao);
    };
    const r = await salvarProgresso([resposta()], s.api, memoria(), false);
    expect(r.estado).toBe('salvo-no-vault');
    expect(s.noVault()).toBe(7);
  });
});

describe('erro 3 — responder antes de terminar a leitura não sobrescreve', () => {
  test('arquivo ilegível descoberto na hora de gravar: não grava por cima', async () => {
    const s = servidorFalso('# Progresso\n\nalguém apagou o bloco de dados');
    const r = await salvarProgresso([resposta()], s.api, memoria(), false);
    expect(r.estado).toBe('arquivo-ilegivel');
    expect(s.estado.puts).toBe(0);
  });

  test('a leitura que termina depois junta com a resposta nova da memória', async () => {
    const s = servidorFalso(varias(20));
    const nova = resposta();
    const r = await carregarProgresso(s.api, memoria(), [nova]);
    expect(r.respostas).toHaveLength(21);
    expect(r.respostas.some((x) => x.id === nova.id)).toBe(true);
    expect(s.noVault()).toBe(21);
  });

  test('ao abrir com arquivo ilegível, usa o navegador e não grava', async () => {
    const s = servidorFalso('apagaram os dados');
    const r = await carregarProgresso(s.api, memoria(JSON.stringify([resposta()])), []);
    expect(r).toMatchObject({ estado: 'arquivo-ilegivel' });
    expect(r.respostas).toHaveLength(1);
    expect(s.estado.puts).toBe(0);
  });
});

function lerMarkdownOk(texto: string): Resposta[] {
  const lido = lerMarkdown(texto);
  if (!lido.ok) throw new Error(lido.erro);
  return lido.respostas;
}
