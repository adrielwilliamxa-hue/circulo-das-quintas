import { acordesDoTom } from '../cerebro/tons';
import { baixo, vozMaisProxima } from '../cerebro/vozes';
import { baixoEmFoco, loja, vozDaMaoDireita } from '../estado/loja';
import { tocarAgora } from '../audio/som';
import type { Tom } from '../cerebro/tipos';

/** Clique num acorde: com o loop parado, seleciona e toca; com o loop tocando, só toca o som dele. */
export function selecionarETocar(id: string): void {
  const s = loja.getState();
  if (s.tocando) {
    const acorde = acordesDoTom(s.tom).find((a) => a.id === id)!;
    void tocarAgora([baixo(acorde, 'fundamental'), ...vozMaisProxima(acorde.triade, null).midis]);
    return;
  }
  s.selecionarAcorde(id);
  tocarFoco();
}

/** Toca o acorde que está no painel, com a voz e o baixo escolhidos. */
export function tocarFoco(): void {
  const s = loja.getState();
  void tocarAgora([baixoEmFoco(s), ...vozDaMaoDireita(s).midis]);
}

export function escolherTomETocar(tom: Tom): void {
  const s = loja.getState();
  s.escolherTom(tom);
  if (!s.tocando) tocarFoco();
}
