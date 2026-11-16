import { useRef, type KeyboardEvent } from 'react';
import { acordesDoTom, nomeDoTom, textoDaArmadura } from '../cerebro/tons';
import { fmt } from '../cerebro/notas';
import {
  CENTRO,
  RAIOS,
  RAIO_DO_ROTULO,
  anguloDaJanela,
  celulasDaJanela,
  indiceDoTom,
  ponto,
  setor,
  textoDaFatia,
  tomDaFatia,
  type Anel,
} from '../cerebro/circulo';
import { acordeEmFoco, useLoja } from '../estado/loja';
import { COR } from './cores';
import { escolherTomETocar, selecionarETocar } from './acoes';
import { PorQue } from './PorQue';
import { POR_QUE } from '../conteudo/explicacoes';

const LIMITES: Record<Anel, [number, number]> = {
  dentro: [RAIOS.furo, RAIOS.dentro],
  meio: [RAIOS.dentro, RAIOS.meio],
  fora: [RAIOS.meio, RAIOS.fora],
};

/** Contorno da janela em degraus (rascunho 2), desenhado para a fatia 0 e girado. */
const CONTORNO_DA_JANELA =
  'M111.11 111.11 L61.61 61.61 A125 125 0 0 1 117.65 29.26 L111.70 7.05 A148 148 0 0 1 188.30 7.05 L182.35 29.26 A125 125 0 0 1 238.39 61.61 L188.89 111.11 A55 55 0 0 0 111.11 111.11 Z';

export function Circulo({ compacto = false }: { compacto?: boolean }) {
  const s = useLoja((e) => e);
  const k = indiceDoTom(s.tom);
  const angulo = useRef(30 * k);
  angulo.current = anguloDaJanela(angulo.current, k);
  const giro = s.movimentoPorTempo ? 'none' : 'transform 350ms ease-out';

  const acordes = acordesDoTom(s.tom);
  const emFoco = acordeEmFoco(s);
  const celulas = celulasDaJanela(k, s.tom.modo);
  const acordeDaCelula = (grauId: string) => acordes.find((a) => a.id === grauId)!;
  const naJanela = (anel: Anel, posicao: number) => celulas.find((c) => c.anel === anel && c.posicao === posicao);

  const clicar = (anel: Anel, posicao: number) => {
    const celula = naJanela(anel, posicao);
    if (celula) selecionarETocar(celula.grauId);
    else escolherTomETocar(tomDaFatia(posicao, anel, s.tom.modo));
  };

  const teclar = (ev: KeyboardEvent, grauId: string) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      selecionarETocar(grauId);
    }
  };

  return (
    <section className="painel" aria-label="Círculo das quintas" style={{ position: 'relative' }}>
      <svg viewBox="0 -4 300 308" width="100%" style={{ display: 'block', maxWidth: compacto ? 160 : 420, margin: '0 auto' }}>
        <title>Círculo das quintas: {nomeDoTom(s.tom)}</title>
        <circle cx={CENTRO} cy={CENTRO} r={RAIOS.fora} fill="#F3EBDD" stroke="#8B5A2B" strokeWidth={1} />

        <g style={{ transform: `rotate(${angulo.current}deg)`, transformOrigin: '150px 150px', transition: giro }}>
          {celulasDaJanela(0, s.tom.modo).map((c) => {
            const acorde = acordeDaCelula(c.grauId);
            const [r1, r2] = LIMITES[c.anel];
            const a = 30 * c.posicao > 180 ? 30 * c.posicao - 360 : 30 * c.posicao;
            const cor = COR[acorde.funcao];
            const selecionada = emFoco.id === acorde.id;
            return (
              <path
                key={`${c.anel}-${c.grauId}`}
                d={setor(r1, r2, a - 15, a + 15)}
                fill={cor.fundo}
                stroke={cor.borda}
                strokeWidth={selecionada ? 3 : 1.5}
              />
            );
          })}
        </g>

        <g stroke="#B89B72" strokeWidth={0.6}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = 30 * i + 15;
            const p1 = ponto(RAIOS.furo, a);
            const p2 = ponto(RAIOS.fora, a);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
          })}
        </g>
        <circle cx={CENTRO} cy={CENTRO} r={RAIOS.meio} fill="none" stroke="#B89B72" strokeWidth={0.6} />
        <circle cx={CENTRO} cy={CENTRO} r={RAIOS.dentro} fill="none" stroke="#B89B72" strokeWidth={0.6} />
        <circle cx={CENTRO} cy={CENTRO} r={RAIOS.furo} fill="#FFFFFF" stroke="#8B5A2B" strokeWidth={1} />

        <g style={{ transform: `rotate(${angulo.current}deg)`, transformOrigin: '150px 150px', transition: giro }}>
          <path d={CONTORNO_DA_JANELA} fill="none" stroke="#8B5A2B" strokeWidth={4} strokeLinejoin="round" />
        </g>

        {/* No modo compacto (160px) as letras ficariam com ~5px: o nome do tom vai embaixo, em texto. */}
        {!compacto &&
          (['dentro', 'meio', 'fora'] as Anel[]).map((anel) =>
          Array.from({ length: 12 }, (_, posicao) => {
            const texto = textoDaFatia(anel, posicao, s.tom);
            const p = ponto(RAIO_DO_ROTULO[anel], 30 * posicao);
            const celula = naJanela(anel, posicao);
            const tamanho = anel === 'dentro' ? 14 : 12;
            return (
              <g key={`${anel}-${posicao}`}>
                <text
                  x={p.x}
                  y={celula ? p.y - 5 : p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={celula ? tamanho + 2 : tamanho}
                  fontWeight={celula ? 700 : 400}
                  fill={celula ? '#2C2C2A' : '#3B2A1A'}
                  style={{ pointerEvents: 'none' }}
                >
                  {fmt(texto)}
                </text>
                {celula && (
                  <text x={p.x} y={p.y + 9} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#2C2C2A" style={{ pointerEvents: 'none' }}>
                    {celula.grauId}
                  </text>
                )}
              </g>
            );
          }),
        )}

        {!compacto && (
          <>
            <text x={CENTRO} y={CENTRO - 6} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1F1E1C">
              {nomeDoTom(s.tom)}
            </text>
            <text x={CENTRO} y={CENTRO + 12} textAnchor="middle" fontSize={12} fill="#5F5E5A">
              {textoDaArmadura(s.tom)}
            </text>
          </>
        )}

        {(['dentro', 'meio', 'fora'] as Anel[]).map((anel) =>
          Array.from({ length: 12 }, (_, posicao) => {
            const [r1, r2] = LIMITES[anel];
            const a = 30 * posicao;
            const celula = naJanela(anel, posicao);
            const acorde = celula && acordeDaCelula(celula.grauId);
            return (
              <path
                key={`clique-${anel}-${posicao}`}
                d={setor(r1, r2, a - 15, a + 15)}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => clicar(anel, posicao)}
                {...(acorde
                  ? {
                      tabIndex: 0,
                      role: 'button',
                      'aria-label': `Selecionar ${fmt(acorde.fundamental)} ${acorde.qualidade}, grau ${acorde.grau}`,
                      onKeyDown: (ev: KeyboardEvent) => teclar(ev, acorde.id),
                    }
                  : { 'aria-hidden': true })}
              />
            );
          }),
        )}
      </svg>
      {compacto && <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{nomeDoTom(s.tom)}</div>}
      {!compacto && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="rotulo">Clique numa fatia fora da janela para trocar de tom.</span>
          <PorQue titulo="O círculo das quintas" frases={POR_QUE.circulo} />
        </div>
      )}
    </section>
  );
}
