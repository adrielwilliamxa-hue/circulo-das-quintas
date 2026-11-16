import * as Tone from 'tone';
import { CacheStorage, SplendidGrandPiano } from 'smplr';
import { loja } from '../estado/loja';

/** Tempo máximo esperando o piano gravado antes de ficar com o som sintetizado. */
const ESPERA_DO_PIANO_MS = 15000;

let contexto: AudioContext | null = null;
let ganho: GainNode | null = null;
let piano: ReturnType<typeof SplendidGrandPiano> | null = null;
let reserva: Tone.PolySynth | null = null;
let clique: Tone.Synth | null = null;
let iniciando: Promise<void> | null = null;

/** Liga o áudio. Precisa ser chamado a partir de um clique (regra do navegador). */
export function iniciarSom(): Promise<void> {
  if (iniciando) return iniciando.then(() => contexto?.resume());
  iniciando = (async () => {
    contexto = new AudioContext();
    Tone.setContext(contexto);
    await Tone.start();
    ganho = contexto.createGain();
    ganho.gain.value = loja.getState().volume;
    ganho.connect(contexto.destination);
    // Modo teste (?teste na URL): deixa a conferência automática gravar o que o app toca.
    if (new URLSearchParams(window.location.search).has('teste')) {
      (window as unknown as { __circuloSom?: { contexto: AudioContext; ganho: GainNode } }).__circuloSom = { contexto, ganho };
    }

    reserva = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.25, release: 1.2 },
    }).connect(ganho);
    reserva.volume.value = -10;
    clique = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 } }).connect(ganho);
    clique.volume.value = -14;

    loja.getState().setEstadoSom('carregando');
    piano = SplendidGrandPiano(contexto, { storage: CacheStorage(), destination: ganho });
    const desistir = setTimeout(() => {
      if (loja.getState().estadoSom === 'carregando') loja.getState().setEstadoSom('sintetizado');
    }, ESPERA_DO_PIANO_MS);
    piano.ready
      .then(() => loja.getState().setEstadoSom('pronto'))
      .catch(() => loja.getState().setEstadoSom('sintetizado'))
      .finally(() => clearTimeout(desistir));
  })();
  return iniciando;
}

/** Toca notas (números MIDI) agora ou no instante `quando` do relógio de áudio. */
export function tocarNotas(midis: number[], duracao = 1.4, quando?: number): void {
  if (!contexto) return;
  if (loja.getState().estadoSom === 'pronto' && piano) {
    for (const note of midis) piano.start({ note, time: quando, duration: duracao, velocity: 75 });
    return;
  }
  reserva?.triggerAttackRelease(
    midis.map((m) => Tone.Frequency(m, 'midi').toFrequency()),
    duracao,
    quando,
  );
}

/** Toca uma sequência de acordes, um depois do outro. */
export async function tocarSequencia(acordes: number[][], duracaoDeCada = 1.1): Promise<void> {
  await iniciarSom();
  const inicio = (contexto?.currentTime ?? 0) + 0.05;
  acordes.forEach((midis, i) => tocarNotas(midis, duracaoDeCada, inicio + i * duracaoDeCada));
}

export async function tocarAgora(midis: number[], duracao?: number): Promise<void> {
  await iniciarSom();
  tocarNotas(midis, duracao);
}

export function tocarClique(forte: boolean, quando: number): void {
  clique?.triggerAttackRelease(forte ? 'C6' : 'G5', 0.05, quando, forte ? 1 : 0.6);
}

export function pararSons(): void {
  piano?.stop();
  reserva?.releaseAll();
}

export function definirVolume(volume: number): void {
  if (ganho) ganho.gain.value = volume;
}
