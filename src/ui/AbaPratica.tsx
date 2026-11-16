import { simbolo } from '../cerebro/tons';
import { fmt } from '../cerebro/notas';
import { acordeEmFoco, useLoja } from '../estado/loja';
import { Chuva } from './Chuva';
import { Circulo } from './Circulo';
import { FaixaLoop } from './FaixaLoop';
import { Teclado } from './Teclado';
import { COR } from './cores';
import { IconeFuncao } from './IconeFuncao';

export function AbaPratica() {
  const s = useLoja((e) => e);
  const acorde = acordeEmFoco(s);
  const cor = COR[acorde.funcao];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '190px 150px minmax(0, 1fr)', gap: 12, alignItems: 'center' }}>
        <Circulo compacto />
        <div className="painel" style={{ textAlign: 'center' }}>
          <div className="rotulo">{s.tocando ? 'Tocando agora' : 'Ligue o loop no topo'}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: cor.texto }}>
            <IconeFuncao funcao={acorde.funcao} tamanho={22} /> {fmt(simbolo(acorde, 'triade'))}
          </div>
        </div>
        <FaixaLoop />
      </div>
      <Teclado mostrarLegenda={false} acima={<Chuva />} />
    </div>
  );
}
