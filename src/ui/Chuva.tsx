import { useEffect, useRef } from 'react';
import { acordesDoLoop, loja, vozesDoLoopAtual } from '../estado/loja';
import { baixo } from '../cerebro/vozes';
import { posicaoEmCompassos } from '../audio/loop';
import { COR } from './cores';
import { LARGURA_TECLADO } from './geometriaTeclado';
import { blocosVisiveis, type VozDaChuva } from './geometriaChuva';

const ALTURA = 380;

function vozesDaChuva(): VozDaChuva[] {
  const s = loja.getState();
  const vozes = vozesDoLoopAtual(s);
  return acordesDoLoop(s).map((a, i) => ({ midis: vozes[i].midis, baixo: baixo(a, 'fundamental'), funcao: a.funcao }));
}

/** Chuva de notas na vertical: os blocos caem e chegam ao teclado quando o acorde soa. */
export function Chuva() {
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let quadro = 0;
    const desenhar = () => {
      const canvas = tela.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const escala = canvas.width / LARGURA_TECLADO;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#F6F2EA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const s = loja.getState();
        const posicao = s.tocando ? posicaoEmCompassos() : 0;
        const agora = s.movimentoPorTempo ? Math.floor(posicao * 4) / 4 : posicao;
        const porCompasso = canvas.height / 2;
        for (let m = Math.floor(agora); m <= Math.floor(agora) + 2; m++) {
          for (let tempo = 0; tempo < 4; tempo++) {
            const y = canvas.height - (m + tempo / 4 - agora) * porCompasso;
            if (y < 0 || y > canvas.height) continue;
            ctx.strokeStyle = tempo === 0 ? 'rgba(139,90,43,.55)' : 'rgba(0,0,0,.08)';
            ctx.lineWidth = tempo === 0 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
        }
        for (const b of blocosVisiveis(posicao, vozesDaChuva(), canvas.height, s.movimentoPorTempo)) {
          const cor = COR[b.funcao];
          ctx.fillStyle = b.baixo ? cor.borda : cor.fundo;
          ctx.strokeStyle = cor.borda;
          ctx.lineWidth = 2;
          const x = b.x * escala + 2;
          const largura = b.largura * escala - 4;
          ctx.beginPath();
          ctx.roundRect(x, b.y + 3, largura, b.altura - 6, 6);
          ctx.fill();
          ctx.stroke();
        }
      }
      quadro = requestAnimationFrame(desenhar);
    };
    quadro = requestAnimationFrame(desenhar);
    return () => cancelAnimationFrame(quadro);
  }, []);

  return (
    <div>
      <canvas
        ref={tela}
        width={LARGURA_TECLADO * 2}
        height={ALTURA * 2}
        style={{ width: '100%', height: 'clamp(180px, 30vh, 340px)', display: 'block', borderRadius: '10px 10px 0 0' }}
        role="img"
        aria-label="Chuva de notas: os blocos dos acordes do loop caem até o teclado."
      />
    </div>
  );
}
