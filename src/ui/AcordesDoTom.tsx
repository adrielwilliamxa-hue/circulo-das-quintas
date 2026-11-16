import { acordesDoTom, simbolo } from '../cerebro/tons';
import { fmt } from '../cerebro/notas';
import type { Funcao } from '../cerebro/tipos';
import { acordeEmFoco, useLoja } from '../estado/loja';
import { COR, NOME_DA_FUNCAO, RESUMO_DA_FUNCAO, TERMO_DA_FUNCAO } from './cores';
import { IconeFuncao } from './IconeFuncao';
import { selecionarETocar } from './acoes';
import { PorQue } from './PorQue';
import { POR_QUE } from '../conteudo/explicacoes';

const FUNCOES: Funcao[] = ['casa', 'sair', 'voltar'];

export function AcordesDoTom() {
  const s = useLoja((e) => e);
  const acordes = acordesDoTom(s.tom);
  const emFoco = acordeEmFoco(s);

  return (
    <section className="painel" aria-label="Acordes do tom">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="rotulo">Acordes do tom, agrupados pelo que fazem</span>
        <PorQue titulo="Casa, sair e voltar" frases={POR_QUE.funcoes} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {FUNCOES.map((f) => (
          <div key={f} style={{ background: COR[f].fundo, border: `1.5px solid ${COR[f].borda}`, borderRadius: 8, padding: '6px 8px', color: COR[f].texto }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              <IconeFuncao funcao={f} /> {NOME_DA_FUNCAO[f]} · {TERMO_DA_FUNCAO[f]}
            </div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>{RESUMO_DA_FUNCAO[f]}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {acordes
                .filter((a) => a.funcao === f)
                .map((a) => (
                  <button
                    key={a.id}
                    className="botao"
                    aria-pressed={emFoco.id === a.id}
                    onClick={() => selecionarETocar(a.id)}
                    style={{ color: COR[f].texto, borderColor: COR[f].borda, textAlign: 'center', lineHeight: 1.2 }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{fmt(simbolo(a, a.id === 'V7' ? 'tetrade' : 'triade'))}</span>
                    <br />
                    <span style={{ fontSize: 14 }}>
                      {a.grau} · {a.forca}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
