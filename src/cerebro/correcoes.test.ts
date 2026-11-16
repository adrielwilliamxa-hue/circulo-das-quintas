import { describe, expect, test } from 'vitest';
import { textoDaFatia } from './circulo';
import { acordesDoTom, formatosDoAcorde, textoDaArmadura } from './tons';
import { vozMaisProxima } from './vozes';
import type { Tom } from './tipos';

const doMaior: Tom = { tonica: 'C', modo: 'maior' };
const faSustenidoMaior: Tom = { tonica: 'F#', modo: 'maior' };
const miBemolMenor: Tom = { tonica: 'Eb', modo: 'menor' };

describe('erro 5 — a janela do círculo usa a grafia do acorde do tom', () => {
  test('Fá♯ maior: V é C♯ e iii é A♯m (não D♭ e B♭m)', () => {
    expect(textoDaFatia('dentro', 7, faSustenidoMaior)).toBe('C#');
    expect(textoDaFatia('meio', 7, faSustenidoMaior)).toBe('A#m');
  });

  test('Mi♭ menor: VI é C♭, iv é A♭m, ii° é F°', () => {
    expect(textoDaFatia('dentro', 5, miBemolMenor)).toBe('Cb');
    expect(textoDaFatia('meio', 5, miBemolMenor)).toBe('Abm');
    expect(textoDaFatia('fora', 6, miBemolMenor)).toBe('F°');
  });

  test('fora da janela continua o rótulo do anel', () => {
    expect(textoDaFatia('dentro', 0, faSustenidoMaior)).toBe('C');
    expect(textoDaFatia('dentro', 6, doMaior)).toBe('F#/Gb');
  });
});

describe('erro 14 — armadura no singular', () => {
  test('1 sustenido, 1 bemol, plural e nenhum', () => {
    expect(textoDaArmadura({ tonica: 'G', modo: 'maior' })).toBe('1 sustenido');
    expect(textoDaArmadura({ tonica: 'F', modo: 'maior' })).toBe('1 bemol');
    expect(textoDaArmadura({ tonica: 'D', modo: 'menor' })).toBe('1 bemol');
    expect(textoDaArmadura({ tonica: 'Eb', modo: 'maior' })).toBe('3 bemóis');
    expect(textoDaArmadura(doMaior)).toBe('sem acidentes');
  });
});

describe('erro 6 — "só a quinta" não existe em acorde diminuto', () => {
  test('o vii° de Dó não oferece só a quinta; o G oferece', () => {
    const acordes = acordesDoTom(doMaior);
    expect(formatosDoAcorde(acordes[6])).toEqual(['triade', 'tetrade']);
    expect(formatosDoAcorde(acordes[4])).toEqual(['triade', 'tetrade', 'quinta']);
  });
});

describe('erro 13 — "mais perto" depois de um formato com 2 ou 4 notas', () => {
  const C = acordesDoTom(doMaior)[0];
  test('depois de G5 (G e D), a voz do C mais perto é G-C-E', () => {
    expect(vozMaisProxima(C.triade, [67, 74]).midis).toEqual([67, 72, 76]);
  });
  test('depois de G7 em tétrade, também G-C-E', () => {
    expect(vozMaisProxima(C.triade, [67, 71, 74, 77]).midis).toEqual([67, 72, 76]);
  });
});
