import { expect, test } from 'vitest';
import { criarLojaProgresso } from './estadoProgresso';
import { gerarMarkdown, lerMarkdown } from './arquivo';
import type { Api, Armazenamento } from './salvar';
import type { Resposta } from './dominio';

const antigas: Resposta[] = Array.from({ length: 20 }, (_, i) => ({
  id: `a${i}`,
  habilidade: 'n1-notas',
  acertou: true,
  data: '2026-10-22',
  quando: new Date(Date.UTC(2026, 9, 22, 10, 0, i)).toISOString(),
}));

test('erro 3 — responder enquanto o vault ainda está sendo lido espera a leitura e não perde nada', async () => {
  let texto = gerarMarkdown(antigas, new Date());
  let versao = 1;
  let liberarLeitura!: () => void;
  const leituraLenta = new Promise<void>((r) => (liberarLeitura = r));
  let primeiraLeitura = true;
  const api: Api = {
    async get() {
      if (primeiraLeitura) {
        primeiraLeitura = false;
        await leituraLenta;
      }
      return { status: 200, texto, versao: String(versao) };
    },
    async put(novo, v) {
      if (v !== String(versao)) return 'conflito';
      texto = novo;
      versao++;
      return 'ok';
    },
  };
  const local: Armazenamento = { ler: () => null, gravar: () => {} };
  const loja = criarLojaProgresso(api, local);

  const carregando = loja.getState().carregar();
  const respondendo = loja.getState().registrar('n1-notas', true);
  expect(loja.getState().respostas).toHaveLength(1);
  liberarLeitura();
  await Promise.all([carregando, respondendo]);

  const lido = lerMarkdown(texto);
  expect(lido.ok && lido.respostas.length).toBe(21);
  expect(loja.getState().respostas).toHaveLength(21);
  expect(loja.getState().gravacao).toBe('salvo-no-vault');
});
