import { AcordesDoTom } from './AcordesDoTom';
import { Circulo } from './Circulo';
import { FaixaLoop } from './FaixaLoop';
import { PainelAcorde } from './PainelAcorde';
import { Teclado } from './Teclado';

export function AbaEstudo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>
        <Circulo />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AcordesDoTom />
          <PainelAcorde />
        </div>
      </div>
      <FaixaLoop />
      <Teclado />
    </div>
  );
}
