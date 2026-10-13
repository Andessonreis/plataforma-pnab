import type { SlideDestaque } from '@/components/home/types'

/**
 * Fotografias que correm atrás da peça de abertura, em ordem de exibição.
 *
 * Escolhidas por temperatura e por assunto — as quatro são noturnas e de luz
 * quente, então atravessam o banho de tinta terracota sem brigar com a paleta,
 * e alternam gente de perto com praça cheia para dar ritmo ao rodízio.
 *
 * Ficaram de fora, do que existe em `public/images`: o pórtico "Minha Feliz
 * Cidade" (o letreiro em neon disputaria com o texto do banner) e a
 * panorâmica da cidade (é urbanismo, não cultura, e a dominante azul do
 * entardecer destoa do resto da abertura).
 */
export const FOTOS_ABERTURA = [
  '/images/galeria/foto-04.png', // fogueira cenográfica do São João de Irecê
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
]

/**
 * Peça institucional fixa da abertura. Textos são editoriais da Secretaria —
 * não derivam de consulta ao banco, para que a comunicação não mude sozinha
 * quando um edital é cadastrado ou encerrado.
 */
export const SLIDE_INSTITUCIONAL: SlideDestaque = {
  tipo: 'composicao',
  id: 'pnab-editais',
  titulo: 'Editais da PNAB Irecê',
  subtitulo: 'Política Nacional Aldir Blanc de Fomento à Cultura',
  ctaLabel: 'Ver editais',
  ctaUrl: '/editais',
  banner: {
    chamadaInicio: 'Os editais da',
    chamadaDestaque: 'PNAB Irecê',
    chamadaFim: 'já estão publicados.',
    linguagensRotulo: 'Fomento para',
    linguagens: [
      'Música',
      'Teatro',
      'Dança',
      'Audiovisual',
      'Literatura',
      'Artes visuais',
      'Artesanato',
      'Culturas populares',
    ],
    valorPrefixo: 'Mais de',
    valorNumero: 400,
    valorUnidade: 'mil',
    valorSufixo: 'em recursos',
  },
}
