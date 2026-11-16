import { useState, type KeyboardEvent } from 'react';
import { nomeDaTeclaNaPergunta, textoDaRespostaCerta, verificar, type Pergunta as TipoPergunta, type RespostaDada } from '../progresso/perguntas';
import { tocarAgora, tocarSequencia } from '../audio/som';
import { BRANCA, LARGURA_TECLADO, PRIMEIRA, ULTIMA, teclas } from './geometriaTeclado';

export function Pergunta({ pergunta, aoResponder }: { pergunta: TipoPergunta; aoResponder: (acertou: boolean) => void }) {
  const [escolhidas, setEscolhidas] = useState<number[]>([]);
  const [resultado, setResultado] = useState<boolean | null>(null);
  const [foco, setFoco] = useState(60);
  const [comFoco, setComFoco] = useState(false);
  const nome = (midi: number) => nomeDaTeclaNaPergunta(midi, pergunta);

  const responder = (resposta: RespostaDada) => {
    if (resultado !== null) return;
    const acertou = verificar(pergunta, resposta);
    setResultado(acertou);
    aoResponder(acertou);
  };

  const alternar = (midi: number) => {
    if (resultado !== null) return;
    void tocarAgora([midi], 0.8);
    setEscolhidas((atual) => (atual.includes(midi) ? atual.filter((m) => m !== midi) : [...atual, midi]));
  };

  const teclar = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowRight') setFoco((m) => Math.min(ULTIMA, m + 1));
    else if (ev.key === 'ArrowLeft') setFoco((m) => Math.max(PRIMEIRA, m - 1));
    else if (ev.key === 'Enter' || ev.key === ' ') alternar(foco);
    else return;
    ev.preventDefault();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 18, margin: 0 }}>{pergunta.enunciado}</p>
      {pergunta.tocar && (
        <button className="botao" style={{ alignSelf: 'flex-start' }} onClick={() => void tocarSequencia(pergunta.tocar!)}>
          Ouvir
        </button>
      )}

      {pergunta.tipo === 'botoes' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {pergunta.opcoes.map((o) => (
            <button key={o} className="botao" style={{ fontSize: 16, padding: '6px 12px' }} onClick={() => responder(o)} aria-pressed={resultado !== null && o === pergunta.certa}>
              {o}
            </button>
          ))}
        </div>
      ) : (
        <>
          <span className="rotulo">{pergunta.dica} Pelo teclado do computador: setas para andar, Enter para marcar.</span>
          <svg
            viewBox={`0 0 ${LARGURA_TECLADO} ${BRANCA.altura + 4}`}
            width="100%"
            role="group"
            aria-label={`Teclado para responder. Tecla atual: ${nome(foco)}.`}
            tabIndex={0}
            onKeyDown={teclar}
            onFocus={() => setComFoco(true)}
            onBlur={() => setComFoco(false)}
          >
            {[...teclas().filter((t) => !t.preta), ...teclas().filter((t) => t.preta)].map((t) => {
              const escolhida = escolhidas.includes(t.midi);
              const focada = comFoco && foco === t.midi;
              return (
                <g key={t.midi} onPointerDown={() => alternar(t.midi)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={t.x}
                    y={0}
                    width={t.largura}
                    height={t.altura}
                    fill={escolhida ? '#CDE9F8' : t.preta ? '#2C2C2A' : '#FFFFFF'}
                    stroke={escolhida || focada ? '#1F6FB5' : '#888780'}
                    strokeWidth={focada ? 4 : escolhida ? 3 : 0.75}
                  />
                  {escolhida && <circle cx={t.x + t.largura / 2} cy={t.preta ? 64 : 106} r={8} fill="#1F6FB5" />}
                  {!t.preta && (
                    <text x={t.x + t.largura / 2} y={130} textAnchor="middle" fontSize={11} fill="#5F5E5A">
                      {nome(t.midi)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="rotulo">Escolhidas: {escolhidas.length ? escolhidas.map(nome).join(', ') : 'nenhuma'}</span>
            <button className="botao" onClick={() => setEscolhidas([])} disabled={resultado !== null}>
              Limpar
            </button>
            <button className="botao" style={{ fontWeight: 700 }} onClick={() => responder(escolhidas)} disabled={resultado !== null}>
              Responder
            </button>
          </div>
        </>
      )}

      {resultado !== null && (
        <div role="status" className="painel" style={{ borderColor: resultado ? '#3A8FC7' : '#E69F00', background: resultado ? '#EAF4FB' : '#FDF3DF' }}>
          <strong>{resultado ? '✓ Certo.' : `✗ Ainda não. Resposta certa: ${textoDaRespostaCerta(pergunta)}.`}</strong>
          <p style={{ margin: '4px 0 0' }}>
            <span className="rotulo">Por quê: </span>
            {pergunta.explicacao}
          </p>
        </div>
      )}
    </div>
  );
}
