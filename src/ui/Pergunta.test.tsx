import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Pergunta } from './Pergunta';
import type { Pergunta as TipoPergunta } from '../progresso/perguntas';

vi.mock('../audio/som', () => ({ tocarAgora: vi.fn(), tocarSequencia: vi.fn() }));

const pergunta: TipoPergunta = {
  tipo: 'teclado',
  habilidade: 'n1-notas',
  enunciado: 'Clique numa tecla C♯ (também chamada D♭).',
  dica: 'Qualquer oitava vale.',
  conferencia: { tipo: 'uma-classe', classes: [1] },
  nomes: ['C#'],
  explicacao: 'C♯ é a 1ª tecla preta do grupo de 2.',
};

describe('erro 7 — dá para responder pelo teclado do computador', () => {
  test('Tab chega no teclado, as setas andam e Enter marca a tecla; Responder confere', () => {
    const aoResponder = vi.fn();
    render(<Pergunta pergunta={pergunta} aoResponder={aoResponder} />);
    const teclado = screen.getByRole('group', { name: /Teclado para responder/ });
    expect(teclado.getAttribute('tabindex')).toBe('0');
    teclado.focus();
    fireEvent.keyDown(teclado, { key: 'ArrowRight' });
    fireEvent.keyDown(teclado, { key: 'Enter' });
    expect(screen.getByText(/Escolhidas: C♯/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
    expect(aoResponder).toHaveBeenCalledWith(true);
  });
});
