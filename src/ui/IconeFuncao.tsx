import { IconArrowBackUp, IconArrowUpRight, IconHome } from '@tabler/icons-react';
import type { Funcao } from '../cerebro/tipos';

const ICONES = { casa: IconHome, sair: IconArrowUpRight, voltar: IconArrowBackUp };

export function IconeFuncao({ funcao, tamanho = 16 }: { funcao: Funcao; tamanho?: number }) {
  const Icone = ICONES[funcao];
  return <Icone size={tamanho} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px' }} />;
}
