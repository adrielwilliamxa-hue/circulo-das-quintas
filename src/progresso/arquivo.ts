import { NIVEIS } from './niveis';
import { acertosRecentes, dataLocal, estadoDaHabilidade, nivelAtual, respostasDa, type Resposta } from './dominio';

const TITULO_DOS_DADOS = '## Dados do app (não editar)';

function horaLocal(d: Date): string {
  return `${dataLocal(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Markdown do progresso: legível para pessoas e, no fim, os dados completos para o app. */
export function gerarMarkdown(respostas: Resposta[], agora: Date): string {
  const atual = NIVEIS.find((n) => n.numero === nivelAtual(respostas))!;
  const estados = new Map(NIVEIS.flatMap((n) => n.habilidades).map((h) => [h.id, estadoDaHabilidade(respostasDa(h.id, respostas))]));
  const dominadasNoNivel = atual.habilidades.filter((h) => estados.get(h.id) === 'dominada').length;

  // §6.10: "o que trabalhar agora" = habilidades em "praticando" do nível atual.
  const trabalhar = atual.habilidades
    .filter((h) => estados.get(h.id) === 'praticando')
    .map((h) => {
      const { acertos, total } = acertosRecentes(h.id, respostas);
      return `- ${h.nome} (praticando, ${acertos} de ${total} acertos recentes)`;
    });
  const naoComecadas = atual.habilidades.filter((h) => estados.get(h.id) === 'não começada').map((h) => h.nome);

  const linhas = NIVEIS.flatMap((n) =>
    n.habilidades.map((h) => {
      if (n.versao !== '0.5') return `| ${n.numero} | ${h.nome} | testes na v${n.versao} | — | — |`;
      const { acertos, total } = acertosRecentes(h.id, respostas);
      const ultima = respostasDa(h.id, respostas).at(-1)?.data ?? '—';
      return `| ${n.numero} | ${h.nome} | ${estados.get(h.id)} | ${total ? `${acertos}/${total}` : '—'} | ${ultima} |`;
    }),
  );

  return [
    '---',
    'tags: [musica, progresso]',
    `atualizado: ${horaLocal(agora)}`,
    '---',
    '',
    '# App Círculo das Quintas — Progresso',
    '',
    '> Arquivo gravado sozinho pelo app a cada resposta da aba Testes. Não edite à mão: o bloco de dados no fim é o que o app lê.',
    '',
    `**Nível atual:** ${atual.numero} — ${atual.nome} · ${dominadasNoNivel} de ${atual.habilidades.length} habilidades dominadas`,
    '',
    '## O que trabalhar agora',
    '',
    ...(trabalhar.length ? trabalhar : ['Nenhuma habilidade em prática no nível atual.']),
    '',
    ...(naoComecadas.length ? [`Ainda não começadas no nível atual: ${naoComecadas.join(', ')}.`, ''] : []),
    '## Habilidades',
    '',
    'Dominada = pelo menos 8 acertos nas últimas 10 perguntas, em pelo menos 2 dias diferentes. Volta para "praticando" abaixo de 6 em 10.',
    '',
    '| Nível | Habilidade | Estado | Acertos (últimas 10) | Último teste |',
    '|---|---|---|---|---|',
    ...linhas,
    '',
    TITULO_DOS_DADOS,
    '',
    '```json',
    JSON.stringify({ versao: 1, respostas }),
    '```',
    '',
  ].join('\n');
}

function ehResposta(r: unknown): r is Resposta {
  const x = r as Resposta;
  return !!x && typeof x.id === 'string' && typeof x.habilidade === 'string' && typeof x.acertou === 'boolean' && typeof x.data === 'string' && typeof x.quando === 'string';
}

export function lerMarkdown(texto: string): { ok: true; respostas: Resposta[] } | { ok: false; erro: string } {
  const inicio = texto.indexOf(TITULO_DOS_DADOS);
  if (inicio < 0) return { ok: false, erro: 'O arquivo não tem o bloco de dados do app.' };
  const bloco = /```json\s*([\s\S]*?)```/.exec(texto.slice(inicio));
  if (!bloco) return { ok: false, erro: 'O bloco de dados do app está incompleto.' };
  try {
    const dados = JSON.parse(bloco[1]);
    if (!Array.isArray(dados?.respostas) || !dados.respostas.every(ehResposta)) {
      return { ok: false, erro: 'Os dados do app estão num formato desconhecido.' };
    }
    return { ok: true, respostas: dados.respostas };
  } catch {
    return { ok: false, erro: 'Os dados do app não puderam ser lidos.' };
  }
}

/** Junta duas listas de respostas sem repetir, em ordem de tempo. */
export function juntar(a: Resposta[], b: Resposta[]): Resposta[] {
  const porId = new Map<string, Resposta>();
  for (const r of [...a, ...b]) porId.set(r.id, r);
  return [...porId.values()].sort((x, y) => x.quando.localeCompare(y.quando) || x.id.localeCompare(y.id));
}
