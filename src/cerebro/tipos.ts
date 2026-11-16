export type Modo = 'maior' | 'menor';
export type Funcao = 'casa' | 'sair' | 'voltar';
export type Forca = 'forte' | 'meio forte' | 'fraco';
export type Formato = 'triade' | 'tetrade' | 'quinta';
export type Marca = 'acorde' | 'tensao' | 'passagem' | 'fora';
export type Inversao = 0 | 1 | 2;
export type BaixoOpcao = 'fundamental' | 'terca' | 'quinta';

export interface Tom {
  tonica: string;
  modo: Modo;
}

export interface AcordeDoTom {
  /** Identificador estável do grau: 'I', 'ii', 'vii°', 'i', 'V7'… */
  id: string;
  grau: string;
  fundamental: string;
  triade: string[];
  tetrade: string[];
  qualidade: 'maior' | 'menor' | 'diminuta';
  tipoTetrade: '7M' | 'm7' | '7' | 'm7(♭5)';
  funcao: Funcao;
  forca: Forca;
  escala: { nome: string; notas: string[] };
  naJanela: boolean;
}
