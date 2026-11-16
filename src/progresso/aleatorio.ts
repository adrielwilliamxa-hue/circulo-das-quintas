export type Aleatorio = () => number;

/** Gerador com semente (mulberry32): a mesma semente gera as mesmas perguntas, o que permite testar. */
export function criarAleatorio(semente: number): Aleatorio {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function escolher<T>(rng: Aleatorio, lista: readonly T[]): T {
  return lista[Math.floor(rng() * lista.length)];
}

export function embaralhar<T>(rng: Aleatorio, lista: readonly T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
