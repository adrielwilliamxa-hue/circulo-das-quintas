import { useEffect } from 'react';
import { useLoja } from './estado/loja';
import { lojaProgresso } from './progresso/estadoProgresso';
import { Barra } from './ui/Barra';
import { AbaEstudo } from './ui/AbaEstudo';
import { AbaPratica } from './ui/AbaPratica';
import { AbaTestes } from './ui/AbaTestes';

export default function App() {
  const aba = useLoja((s) => s.aba);

  useEffect(() => {
    void lojaProgresso.getState().carregar();
  }, []);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Barra />
      <main role="tabpanel" aria-label={aba}>
        {aba === 'estudo' && <AbaEstudo />}
        {aba === 'pratica' && <AbaPratica />}
        {aba === 'testes' && <AbaTestes />}
      </main>
    </div>
  );
}
