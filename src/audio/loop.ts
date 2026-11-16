import * as Tone from 'tone';
import { loja, progressaoAtual, vozesDoLoopAtual, acordesDoLoop } from '../estado/loja';
import { baixo } from '../cerebro/vozes';
import { iniciarSom, pararSons, tocarClique, tocarNotas } from './som';

let repeticao: number | null = null;

/** Liga o loop: um acorde por compasso (4/4), metrônomo opcional, troca de tom no início do compasso. */
export async function ligarLoop(): Promise<void> {
  await iniciarSom();
  const transporte = Tone.getTransport();
  transporte.stop();
  transporte.cancel();
  transporte.bpm.value = loja.getState().bpm;
  transporte.timeSignature = 4;
  loja.getState().setTocando(true);

  let batida = 0;
  repeticao = transporte.scheduleRepeat((quando) => {
    const tempo = batida % 4;
    const compassoAbsoluto = Math.floor(batida / 4);
    batida++;
    if (tempo === 0) loja.getState().aplicarPendentes();
    const s = loja.getState();
    const total = progressaoAtual(s).graus.length;
    const compasso = compassoAbsoluto % total;

    if (tempo === 0) {
      const acorde = acordesDoLoop(s)[compasso];
      const voz = vozesDoLoopAtual(s)[compasso];
      const duracaoDoCompasso = (60 / transporte.bpm.value) * 4;
      tocarNotas([baixo(acorde, 'fundamental'), ...voz.midis], duracaoDoCompasso * 0.95, quando);
    }
    if (s.metronomo) tocarClique(tempo === 0, quando);
    // Atualiza a tela na hora em que o tempo soa (setTimeout segue funcionando mesmo com a janela escondida).
    const espera = Math.max(0, (quando - Tone.immediate()) * 1000);
    setTimeout(() => {
      if (loja.getState().tocando) loja.getState().setPosicao({ compasso, tempo });
    }, espera);
  }, '4n', 0);
  transporte.start('+0.1');
}

export function desligarLoop(): void {
  const transporte = Tone.getTransport();
  transporte.stop();
  if (repeticao !== null) transporte.clear(repeticao);
  repeticao = null;
  pararSons();
  loja.getState().setTocando(false);
}

/** Posição do loop em compassos (0,5 = metade do 1º compasso), sem a folga de agendamento. */
export function posicaoEmCompassos(): number {
  const transporte = Tone.getTransport();
  if (transporte.state !== 'started') return 0;
  const ticks = transporte.getTicksAtTime(Tone.immediate());
  return Math.max(0, ticks / (transporte.PPQ * 4));
}

loja.subscribe((s, antes) => {
  if (s.bpm !== antes.bpm) Tone.getTransport().bpm.value = s.bpm;
});
