import { describe, expect, test } from 'vitest';
import { acordesDoTom, armadura, fmt, nomeDoTom, simbolo } from './tons';

const doMaior = { tonica: 'C', modo: 'maior' } as const;
const miBemolMaior = { tonica: 'Eb', modo: 'maior' } as const;
const laMenor = { tonica: 'A', modo: 'menor' } as const;

describe('acordes do tom', () => {
  test('E♭ maior tem a grafia certa nas tríades', () => {
    expect(acordesDoTom(miBemolMaior).map((a) => fmt(simbolo(a, 'triade')))).toEqual([
      'E♭', 'Fm', 'Gm', 'A♭', 'B♭', 'Cm', 'D°',
    ]);
  });

  test('Lá menor tem o campo natural e o E7 da harmônica fora da janela', () => {
    const acordes = acordesDoTom(laMenor);
    expect(acordes.map((a) => simbolo(a, 'triade'))).toEqual(['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G', 'E']);
    const v7 = acordes.find((a) => a.id === 'V7')!;
    expect(v7.tetrade).toEqual(['E', 'G#', 'B', 'D']);
    expect(v7.naJanela).toBe(false);
    expect(v7.escala).toEqual({ nome: 'Mixo ♭9 ♭13', notas: ['E', 'F', 'G#', 'A', 'B', 'C', 'D'] });
  });

  test('E♭ menor usa C♭ e G♭', () => {
    expect(acordesDoTom({ tonica: 'Eb', modo: 'menor' }).slice(0, 7).map((a) => a.fundamental)).toEqual([
      'Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db',
    ]);
  });

  test('F# maior termina em E#', () => {
    expect(acordesDoTom({ tonica: 'F#', modo: 'maior' })[6].fundamental).toBe('E#');
  });

  test('graus, funções, forças e tétrades do tom maior', () => {
    const acordes = acordesDoTom(doMaior);
    expect(acordes.map((a) => a.grau)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    expect(acordes.map((a) => a.funcao)).toEqual(['casa', 'sair', 'casa', 'sair', 'voltar', 'casa', 'voltar']);
    expect(acordes.map((a) => a.forca)).toEqual(['forte', 'meio forte', 'fraco', 'forte', 'forte', 'fraco', 'fraco']);
    expect(acordes.map((a) => simbolo(a, 'tetrade'))).toEqual(['C7M', 'Dm7', 'Em7', 'F7M', 'G7', 'Am7', 'Bm7(♭5)']);
    expect(acordes.map((a) => a.escala.nome)).toEqual([
      'Jônia', 'Dórica', 'Frígia', 'Lídia', 'Mixolídia', 'Eólia', 'Lócria',
    ]);
  });

  test('graus, funções, forças e escalas do tom menor', () => {
    const acordes = acordesDoTom(laMenor);
    expect(acordes.map((a) => a.grau)).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII', 'V7']);
    expect(acordes.map((a) => a.funcao)).toEqual(['casa', 'sair', 'casa', 'sair', 'voltar', 'casa', 'voltar', 'voltar']);
    expect(acordes.map((a) => a.forca)).toEqual(['forte', 'meio forte', 'fraco', 'forte', 'fraco', 'fraco', 'fraco', 'forte']);
    expect(acordes.slice(0, 7).map((a) => a.escala.nome)).toEqual([
      'Eólia', 'Lócria', 'Jônia', 'Dórica', 'Frígia', 'Lídia', 'Mixolídia',
    ]);
  });

  test('só a quinta usa o número 5', () => {
    expect(simbolo(acordesDoTom(doMaior)[4], 'quinta')).toBe('G5');
  });
});

describe('nomes e armaduras', () => {
  test('nome do tom em português', () => {
    expect(nomeDoTom(miBemolMaior)).toBe('Mi♭ maior');
    expect(nomeDoTom({ tonica: 'F#', modo: 'maior' })).toBe('Fá♯ maior');
    expect(nomeDoTom(laMenor)).toBe('Lá menor');
  });

  test('armadura', () => {
    expect(armadura(laMenor)).toEqual({ quantidade: 0, tipo: 'nenhum' });
    expect(armadura(miBemolMaior)).toEqual({ quantidade: 3, tipo: 'bemóis' });
    expect(armadura({ tonica: 'F#', modo: 'maior' })).toEqual({ quantidade: 6, tipo: 'sustenidos' });
    expect(armadura({ tonica: 'Eb', modo: 'menor' })).toEqual({ quantidade: 6, tipo: 'bemóis' });
  });

  test('fmt troca b e # pelos símbolos', () => {
    expect(fmt('Eb')).toBe('E♭');
    expect(fmt('F#m')).toBe('F♯m');
    expect(fmt('B')).toBe('B');
    expect(fmt('Bbm7(♭5)')).toBe('B♭m7(♭5)');
  });
});
