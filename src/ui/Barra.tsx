import { IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import { nomeDoTom, TONS_MAIORES, TONS_MENORES } from '../cerebro/tons';
import { progressoesDoModo } from '../cerebro/progressoes';
import { useLoja, type Aba, type Mostrar } from '../estado/loja';
import { desligarLoop, ligarLoop } from '../audio/loop';
import { definirVolume } from '../audio/som';
import { NivelAtual } from './NivelAtual';
import type { Modo } from '../cerebro/tipos';

const ABAS: { id: Aba; nome: string }[] = [
  { id: 'estudo', nome: 'Estudo' },
  { id: 'pratica', nome: 'Prática' },
  { id: 'testes', nome: 'Testes' },
];

export function Barra() {
  const s = useLoja((e) => e);
  const valorDoTom = `${s.tom.tonica}|${s.tom.modo}`;

  return (
    <header className="painel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <strong style={{ fontSize: 17 }}>Círculo das Quintas</strong>
        <div role="tablist" aria-label="Abas" style={{ display: 'flex', gap: 6 }}>
          {ABAS.map((a) => (
            <button key={a.id} role="tab" className="botao" aria-selected={s.aba === a.id} onClick={() => s.setAba(a.id)}>
              {a.nome}
            </button>
          ))}
        </div>
        <label className="rotulo">
          Tom{' '}
          <select
            value={valorDoTom}
            onChange={(ev) => {
              const [tonica, modo] = ev.target.value.split('|');
              s.escolherTom({ tonica, modo: modo as Modo });
            }}
          >
            <optgroup label="Tons maiores">
              {TONS_MAIORES.map((t) => (
                <option key={t} value={`${t}|maior`}>
                  {nomeDoTom({ tonica: t, modo: 'maior' })}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tons menores">
              {TONS_MENORES.map((t) => (
                <option key={t} value={`${t}|menor`}>
                  {nomeDoTom({ tonica: t, modo: 'menor' })}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="rotulo">
          Progressão{' '}
          <select value={s.progressaoPendente ?? s.progressaoId} onChange={(ev) => s.escolherProgressao(ev.target.value)}>
            {progressoesDoModo(s.tom.modo).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <button className="botao" onClick={() => (s.tocando ? desligarLoop() : void ligarLoop())}>
          {s.tocando ? <IconPlayerPause size={16} aria-hidden="true" /> : <IconPlayerPlay size={16} aria-hidden="true" />}{' '}
          {s.tocando ? 'Pausar o loop' : 'Tocar o loop'}
        </button>
        <label className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Andamento
          <input type="range" min={40} max={120} step={1} value={s.bpm} onChange={(ev) => s.setBpm(Number(ev.target.value))} />
          {s.bpm} bpm
        </label>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <label className="rotulo">
          <input type="checkbox" checked={s.metronomo} onChange={(ev) => s.setMetronomo(ev.target.checked)} /> Metrônomo
        </label>
        <label className="rotulo" title="O círculo troca de tom sem girar e os blocos da chuva andam em passos, sem deslizar.">
          <input type="checkbox" checked={s.movimentoPorTempo} onChange={(ev) => s.setMovimentoPorTempo(ev.target.checked)} /> Menos
          movimento
        </label>
        <label className="rotulo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.volume}
            onChange={(ev) => {
              s.setVolume(Number(ev.target.value));
              definirVolume(Number(ev.target.value));
            }}
          />
        </label>
        <label className="rotulo">
          Mostrar no teclado{' '}
          <select value={s.mostrar} onChange={(ev) => s.setMostrar(ev.target.value as Mostrar)}>
            <option value="acorde">Só notas do acorde</option>
            <option value="tensao">+ notas de tensão</option>
            <option value="tudo">Tudo (inclui passagem)</option>
          </select>
        </label>
        <NivelAtual />
        {s.tomPendente && <span className="aviso">Muda para {nomeDoTom(s.tomPendente)} no próximo compasso.</span>}
        {s.progressaoPendente && <span className="aviso">A progressão nova entra no próximo compasso.</span>}
        {s.estadoSom === 'carregando' && <span className="aviso">Carregando o piano… enquanto isso, o som é sintetizado.</span>}
        {s.estadoSom === 'sintetizado' && (
          <span className="aviso">O piano gravado não carregou (sem internet?). O som está sintetizado.</span>
        )}
      </div>
    </header>
  );
}
