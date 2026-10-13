/**
 * Classes compartilhadas da área do proponente. Só tokens da identidade SECULT
 * (tinta, papel, brand, accent) e alvo de toque de 44px no mínimo.
 *
 * A área alterna duas superfícies: papel claro para ler e preencher (listas,
 * formulários) e tinta escura para o que ancora a tela (menu, faixa de
 * abertura, bloco "agora", rodapé). Cada classe abaixo diz em qual das duas
 * ela vive, porque o anel de foco e o hover mudam de cor entre elas.
 */

/** Anel de foco sobre papel: tinta quase preta, 15:1 contra papel-50. */
export const focoPapel = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900'

/** Anel de foco sobre tinta, terracota ou turquesa: dourado claro, de 5,6:1 a 10,5:1 nesses fundos. */
export const focoEscuro = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400'

const base =
  'inline-flex min-h-[48px] items-center justify-center gap-2 px-5 text-sm font-bold uppercase tracking-wider transition-transform active:scale-[0.98]'

/** Botão cheio de tinta: o principal sobre papel. */
export const botaoTinta = `${base} ${focoPapel} bg-tinta-900 text-papel-50 [@media(hover:hover)]:hover:bg-tinta-700`

/** Botão cheio de papel: o secundário forte sobre blocos escuros. */
export const botaoPapel = `${base} ${focoEscuro} bg-papel-50 text-tinta-900 [@media(hover:hover)]:hover:bg-papel-200`

/**
 * Botão dourado: a ação principal sobre superfície escura. Dourado é a cor da
 * "vitalidade" na identidade e fica acima de 3:1 contra tinta, terracota,
 * turquesa, oliva e ameixa escuras; o texto em tinta passa de 8:1.
 */
export const botaoOuro = `${base} ${focoEscuro} bg-accent-500 text-tinta-950 [@media(hover:hover)]:hover:bg-accent-400`

/**
 * Botão de contorno, para a ação secundária. Herda a cor do texto do bloco
 * (`border-current`), então o mesmo botão serve no papel e na tinta; o anel
 * de foco também segue a cor corrente pelo mesmo motivo.
 */
export const botaoContorno =
  `${base} border-2 border-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ` +
  '[@media(hover:hover)]:hover:bg-[color-mix(in_srgb,currentColor_12%,transparent)]'

/** Link de texto sublinhado, para "Ver todas" e atalhos de seção sobre papel. */
export const linkTexto =
  `inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 ${focoPapel} ` +
  '[@media(hover:hover)]:hover:underline'

/**
 * Faixa de abertura das telas: terracota profunda (brand-800), a cor de
 * "história e memória" da paleta, sangrando até as bordas do miolo. A sombra
 * de 100vmax recortada só na vertical estende o fundo para os lados sem
 * depender da largura do contêiner centralizado; o `overflow-x-clip` do
 * `<main>` no layout segura a sobra.
 */
export const faixaAbertura =
  'bg-brand-800 text-papel-50 [box-shadow:0_0_0_100vmax_rgb(var(--brand-800))] [clip-path:inset(0_-100vmax)] ' +
  '-mt-6 py-8 lg:-mt-10 lg:py-10'
