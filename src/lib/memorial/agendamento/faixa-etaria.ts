/**
 * Faixa etária do grupo. O pedido grava um texto legível ("Fundamental I (6 a 10 anos)"
 * ou "Entre 8 e 12 anos"), montado sempre a partir de duas idades validadas. O relatório
 * reagrupa esse texto pelas mesmas faixas, inclusive os pedidos antigos, que tinham
 * a faixa digitada livremente.
 */

export const IDADE_MAXIMA = 120

export interface FaixaEtaria {
  id: string
  rotulo: string
  de: number
  ate: number
}

/** Faixas que o Memorial já usava no relatório, agora com o intervalo de idade explícito. */
export const FAIXAS_ETARIAS: readonly FaixaEtaria[] = [
  { id: 'infantil', rotulo: 'Educação infantil', de: 0, ate: 5 },
  { id: 'fundamental-1', rotulo: 'Fundamental I', de: 6, ate: 10 },
  { id: 'fundamental-2', rotulo: 'Fundamental II', de: 11, ate: 14 },
  { id: 'medio', rotulo: 'Ensino médio', de: 15, ate: 17 },
  { id: 'adultos', rotulo: 'Adultos', de: 18, ate: 59 },
  { id: 'terceira-idade', rotulo: 'Terceira idade', de: 60, ate: IDADE_MAXIMA },
]

export const FAIXA_PERSONALIZADA = 'personalizada'

const SEM_FAIXA = 'Não informada'

/** "6 a 10 anos", "8 anos" ou "60 anos ou mais". */
export function intervaloDeIdades(de: number, ate: number): string {
  if (ate >= IDADE_MAXIMA) return `${de} anos ou mais`
  return de === ate ? `${de} anos` : `${de} a ${ate} anos`
}

export function faixaPorIntervalo(de: number, ate: number): FaixaEtaria | undefined {
  return FAIXAS_ETARIAS.find((f) => f.de === de && f.ate === ate)
}

export function rotuloDaFaixa(f: FaixaEtaria): string {
  return `${f.rotulo} (${intervaloDeIdades(f.de, f.ate)})`
}

/** Texto gravado no pedido: o nome da faixa quando o intervalo coincide com uma delas. */
export function descreverFaixaEtaria(de: number, ate: number): string {
  const faixa = faixaPorIntervalo(de, ate)
  if (faixa) return rotuloDaFaixa(faixa)
  return ate >= IDADE_MAXIMA || de === ate ? intervaloDeIdades(de, ate) : `Entre ${de} e ${ate} anos`
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Chave de agrupamento do relatório. Reconhece o nome de uma faixa conhecida ou um
 * intervalo "X a Y"; o que não se encaixa (texto livre de pedidos antigos) fica como veio.
 */
export function grupoDaFaixaEtaria(texto: string | null | undefined): string {
  const limpo = texto?.trim()
  if (!limpo) return SEM_FAIXA
  const pelaNome = FAIXAS_ETARIAS.find((f) => normalizar(limpo).startsWith(normalizar(f.rotulo)))
  if (pelaNome) return rotuloDaFaixa(pelaNome)
  const numeros = limpo.match(/(\d{1,3})\D+(\d{1,3})/)
  if (numeros) {
    const [de, ate] = [Number(numeros[1]), Number(numeros[2])]
    if (de <= ate && ate <= IDADE_MAXIMA) return descreverFaixaEtaria(de, ate)
  }
  return limpo
}
