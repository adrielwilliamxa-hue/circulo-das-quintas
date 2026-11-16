import { NIVEIS } from '../progresso/niveis';
import { estadoDaHabilidade, nivelAtual, respostasDa } from '../progresso/dominio';
import { useProgresso } from '../progresso/estadoProgresso';
import { useLoja } from '../estado/loja';

/** Nível atual, sempre visível no topo; clicar abre a aba Testes. */
export function NivelAtual() {
  const respostas = useProgresso((p) => p.respostas);
  const setAba = useLoja((s) => s.setAba);
  const nivel = NIVEIS.find((n) => n.numero === nivelAtual(respostas))!;
  const dominadas = nivel.habilidades.filter((h) => estadoDaHabilidade(respostasDa(h.id, respostas)) === 'dominada').length;
  return (
    <button className="botao" onClick={() => setAba('testes')} aria-label={`Nível ${nivel.numero}, ${nivel.nome}. Abrir a aba Testes.`}>
      Nível {nivel.numero} — {nivel.nome} · {dominadas} de {nivel.habilidades.length} dominadas
    </button>
  );
}
