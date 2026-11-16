import { useMemo, useState } from 'react';
import { NIVEIS } from '../progresso/niveis';
import { acertosRecentes, estadoDaHabilidade, nivelAtual, respostasDa, type EstadoDaHabilidade } from '../progresso/dominio';
import { useProgresso, lojaProgresso } from '../progresso/estadoProgresso';
import { gerarPergunta, temPerguntas, type Pergunta as TipoPergunta } from '../progresso/perguntas';
import { criarAleatorio } from '../progresso/aleatorio';
import { Pergunta } from './Pergunta';

const PERGUNTAS_POR_TESTE = 5;

const SELO: Record<EstadoDaHabilidade, string> = {
  'não começada': '○ não começada',
  praticando: '◐ praticando',
  dominada: '● dominada',
};

function Gravacao() {
  const gravacao = useProgresso((p) => p.gravacao);
  const erro = useProgresso((p) => p.erro);
  if (gravacao === 'carregando') return <span className="rotulo">Lendo o progresso…</span>;
  if (gravacao === 'salvo-no-vault')
    return <span className="rotulo">Progresso salvo no vault: 04 - Recursos/Música/App Círculo das Quintas - Progresso.md</span>;
  if (gravacao === 'so-no-navegador')
    return (
      <span className="aviso">
        Não consegui gravar no vault agora (Google Drive desconectado ou app aberto sem o atalho). O progresso está guardado no navegador e vai
        para o vault na próxima vez que der.
      </span>
    );
  return (
    <span className="aviso">
      O arquivo de progresso no vault foi alterado e não dá para ler ({erro}). Para não apagar nada, o app não vai sobrescrever. O progresso
      está guardado no navegador; use "Exportar progresso" para ter uma cópia.
    </span>
  );
}

function Teste({ habilidade, nome, aoSair }: { habilidade: string; nome: string; aoSair: () => void }) {
  const rng = useMemo(() => criarAleatorio(Date.now()), []);
  const [perguntas] = useState<TipoPergunta[]>(() => Array.from({ length: PERGUNTAS_POR_TESTE }, () => gerarPergunta(habilidade, rng)));
  const [indice, setIndice] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const fim = indice >= perguntas.length;

  return (
    <section className="painel" aria-label={`Teste: ${nome}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <strong>
          Teste: {nome} {!fim && `— pergunta ${indice + 1} de ${perguntas.length}`}
        </strong>
        <button className="botao" onClick={aoSair}>
          Voltar ao mapa
        </button>
      </div>
      <Gravacao />
      {fim ? (
        <div>
          <p style={{ fontSize: 18 }}>
            Você acertou {acertos} de {perguntas.length}.
          </p>
          <p className="rotulo">
            Para dominar uma habilidade: pelo menos 8 acertos nas últimas 10 perguntas, em pelo menos 2 dias diferentes.
          </p>
          <button className="botao" onClick={aoSair}>
            Voltar ao mapa
          </button>
        </div>
      ) : (
        <>
          <Pergunta
            key={indice}
            pergunta={perguntas[indice]}
            aoResponder={(acertou) => {
              setRespondida(true);
              if (acertou) setAcertos((a) => a + 1);
              void lojaProgresso.getState().registrar(habilidade, acertou);
            }}
          />
          {respondida && (
            <button
              className="botao"
              style={{ alignSelf: 'flex-start', fontWeight: 700 }}
              onClick={() => {
                setRespondida(false);
                setIndice((i) => i + 1);
              }}
            >
              {indice + 1 < perguntas.length ? 'Próxima pergunta' : 'Ver resultado'}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export function AbaTestes() {
  const respostas = useProgresso((p) => p.respostas);
  const [ativa, setAtiva] = useState<{ id: string; nome: string } | null>(null);
  const atual = nivelAtual(respostas);

  if (ativa) return <Teste habilidade={ativa.id} nome={ativa.nome} aoSair={() => setAtiva(null)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <section className="painel" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <strong>Seu nível agora: {atual} — {NIVEIS[atual - 1].nome}</strong>
        <Gravacao />
        <button className="botao" style={{ marginLeft: 'auto' }} onClick={() => lojaProgresso.getState().exportar()}>
          Exportar progresso
        </button>
      </section>
      {NIVEIS.map((nivel) => (
        <section key={nivel.numero} className="painel" aria-label={`Nível ${nivel.numero}`} style={{ opacity: nivel.versao === '0.5' ? 1 : 0.75 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 16 }}>
              Nível {nivel.numero} — {nivel.nome}
            </strong>
            {nivel.numero === atual && <span className="aviso">você está aqui</span>}
            {nivel.versao !== '0.5' && <span className="rotulo">testes chegam na v{nivel.versao}</span>}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nivel.habilidades.map((h) => {
              const estado = estadoDaHabilidade(respostasDa(h.id, respostas));
              const { acertos, total } = acertosRecentes(h.id, respostas);
              return (
                <li key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ minWidth: 300 }}>{h.nome}</span>
                  {nivel.versao === '0.5' && (
                    <>
                      <span style={{ minWidth: 130, fontWeight: estado === 'dominada' ? 700 : 400 }}>{SELO[estado]}</span>
                      <span className="rotulo" style={{ minWidth: 150 }}>
                        {total ? `${acertos} de ${total} recentes` : 'sem respostas ainda'}
                      </span>
                      {temPerguntas(h.id) && (
                        <button className="botao" onClick={() => setAtiva({ id: h.id, nome: h.nome })}>
                          Fazer teste ({PERGUNTAS_POR_TESTE} perguntas)
                        </button>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
