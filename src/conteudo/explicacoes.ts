/**
 * Textos fixos dos "Por quê?" (§6.8): 2 a 4 frases curtas, literais.
 * Base: notas de estudo do vault (Opus 3 e "All the Music Theory a Producer Needs"), escritas com palavras próprias.
 */
export const POR_QUE = {
  circulo: [
    'Cada fatia é um tom. Andar uma fatia no sentido do relógio soma 1 sustenido (ou tira 1 bemol).',
    'Tons vizinhos diferem em só 1 acidente, por isso combinam bem entre si.',
    'Os acordes I, IV e V ficam na fatia do tom e nas duas fatias ao lado. A relativa menor fica na mesma fatia, no anel do meio.',
    'A janela mostra os 7 acordes do tom: embaixo os maiores, no meio os menores, no topo o diminuto.',
  ],
  funcoes: [
    'Casa (tônica): acordes de repouso. Não pedem nada depois.',
    'Sair (subdominante): afastam do repouso com pouca tensão.',
    'Voltar (dominante): têm uma nota que fica meio tom abaixo da tônica. Essa nota quer subir, e o ouvido pede o acorde de casa logo depois.',
    '"Forte", "meio forte" e "fraco" dizem o quanto o acorde cumpre aquela função. Os fracos dividem notas com o acorde forte do grupo.',
  ],
  montagem: [
    'Todo acorde é uma pilha de terças a partir da fundamental, a nota que dá nome ao acorde.',
    'Maior = terça maior (4 meias-teclas) + terça menor (3). Menor = 3 + 4. Diminuta = 3 + 3.',
    'Meia-tecla é a distância entre duas teclas vizinhas, contando as pretas.',
  ],
  quinta: [
    'Só a fundamental e a quinta (7 meias-teclas acima). Sem a terça, o som não é maior nem menor.',
    'É muito usado em trap e rock porque soa forte e não atrapalha a melodia.',
  ],
  tetrade: [
    'A tétrade soma mais uma terça em cima da tríade: a 7ª.',
    'A 7ª dá ao acorde uma direção para onde ir. No acorde de voltar (7), ela desce para a 3ª do acorde de casa.',
  ],
  inversoes: [
    'Inverter é mudar a ordem das mesmas notas: a de baixo vai para cima.',
    'O app marca a inversão que faz a mão andar menos em relação ao acorde anterior. Assim o som fica ligado e os dedos se movem pouco.',
    'Dedilhado: 1 = polegar, 5 = mindinho.',
  ],
  baixo: [
    'O baixo é a nota mais grave, tocada pela mão esquerda.',
    'Normalmente é a fundamental. Pôr a 3ª ou a 5ª no baixo (G/B, G/D) é a inversão do acorde inteiro: o baixo anda por passos menores entre os acordes.',
  ],
  ponte: [
    'A ponte é o acorde que prepara a chegada em outro. Ele fica uma 5ª acima do acorde que vem depois.',
    'A 3ª dele fica meio tom abaixo da fundamental do próximo acorde e sobe até ela. É por isso que a chegada soa natural.',
    'Acordes diminutos não recebem ponte, porque são instáveis demais para servir de chegada.',
    'A escala sobre a ponte junta as notas do acorde da ponte com as notas do tom nos outros graus. Assim, quase tudo o que você toca continua dentro do tom.',
  ],
  escala: [
    'É a escala do próprio tom, começando na fundamental deste acorde.',
    'Ela diz quais notas usar por cima: as do acorde são firmes, as de tensão colorem, as de passagem só servem no caminho.',
  ],
  teclado: [
    '● Nota do acorde: pode parar e segurar. Comece e termine as frases aqui, de preferência no tempo forte.',
    '○ Nota de tensão: fica 1 tom acima de uma nota do acorde. Colore o acorde; boa na melodia, principalmente no tempo fraco.',
    '→ Nota de passagem: fica meio tom acima de uma nota do acorde e raspa nela. Use só no caminho entre duas notas, sem parar.',
    'Sem marca: fora do tom. Evite por enquanto. ■ Baixo: a nota grave da mão esquerda.',
  ],
  faixa: [
    'O compasso tem 4 tempos: 1 forte, 2 fraco, 3 meio forte, 4 fraco.',
    'No tempo forte, o ouvido espera estabilidade: é a hora de uma nota do acorde.',
    'Nos tempos fracos há liberdade para notas de tensão e de passagem.',
  ],
} as const;

/** Dicas fixas para improvisar (§7.8). */
export const DICAS = [
  'Mão esquerda segura o baixo; mão direita toca uma nota de cada vez.',
  'Tempo forte (1 e 3): uma nota do acorde. Tempo fraco (2 e 4): liberdade para tensão e passagem.',
  'Poucas notas: de 2 a 4 por compasso já bastam.',
  'Passos pequenos: a maior parte dos movimentos deve ser de 2ª ou 3ª.',
  'Para fechar uma frase, desça.',
  'Repetir uma frase curta enquanto os acordes mudam (ostinato) é uma técnica válida, não preguiça.',
];
