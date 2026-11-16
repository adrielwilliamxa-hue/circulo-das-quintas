import { classe, fmt } from '../cerebro/notas';
import { acordesDoTom, simbolo } from '../cerebro/tons';
import type { AcordeDoTom, Tom } from '../cerebro/tipos';

/** Frase literal sobre o que o acorde faz no tom (§6.5, item 1). */
export function oQueFaz(acorde: AcordeDoTom, tom: Tom): string {
  const acordes = acordesDoTom(tom);
  const tonica = acordes[0];
  const nomeTonica = fmt(simbolo(tonica, 'triade'));
  const notaTonica = fmt(tonica.fundamental);

  if (acorde.id === tonica.id) {
    return 'É o acorde de casa: repouso. Ele não pede nenhum acorde depois; começar e terminar aqui soa resolvido.';
  }

  const sensivel = acorde.triade.find((n) => (classe(tonica.fundamental) - classe(n) + 12) % 12 === 1);
  if (acorde.funcao === 'voltar' && sensivel) {
    return (
      `A nota ${fmt(sensivel)} deste acorde fica meio tom abaixo do ${notaTonica}. ` +
      `Quando o acorde muda para ${nomeTonica}, ela sobe até o ${notaTonica}, e o ouvido sente que chegou.`
    );
  }

  if (acorde.funcao === 'voltar') {
    const subtonica = acorde.triade.find((n) => (classe(tonica.fundamental) - classe(n) + 12) % 12 === 2)!;
    const v7 = acordes.find((a) => a.id === 'V7')!;
    return (
      `Faz o papel de voltar, mas fraco: a nota ${fmt(subtonica)} fica 1 tom abaixo do ${notaTonica}, ` +
      `então puxa menos para casa do que o ${fmt(simbolo(v7, 'tetrade'))}.`
    );
  }

  if (acorde.funcao === 'casa') {
    const comuns = acorde.triade.filter((n) => tonica.triade.some((t) => classe(t) === classe(n))).map(fmt);
    return `Tem ${comuns.length} notas em comum com o ${nomeTonica} (${comuns.join(' e ')}). Por isso também soa como casa, só que mais fraco.`;
  }

  const voltar = tom.modo === 'maior' ? simbolo(acordes[4], 'triade') : simbolo(acordes[7], 'tetrade');
  return `Afasta do acorde ${nomeTonica} sem criar muita tensão. Costuma vir antes de um acorde de voltar, como o ${fmt(voltar)}.`;
}
