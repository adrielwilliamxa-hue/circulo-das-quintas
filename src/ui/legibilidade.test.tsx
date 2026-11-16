import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { Barra } from './Barra';
import { AcordesDoTom } from './AcordesDoTom';
import { FaixaLoop } from './FaixaLoop';
import { Circulo } from './Circulo';
import { loja } from '../estado/loja';

vi.mock('../audio/som', () => ({ tocarAgora: vi.fn(), tocarSequencia: vi.fn(), tocarNotas: vi.fn(), definirVolume: vi.fn() }));
vi.mock('../audio/loop', () => ({ ligarLoop: vi.fn(), desligarLoop: vi.fn() }));

afterEach(cleanup);

/** Menor tamanho de fonte (px) declarado direto nos elementos HTML renderizados. */
function menorFonte(container: HTMLElement): number {
  const tamanhos = [...container.querySelectorAll<HTMLElement>('[style]')]
    .map((el) => parseFloat(el.style.fontSize))
    .filter((n) => !Number.isNaN(n));
  return Math.min(...tamanhos);
}

describe('requisito 8 do design: texto com no mínimo 14px', () => {
  test('o CSS não declara nenhuma fonte menor que 14px', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const tamanhos = [...css.matchAll(/font-size:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(Math.min(...tamanhos)).toBeGreaterThanOrEqual(14);
  });

  test('os acordes do tom e a faixa do loop não usam fonte menor que 14px', () => {
    expect(menorFonte(render(<AcordesDoTom />).container)).toBeGreaterThanOrEqual(14);
    expect(menorFonte(render(<FaixaLoop />).container)).toBeGreaterThanOrEqual(14);
  });

  test('o círculo grande não tem letra menor que 12 unidades (a coluna fixa de 380px desenha 300 unidades em 350px: 12 × 1,167 = 14px)', () => {
    loja.setState({ tom: { tonica: 'C', modo: 'maior' } });
    const { container } = render(<Circulo />);
    const tamanhos = [...container.querySelectorAll('svg text')].map((t) => Number(t.getAttribute('font-size')));
    expect(Math.min(...tamanhos)).toBeGreaterThanOrEqual(12);
  });

  test('o círculo compacto (160px) não desenha letras e mostra o nome do tom em texto legível', () => {
    loja.setState({ tom: { tonica: 'C', modo: 'maior' } });
    const { container, getByText } = render(<Circulo compacto />);
    expect(container.querySelectorAll('svg text')).toHaveLength(0);
    const nome = getByText('Dó maior');
    expect(nome.closest('svg')).toBeNull();
    expect(parseFloat(nome.style.fontSize)).toBeGreaterThanOrEqual(14);
  });
});

describe('requisito 8 do design: botão para desligar as animações', () => {
  /** Transições dos grupos que giram com a janela do círculo. */
  const transicoesDoCirculo = (container: HTMLElement) =>
    [...container.querySelectorAll<SVGGElement>('g[style]')].map((g) => g.style.transition);

  test('a barra tem o controle "Menos movimento", ligado ao mesmo estado da chuva', () => {
    loja.setState({ movimentoPorTempo: false });
    const { getByLabelText } = render(<Barra />);
    fireEvent.click(getByLabelText(/Menos movimento/));
    expect(loja.getState().movimentoPorTempo).toBe(true);
  });

  test('com menos movimento, o círculo troca de tom sem girar', () => {
    loja.setState({ movimentoPorTempo: false });
    expect(transicoesDoCirculo(render(<Circulo />).container).some((t) => t.includes('350ms'))).toBe(true);
    loja.setState({ movimentoPorTempo: true });
    expect(transicoesDoCirculo(render(<Circulo />).container).every((t) => t === '' || t === 'none')).toBe(true);
  });
});
