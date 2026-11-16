import { simbolo } from '../cerebro/tons';
import { fmt } from '../cerebro/notas';
import { acordesDoLoop, progressaoAtual, useLoja } from '../estado/loja';
import { COR } from './cores';
import { IconeFuncao } from './IconeFuncao';
import { PorQue } from './PorQue';
import { DICAS, POR_QUE } from '../conteudo/explicacoes';

const TEMPOS = ['forte', 'fraco', 'meio forte', 'fraco'];

export function FaixaLoop() {
  const s = useLoja((e) => e);
  const acordes = acordesDoLoop(s);
  const atual = s.tocando ? s.posicao.compasso : -1;
  const proximo = s.tocando ? (atual + 1) % acordes.length : 0;
  const tempo = s.posicao.tempo;

  return (
    <section className="painel" aria-label="Faixa do loop">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="rotulo">Faixa do loop — {progressaoAtual(s).nome}</span>
        <span style={{ display: 'flex', gap: 6 }}>
          <PorQue titulo="Tempos do compasso" frases={POR_QUE.faixa} />
          <PorQue titulo="Dicas para improvisar" frases={DICAS} />
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${acordes.length}, minmax(0, 1fr))`, gap: 6, marginTop: 6 }}>
        {acordes.map((a, i) => {
          const cor = COR[a.funcao];
          const tocandoAgora = i === atual;
          return (
            <div
              key={i}
              style={{
                background: cor.fundo,
                border: `${tocandoAgora ? 3 : 1.5}px solid ${cor.borda}`,
                borderRadius: 8,
                padding: tocandoAgora ? '3px 6px' : '4px 7px',
                color: cor.texto,
                textAlign: 'center',
              }}
            >
              <IconeFuncao funcao={a.funcao} /> <strong>{fmt(simbolo(a, 'triade'))}</strong>{' '}
              <span style={{ fontSize: 14 }}>
                {tocandoAgora ? `· tempo ${tempo + 1} de 4` : i === proximo && s.tocando ? '· próximo' : `· ${a.grau}`}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        {TEMPOS.map((t, i) => (
          <span
            key={i}
            style={{
              border: `${s.tocando && tempo === i ? 2 : 1}px solid ${s.tocando && tempo === i ? '#1F1E1C' : 'rgba(0,0,0,.2)'}`,
              borderRadius: 8,
              padding: '1px 8px',
              fontSize: 14,
              fontWeight: s.tocando && tempo === i ? 700 : 400,
            }}
          >
            {i + 1} {t}
          </span>
        ))}
        <span className="rotulo">
          Tempo forte: boa hora para uma nota do acorde. Tempo fraco: hora livre para notas de tensão e de passagem.
        </span>
      </div>
    </section>
  );
}
