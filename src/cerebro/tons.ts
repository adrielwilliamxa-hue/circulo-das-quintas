import { Key } from 'tonal';
import { fmt, meiasTeclas } from './notas';
import type { AcordeDoTom, Forca, Formato, Funcao, Tom } from './tipos';

export { fmt } from './notas';

export const TONS_MAIORES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
export const TONS_MENORES = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'Eb', 'Bb', 'F', 'C', 'G', 'D'];

const NOMES_DAS_ESCALAS = ['Jônia', 'Dórica', 'Frígia', 'Lídia', 'Mixolídia', 'Eólia', 'Lócria'];

const GRAUS_MAIOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const FUNCOES_MAIOR: Funcao[] = ['casa', 'sair', 'casa', 'sair', 'voltar', 'casa', 'voltar'];
const FORCAS_MAIOR: Forca[] = ['forte', 'meio forte', 'fraco', 'forte', 'forte', 'fraco', 'fraco'];

const GRAUS_MENOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
const FUNCOES_MENOR: Funcao[] = ['casa', 'sair', 'casa', 'sair', 'voltar', 'casa', 'voltar'];
const FORCAS_MENOR: Forca[] = ['forte', 'meio forte', 'fraco', 'forte', 'fraco', 'fraco', 'fraco'];

function rodar(escala: string[], inicio: number): string[] {
  return escala.map((_, i) => escala[(inicio + i) % escala.length]);
}

function qualidadeDe(triade: string[]): AcordeDoTom['qualidade'] {
  const terca = meiasTeclas(triade[0], triade[1]);
  const quinta = meiasTeclas(triade[0], triade[2]);
  if (terca === 4) return 'maior';
  return quinta === 6 ? 'diminuta' : 'menor';
}

function tipoDe(qualidade: AcordeDoTom['qualidade'], setima: number): AcordeDoTom['tipoTetrade'] {
  if (qualidade === 'maior') return setima === 11 ? '7M' : '7';
  return qualidade === 'menor' ? 'm7' : 'm7(♭5)';
}

function acordeSobre(escala: string[], i: number): Pick<AcordeDoTom, 'fundamental' | 'triade' | 'tetrade' | 'qualidade' | 'tipoTetrade'> {
  const notas = rodar(escala, i);
  const triade = [notas[0], notas[2], notas[4]];
  const qualidade = qualidadeDe(triade);
  return {
    fundamental: notas[0],
    triade,
    tetrade: [...triade, notas[6]],
    qualidade,
    tipoTetrade: tipoDe(qualidade, meiasTeclas(notas[0], notas[6])),
  };
}

export function acordesDoTom(tom: Tom): AcordeDoTom[] {
  if (tom.modo === 'maior') {
    const escala = [...Key.majorKey(tom.tonica).scale];
    return escala.map((_, i) => ({
      id: GRAUS_MAIOR[i],
      grau: GRAUS_MAIOR[i],
      ...acordeSobre(escala, i),
      funcao: FUNCOES_MAIOR[i],
      forca: FORCAS_MAIOR[i],
      escala: { nome: NOMES_DAS_ESCALAS[i], notas: rodar(escala, i) },
      naJanela: true,
    }));
  }

  const chave = Key.minorKey(tom.tonica);
  const natural = [...chave.natural.scale];
  const harmonica = [...chave.harmonic.scale];
  const diatonicos: AcordeDoTom[] = natural.map((_, i) => ({
    id: GRAUS_MENOR[i],
    grau: GRAUS_MENOR[i],
    ...acordeSobre(natural, i),
    funcao: FUNCOES_MENOR[i],
    forca: FORCAS_MENOR[i],
    escala: { nome: NOMES_DAS_ESCALAS[(i + 5) % 7], notas: rodar(natural, i) },
    naJanela: true,
  }));
  const v7: AcordeDoTom = {
    id: 'V7',
    grau: 'V7',
    ...acordeSobre(harmonica, 4),
    funcao: 'voltar',
    forca: 'forte',
    escala: { nome: 'Mixo ♭9 ♭13', notas: rodar(harmonica, 4) },
    naJanela: false,
  };
  return [...diatonicos, v7];
}

const SUFIXO_TRIADE = { maior: '', menor: 'm', diminuta: '°' } as const;

/** Cifra do acorde no formato pedido (sem trocar b/# — use `fmt` para exibir). */
export function simbolo(acorde: AcordeDoTom, formato: Formato): string {
  if (formato === 'quinta') return `${acorde.fundamental}5`;
  if (formato === 'tetrade') return acorde.fundamental + acorde.tipoTetrade;
  return acorde.fundamental + SUFIXO_TRIADE[acorde.qualidade];
}

const NOMES_PT: Record<string, string> = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };

export function nomeDaNota(nota: string): string {
  return NOMES_PT[nota[0]] + fmt(nota).slice(1);
}

export function nomeDoTom(tom: Tom): string {
  return `${nomeDaNota(tom.tonica)} ${tom.modo}`;
}

export function armadura(tom: Tom): { quantidade: number; tipo: 'sustenidos' | 'bemóis' | 'nenhum' } {
  const assinatura = tom.modo === 'maior' ? Key.majorKey(tom.tonica).keySignature : Key.minorKey(tom.tonica).keySignature;
  if (!assinatura) return { quantidade: 0, tipo: 'nenhum' };
  return { quantidade: assinatura.length, tipo: assinatura[0] === '#' ? 'sustenidos' : 'bemóis' };
}

/** Texto da armadura com singular e plural certos: "sem acidentes", "1 sustenido", "3 bemóis". */
export function textoDaArmadura(tom: Tom): string {
  const { quantidade, tipo } = armadura(tom);
  if (tipo === 'nenhum') return 'sem acidentes';
  if (quantidade === 1) return tipo === 'sustenidos' ? '1 sustenido' : '1 bemol';
  return `${quantidade} ${tipo}`;
}

/** Formatos que fazem sentido para o acorde: "só a quinta" exige quinta justa, então não existe no diminuto. */
export function formatosDoAcorde(acorde: AcordeDoTom): Formato[] {
  return acorde.qualidade === 'diminuta' ? ['triade', 'tetrade'] : ['triade', 'tetrade', 'quinta'];
}

/** Relativa maior de um tom (o próprio tom, se já for maior). */
export function relativaMaior(tom: Tom): string {
  return tom.modo === 'maior' ? tom.tonica : Key.minorKey(tom.tonica).relativeMajor;
}
