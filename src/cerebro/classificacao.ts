import { Key, Note } from 'tonal';
import { classe, fmt, meiasTeclas } from './notas';
import { armadura, simbolo } from './tons';
import type { AcordeDoTom, Formato, Marca, Tom } from './tipos';

/** Rótulo das notas do acorde, pela distância em meias-teclas da fundamental. */
const ROTULO_ACORDE: Record<number, string> = { 0: '1', 3: '♭3', 4: '3', 6: '♭5', 7: '5', 9: '6', 10: '♭7', 11: '7' };
/** Notas de tensão usam o intervalo composto (9, 11, 13). */
const ROTULO_TENSAO: Record<number, string> = { 1: '♭9', 2: '9', 3: '#9', 5: '11', 6: '#11', 8: '♭13', 9: '13' };
/** Notas de passagem usam o intervalo simples (2, 4, 6). */
const ROTULO_PASSAGEM: Record<number, string> = { 1: '♭2', 2: '2', 5: '4', 6: '#4', 8: '♭6', 9: '6' };

const PAPEL: Record<string, string> = {
  '1': 'a fundamental', '♭3': 'a 3ª', '3': 'a 3ª', '♭5': 'a 5ª', '5': 'a 5ª', '6': 'a 6ª', '♭7': 'a 7ª', '7': 'a 7ª',
};

interface Detalhe {
  marca: Marca;
  rotulo: string;
  /** Nota do acorde logo abaixo (para tensão e passagem). */
  abaixo?: string;
  /** Distância até a nota de baixo: 1 ou 2 meias-teclas. */
  distancia?: number;
  motivo?: 'sensivel-do-ii' | 'nona-menor-do-dominante' | 'decima-terceira-menor-do-dominante' | 'cor-da-triade';
}

function detalhar(nota: string, acorde: AcordeDoTom, tom: Tom, formato: Formato): Detalhe {
  const daFundamental = meiasTeclas(acorde.fundamental, nota);
  const naTetrade = acorde.tetrade.some((n) => classe(n) === classe(nota));
  const ehSetima = classe(acorde.tetrade[3]) === classe(nota);
  const ehSextaDo7M = acorde.tipoTetrade === '7M' && daFundamental === 9;

  if (naTetrade || ehSextaDo7M) {
    const rotulo = ROTULO_ACORDE[daFundamental];
    if (formato !== 'tetrade' && (ehSetima || ehSextaDo7M)) return { marca: 'tensao', rotulo, motivo: 'cor-da-triade' };
    return { marca: 'acorde', rotulo };
  }

  if (!acorde.escala.notas.some((n) => classe(n) === classe(nota))) return { marca: 'fora', rotulo: '' };

  const abaixo = acorde.tetrade
    .map((n) => ({ n, d: (classe(nota) - classe(n) + 12) % 12 }))
    .filter(({ d }) => d > 0)
    .sort((a, b) => a.d - b.d)[0];

  if (acorde.tipoTetrade === '7' && daFundamental === 1) {
    return { marca: 'tensao', rotulo: ROTULO_TENSAO[1], abaixo: abaixo.n, distancia: 1, motivo: 'nona-menor-do-dominante' };
  }
  // ♭13 do dominante: meio tom acima da 5ª, mas é tensão aceita (dá nome à escala Mixo ♭9 ♭13).
  if (acorde.tipoTetrade === '7' && daFundamental === 8) {
    return { marca: 'tensao', rotulo: ROTULO_TENSAO[8], abaixo: abaixo.n, distancia: 1, motivo: 'decima-terceira-menor-do-dominante' };
  }
  if (tom.modo === 'maior' && acorde.id === 'ii' && daFundamental === 9) {
    return { marca: 'passagem', rotulo: ROTULO_PASSAGEM[9], abaixo: abaixo.n, distancia: 2, motivo: 'sensivel-do-ii' };
  }
  if (abaixo.d === 1) return { marca: 'passagem', rotulo: ROTULO_PASSAGEM[daFundamental], abaixo: abaixo.n, distancia: 1 };
  return { marca: 'tensao', rotulo: ROTULO_TENSAO[daFundamental], abaixo: abaixo.n, distancia: abaixo.d };
}

export function classificar(nota: string, acorde: AcordeDoTom, tom: Tom, formato: Formato): { marca: Marca; rotulo: string } {
  const { marca, rotulo } = detalhar(nota, acorde, tom, formato);
  return { marca, rotulo };
}

export function fraseDaTecla(nota: string, acorde: AcordeDoTom, tom: Tom, formato: Formato): string {
  const d = detalhar(nota, acorde, tom, formato);
  const n = fmt(nota);
  const a = fmt(simbolo(acorde, formato));
  const inicio = `${n} sobre ${a}:`;

  if (d.marca === 'fora') return `${inicio} fora do tom — evite por enquanto.`;
  if (d.marca === 'acorde') return `${inicio} nota do acorde (${PAPEL[d.rotulo]}) — pode parar e segurar.`;
  if (d.motivo === 'cor-da-triade') {
    return `${inicio} nota de tensão (${d.rotulo}) — não está na tríade, mas não raspa em nenhuma nota dela; colore o acorde.`;
  }
  if (d.motivo === 'nona-menor-do-dominante') {
    return `${inicio} nota de tensão (♭9) — fica meio tom acima da fundamental, mas nos acordes de voltar essa tensão é aceita e aumenta a vontade de resolver.`;
  }
  if (d.motivo === 'sensivel-do-ii') {
    return `${inicio} nota de passagem — é a sensível do tom (puxa para a tônica) e faria o ${a} soar como acorde de voltar; use só no caminho.`;
  }
  const abaixo = fmt(d.abaixo!);
  const papel = PAPEL[ROTULO_ACORDE[meiasTeclas(acorde.fundamental, d.abaixo!)]];
  if (d.motivo === 'decima-terceira-menor-do-dominante') {
    return `${inicio} nota de tensão (♭13) — fica meio tom acima do ${abaixo}, ${papel} do ${a}, mas nos acordes de voltar essa tensão é aceita e aumenta a vontade de resolver.`;
  }
  if (d.marca === 'passagem') return `${inicio} nota de passagem — fica meio tom acima do ${abaixo}, ${papel} do ${a}`;
  return `${inicio} nota de tensão (${d.rotulo}) — fica 1 tom acima do ${abaixo}, ${papel} do ${a}; colore o acorde, melhor em tempo fraco.`;
}

/** Nome de uma tecla (número MIDI) com a grafia do tom; fora do tom, segue o acidente da armadura. */
export function nomeNaTonalidade(midi: number, tom: Tom): string {
  const escala =
    tom.modo === 'maior'
      ? Key.majorKey(tom.tonica).scale
      : [...Key.minorKey(tom.tonica).natural.scale, ...Key.minorKey(tom.tonica).harmonic.scale];
  const daEscala = escala.find((n) => classe(n) === midi % 12);
  if (daEscala) return daEscala;
  const usaBemol = armadura(tom).tipo === 'bemóis';
  return Note.pitchClass(usaBemol ? Note.fromMidi(midi) : Note.fromMidiSharps(midi));
}
