/**
 * Classes compartilhadas das telas do Memorial. Só cores da identidade SECULT
 * (tinta, papel, brand, accent, oliva, turquesa, ameixa), nunca slate nem azul.
 * Campos e botões com no mínimo 44px de altura para o toque no celular.
 */

export const campo =
  'w-full min-h-[44px] rounded-lg border border-tinta-900/20 bg-white px-3 text-sm text-tinta-900 placeholder:text-tinta-500/60 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500'

export const rotuloCampo = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-tinta-600'

const botaoBase =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:opacity-50'

export const botaoPrimario = `${botaoBase} bg-brand-600 text-white hover:bg-brand-700`
export const botaoNeutro = `${botaoBase} border border-tinta-900/20 bg-white text-tinta-800 hover:bg-papel-100`
export const botaoPerigo = `${botaoBase} border border-red-300 bg-white text-red-700 hover:bg-red-50`
export const botaoSucesso = `${botaoBase} bg-oliva-700 text-white hover:bg-oliva-800`

export const linkDiscreto =
  'text-sm font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent-500'
