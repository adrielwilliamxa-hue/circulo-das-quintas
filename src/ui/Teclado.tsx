import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { classificar, fraseDaTecla, nomeNaTonalidade } from '../cerebro/classificacao';
import { dedilhado } from '../cerebro/vozes';
import { fmt } from '../cerebro/notas';
import type { Marca } from '../cerebro/tipos';
import { acordeEmFoco, baixoEmFoco, formatoEmFoco, useLoja, vozDaMaoDireita, type Mostrar } from '../estado/loja';
import { tocarAgora } from '../audio/som';
import { COR } from './cores';
import { BRANCA, LARGURA_TECLADO, PRIMEIRA, ULTIMA, centroX, teclas } from './geometriaTeclado';
import { PorQue } from './PorQue';
import { POR_QUE } from '../conteudo/explicacoes';

const VISIVEL: Record<Mostrar, Marca[]> = {
  acorde: ['acorde'],
  tensao: ['acorde', 'tensao'],
  tudo: ['acorde', 'tensao', 'passagem'],
};

const NOMES_DA_MARCA: Record<Marca, string> = {
  acorde: 'nota do acorde',
  tensao: 'nota de tensão',
  passagem: 'nota de passagem',
  fora: 'fora do tom',
};

export function Teclado({ mostrarLegenda = true, acima }: { mostrarLegenda?: boolean; acima?: ReactNode }) {
  const s = useLoja((e) => e);
  const [foco, setFoco] = useState(60);
  const [comFoco, setComFoco] = useState(false);
  const acorde = acordeEmFoco(s);
  const formato = formatoEmFoco(s);
  const voz = vozDaMaoDireita(s);
  const grave = baixoEmFoco(s);
  const dedos = dedilhado(formato, voz.inversao).direita.split('-');
  const cor = COR[acorde.funcao];

  const tocar = (midi: number) => {
    void tocarAgora([midi], 1.2);
    s.setTeclaFalada(fraseDaTecla(nomeNaTonalidade(midi, s.tom), acorde, s.tom, formato));
  };

  const aoTeclar = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowRight') setFoco((m) => Math.min(ULTIMA, m + 1));
    else if (ev.key === 'ArrowLeft') setFoco((m) => Math.max(PRIMEIRA, m - 1));
    else if (ev.key === 'Enter' || ev.key === ' ') tocar(foco);
    else return;
    ev.preventDefault();
  };

  const lista = teclas();
  const marcaDe = (midi: number) => {
    if (midi < 60) return null;
    const { marca } = classificar(nomeNaTonalidade(midi, s.tom), acorde, s.tom, formato);
    return VISIVEL[s.mostrar].includes(marca) ? marca : null;
  };

  const desenharTecla = (t: (typeof lista)[number]) => {
    const sombreada = voz.midis.includes(t.midi) || t.midi === grave;
    const fill = sombreada ? cor.fundo : t.preta ? '#2C2C2A' : '#FFFFFF';
    const marca = marcaDe(t.midi);
    const cx = t.x + t.largura / 2;
    const yMarca = t.preta ? 64 : 106;
    const corDaMarca = t.preta && !sombreada ? '#FFFFFF' : '#2C2C2A';
    const nome = fmt(nomeNaTonalidade(t.midi, s.tom));
    const dedo = voz.midis.indexOf(t.midi);
    return (
      <g key={t.midi} onPointerDown={() => tocar(t.midi)} style={{ cursor: 'pointer' }}>
        <rect
          x={t.x}
          y={0}
          width={t.largura}
          height={t.altura}
          fill={fill}
          stroke={comFoco && foco === t.midi ? '#1F6FB5' : t.preta ? '#2C2C2A' : '#888780'}
          strokeWidth={comFoco && foco === t.midi ? 3 : 0.75}
        >
          <title>{`${nome}${marca ? ` — ${NOMES_DA_MARCA[marca]}` : ''}`}</title>
        </rect>
        {t.midi === grave && <rect x={cx - 8} y={yMarca - 8} width={16} height={16} fill={corDaMarca} />}
        {marca === 'acorde' && t.midi !== grave && <circle cx={cx} cy={yMarca} r={8} fill={corDaMarca} />}
        {marca === 'tensao' && <circle cx={cx} cy={yMarca} r={6} fill="none" stroke={corDaMarca} strokeWidth={2} />}
        {marca === 'passagem' && (
          <text x={cx} y={yMarca + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill={corDaMarca}>
            →
          </text>
        )}
        {s.dedilhadoVisivel && dedo >= 0 && (
          <text x={cx} y={t.preta ? 44 : 86} textAnchor="middle" fontSize={12} fontWeight={700} fill={cor.texto}>
            {dedos[dedo]}
          </text>
        )}
        {s.dedilhadoVisivel && t.midi === grave && (
          <text x={cx} y={t.preta ? 44 : 86} textAnchor="middle" fontSize={12} fontWeight={700} fill={cor.texto}>
            5
          </text>
        )}
        {s.nomesNasTeclas && (
          <text
            x={cx}
            y={t.preta ? 80 : 130}
            textAnchor="middle"
            fontSize={t.preta ? 9 : 11}
            fill={t.preta && !sombreada ? '#FFFFFF' : '#5F5E5A'}
          >
            {nome}
          </text>
        )}
      </g>
    );
  };

  return (
    <section className="painel" aria-label="Teclado">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <span className="rotulo" style={{ width: '33%' }}>
          Mão esquerda: só o baixo
        </span>
        <span className="rotulo">Mão direita: acorde ou melodia</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <label className="rotulo">
            <input type="checkbox" checked={s.nomesNasTeclas} onChange={(ev) => s.setNomesNasTeclas(ev.target.checked)} /> Nomes
          </label>
          <label className="rotulo">
            <input type="checkbox" checked={s.dedilhadoVisivel} onChange={(ev) => s.setDedilhadoVisivel(ev.target.checked)} />{' '}
            Dedilhado
          </label>
        </span>
      </div>
      {acima}
      <svg
        viewBox={`0 0 ${LARGURA_TECLADO} ${BRANCA.altura + 4}`}
        width="100%"
        role="group"
        aria-label="Teclado de três oitavas. Use as setas para andar entre as teclas e Enter para tocar."
        tabIndex={0}
        onKeyDown={aoTeclar}
        onFocus={() => setComFoco(true)}
        onBlur={() => setComFoco(false)}
        style={{ display: 'block', touchAction: 'manipulation' }}
      >
        {lista.filter((t) => !t.preta).map(desenharTecla)}
        {lista.filter((t) => t.preta).map(desenharTecla)}
        <line x1={centroX(60) - 15.5} y1={0} x2={centroX(60) - 15.5} y2={6} stroke="#8B5A2B" strokeWidth={3} />
      </svg>
      <p aria-live="polite" style={{ minHeight: 22, margin: '6px 0 0', fontSize: 15 }}>
        {s.teclaFalada ?? 'Clique numa tecla para ouvir e ver o que ela é sobre o acorde atual.'}
      </p>
      {mostrarLegenda && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', alignItems: 'center', marginTop: 6, fontSize: 14 }}>
          <span>
            <strong>■ Baixo</strong> <span className="rotulo">a nota grave da mão esquerda</span>
          </span>
          <span>
            <strong>● Nota do acorde</strong> <span className="rotulo">pode parar e segurar</span>
          </span>
          <span>
            <strong>○ Nota de tensão</strong> <span className="rotulo">colore; melhor em tempo fraco</span>
          </span>
          <span>
            <strong>→ Nota de passagem</strong> <span className="rotulo">só no caminho; não pare</span>
          </span>
          <span>
            <strong>Sem marca</strong> <span className="rotulo">fora do tom: evite por enquanto</span>
          </span>
          <PorQue titulo="As marcas do teclado" frases={POR_QUE.teclado} />
        </div>
      )}
    </section>
  );
}
