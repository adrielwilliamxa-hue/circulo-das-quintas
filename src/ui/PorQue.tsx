import { useId } from 'react';
import { IconHelp } from '@tabler/icons-react';

/** Botão "Por quê?" que abre uma explicação curta (atributo nativo `popover`). */
export function PorQue({ frases, titulo }: { frases: readonly string[]; titulo: string }) {
  const id = `porque-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <>
      <button type="button" className="botao-porque" popoverTarget={id} aria-label={`Por quê? ${titulo}`}>
        Por quê? <IconHelp size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} />
      </button>
      <div id={id} popover="auto" role="note">
        <strong>{titulo}</strong>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {frases.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
