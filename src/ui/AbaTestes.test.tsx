import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AbaTestes } from './AbaTestes';
import { lojaProgresso } from '../progresso/estadoProgresso';

vi.mock('../audio/som', () => ({ tocarAgora: vi.fn(), tocarSequencia: vi.fn() }));

test('erro 15b — o aviso de falha na gravação continua visível durante o teste', () => {
  lojaProgresso.setState({ respostas: [], gravacao: 'so-no-navegador' });
  render(<AbaTestes />);
  fireEvent.click(screen.getAllByRole('button', { name: /Fazer teste/ })[0]);
  expect(screen.getByText(/Não consegui gravar no vault agora/)).toBeTruthy();
});
