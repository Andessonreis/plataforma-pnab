import { Anton, Questrial } from 'next/font/google'

/**
 * Tipografia SECULT 2025, compartilhada pelos grupos de rota.
 *
 * A principal da identidade é a Sunbeam Stamp, uma condensada pesada de caixa
 * alta, comercial; Anton é a substituta gratuita de mesma classe. Questrial é
 * a auxiliar e vem da própria especificação.
 *
 * Não há manuscrita na identidade: a secundária é a Ananias, uma geométrica
 * desenhada à mão em caixa alta. Enquanto não houver licença, a secundária
 * também sai em Anton, com corpo e espaçamento próprios.
 *
 * Mora fora dos layouts porque `.titulo`, `.rotulo` e `font-questrial` são
 * globais: quem declarasse as fontes só num grupo deixaria os outros caindo em
 * Impact e no sans do sistema — foi o que aconteceu com as telas de acesso.
 */
const display = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display' })
const questrial = Questrial({ subsets: ['latin'], weight: '400', variable: '--font-questrial' })

/** Classes das variáveis CSS, para aplicar na raiz do grupo de rota. */
export const variaveisDeFonte = `${display.variable} ${questrial.variable}`
