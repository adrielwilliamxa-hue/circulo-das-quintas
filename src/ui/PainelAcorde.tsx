import type { ReactNode } from 'react';
import { formatosDoAcorde, simbolo } from '../cerebro/tons';
import { fmt } from '../cerebro/notas';
import { ponteDe, escalaDaPonte } from '../cerebro/ponte';
import { baixo, dedilhado, montagem, vozDoFormato, vozMaisProxima, vozesCandidatas } from '../cerebro/vozes';
import type { BaixoOpcao, Formato, Inversao } from '../cerebro/tipos';
import { acordeEmFoco, formatoEmFoco, loja, useLoja, vozDaMaoDireita } from '../estado/loja';
import { oQueFaz } from '../conteudo/textos';
import { POR_QUE } from '../conteudo/explicacoes';
import { tocarSequencia } from '../audio/som';
import { COR, NOME_DA_FUNCAO, TERMO_DA_FUNCAO } from './cores';
import { IconeFuncao } from './IconeFuncao';
import { PorQue } from './PorQue';
import { tocarFoco } from './acoes';

const TIPO_DA_TRIADE = {
  maior: 'tríade maior = terça maior (4 meias-teclas) + terça menor (3)',
  menor: 'tríade menor = terça menor (3 meias-teclas) + terça maior (4)',
  diminuta: 'tríade diminuta = terça menor (3 meias-teclas) + terça menor (3)',
};

const NOME_DA_INVERSAO = ['Fundamental', '1ª inversão', '2ª inversão'];

function Linha({ titulo, porque, children }: { titulo: string; porque?: { titulo: string; frases: readonly string[] }; children: ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid var(--borda)', paddingTop: 8, marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="rotulo" style={{ fontWeight: 600 }}>
          {titulo}
        </span>
        {porque && <PorQue titulo={porque.titulo} frases={porque.frases} />}
      </div>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );
}

export function PainelAcorde() {
  const s = useLoja((e) => e);
  const acorde = acordeEmFoco(s);
  const formato = formatoEmFoco(s);
  const voz = vozDaMaoDireita(s);
  const nome = fmt(simbolo(acorde, formato));
  const cor = COR[acorde.funcao];
  const ponte = ponteDe(acorde, s.tom);
  const partes = montagem(acorde, formato);
  const dedos = dedilhado(formato, voz.inversao);
  const maisPerto = vozMaisProxima(acorde.triade, s.vozAnterior).inversao;
  const inversoesQueCabem = new Set(vozesCandidatas(acorde.triade).map((v) => v.inversao));

  const mudarETocar = (mudar: () => void) => {
    mudar();
    tocarFoco();
  };

  return (
    <section className="painel" aria-label="Acorde selecionado" style={{ fontSize: 15, lineHeight: 1.55 }}>
      <div className="rotulo">{s.tocando ? 'Acorde tocando agora no loop' : 'Acorde selecionado'}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: cor.texto }}>
        <span style={{ background: cor.fundo, border: `2px solid ${cor.borda}`, borderRadius: 8, padding: '0 8px', marginRight: 8 }}>
          <IconeFuncao funcao={acorde.funcao} tamanho={18} /> {nome}
        </span>
        {acorde.grau} · {NOME_DA_FUNCAO[acorde.funcao]} ({TERMO_DA_FUNCAO[acorde.funcao]}, {acorde.forca})
      </div>
      <p style={{ margin: '6px 0 0' }}>{oQueFaz(acorde, s.tom)}</p>

      <Linha titulo="Como é montado" porque={{ titulo: 'Como um acorde é montado', frases: POR_QUE.montagem }}>
        <div>
          {partes.map((p, i) => (
            <span key={p.papel}>
              {i > 0 && ' + '}
              <strong>{fmt(p.nota)}</strong> ({p.papel}
              {p.meiasTeclas > 0 ? `, ${p.meiasTeclas} meias-teclas acima` : ''})
            </span>
          ))}
        </div>
        {formato === 'triade' && <div className="rotulo">{TIPO_DA_TRIADE[acorde.qualidade]}</div>}
        {!s.tocando && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {(
              [
                ['triade', 'Tríade'],
                ['tetrade', `Tétrade (${fmt(simbolo(acorde, 'tetrade'))})`],
                ['quinta', `Só a quinta (${fmt(simbolo(acorde, 'quinta'))})`],
              ] as [Formato, string][]
            )
              .filter(([f]) => formatosDoAcorde(acorde).includes(f))
              .map(([f, rotulo]) => (
              <button key={f} className="botao" aria-pressed={s.formato === f} onClick={() => mudarETocar(() => loja.getState().escolherFormato(f))}>
                {rotulo}
              </button>
            ))}
            {formato === 'quinta' && <PorQue titulo="Só a quinta" frases={POR_QUE.quinta} />}
            {formato === 'tetrade' && <PorQue titulo="A tétrade" frases={POR_QUE.tetrade} />}
          </div>
        )}
      </Linha>

      <Linha titulo="Inversões (mão direita)" porque={{ titulo: 'Inversões', frases: POR_QUE.inversoes }}>
        {formato === 'triade' && !s.tocando ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([0, 1, 2] as Inversao[])
              .filter((i) => inversoesQueCabem.has(i))
              .map((i) => (
                <button key={i} className="botao" aria-pressed={voz.inversao === i} onClick={() => mudarETocar(() => loja.getState().escolherInversao(i))}>
                  {NOME_DA_INVERSAO[i]}
                  {i === maisPerto && s.vozAnterior ? ' (mais perto)' : ''}
                </button>
              ))}
          </div>
        ) : (
          <div>
            {NOME_DA_INVERSAO[voz.inversao]}
            {s.tocando ? ' — escolhida automaticamente: a que move menos os dedos.' : ' — tétrade e só a quinta ficam na posição fundamental.'}
          </div>
        )}
        <div className="rotulo">
          Dedilhado: mão direita {dedos.direita}; mão esquerda {dedos.esquerda} (1 = polegar, 5 = mindinho).
        </div>
      </Linha>

      <Linha titulo="Baixo (mão esquerda)" porque={{ titulo: 'O baixo', frases: POR_QUE.baixo }}>
        {s.tocando ? (
          <div>{fmt(acorde.fundamental)} (fundamental). Pare o loop para escolher outro baixo.</div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                ['fundamental', acorde.triade[0]],
                ['terca', acorde.triade[1]],
                ['quinta', acorde.triade[2]],
              ] as [BaixoOpcao, string][]
            ).map(([opcao, nota]) => (
              <button key={opcao} className="botao" aria-pressed={s.baixoOpcao === opcao} onClick={() => mudarETocar(() => loja.getState().escolherBaixo(opcao))}>
                {opcao === 'fundamental' ? fmt(simbolo(acorde, 'triade')) : `${fmt(simbolo(acorde, 'triade'))}/${fmt(nota)}`}
              </button>
            ))}
          </div>
        )}
      </Linha>

      <Linha titulo="Ponte (o acorde que prepara a chegada)" porque={{ titulo: 'A ponte', frases: POR_QUE.ponte }}>
        {ponte ? (
          <>
            <div>
              <strong>{fmt(ponte.simbolo)}</strong> prepara o {fmt(simbolo(acorde, 'triade'))}
              {ponte.primario ? ' (é o dominante do próprio tom)' : ''}. {ponte.texto}
            </div>
            <div className="rotulo">
              Escala sobre o {fmt(ponte.simbolo)}: {ponte.escala} ({escalaDaPonte(ponte).map(fmt).join(' ')}).
            </div>
            <button
              className="botao"
              style={{ marginTop: 4 }}
              onClick={() => {
                const preparador = { ...acorde, fundamental: ponte.notas[0], triade: ponte.notas.slice(0, 3), tetrade: ponte.notas };
                const vozDoAlvo = vozMaisProxima(acorde.triade, null).midis;
                void tocarSequencia([
                  [baixo(preparador, 'fundamental'), ...vozDoFormato(preparador, 'tetrade', 0)],
                  [baixo(acorde, 'fundamental'), ...vozDoAlvo],
                ]);
              }}
            >
              Tocar a ponte ({fmt(ponte.simbolo)} → {fmt(simbolo(acorde, 'triade'))})
            </button>
          </>
        ) : (
          <div>Acordes diminutos não recebem ponte: são instáveis demais para servir de chegada.</div>
        )}
      </Linha>

      <Linha titulo="Escala para improvisar" porque={{ titulo: 'A escala do acorde', frases: POR_QUE.escala }}>
        <div>
          <strong>{acorde.escala.nome}</strong>: {acorde.escala.notas.map(fmt).join(' ')} — a escala do tom começando em {fmt(acorde.fundamental)}.
        </div>
        <div className="rotulo">As marcas no teclado mostram quais dessas notas são firmes, de tensão ou de passagem.</div>
      </Linha>
      {!s.tocando && (
        <button className="botao" style={{ marginTop: 10 }} onClick={tocarFoco}>
          Tocar este acorde (baixo {fmt(acorde.triade[{ fundamental: 0, terca: 1, quinta: 2 }[s.baixoOpcao]])} + mão direita)
        </button>
      )}
    </section>
  );
}
