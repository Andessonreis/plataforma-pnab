import { z } from 'zod'

/*
 * Contrato do slide da abertura da home, usado pela API e pelo formulário do
 * admin. Os limites de texto não são arbitrários: a abertura tem altura fixa
 * por breakpoint, então cada campo cabe no quadro do celular (o mais apertado)
 * com a tipografia da peça. Aumentar um limite exige conferir o quadro.
 */

export const FORMATOS_SLIDE = ['ARTE', 'PECA'] as const
export type FormatoSlide = (typeof FORMATOS_SLIDE)[number]

export const LIMITES_SLIDE = {
  titulo: 120,
  descricaoArte: 300,
  chamada: 40,
  chamadaDestaque: 28,
  autoria: 40,
  apoioDestaque: 32,
  apoio: 120,
  linha: 44,
  linhas: 3,
  ctaLabel: 20,
  legenda: 32,
  alt: 180,
  varalRotulo: 64,
  link: 300,
} as const

export const VARAL_QUANTIDADE = { min: 6, max: 40 } as const

/** Link interno (`/editais`) ou externo seguro; `//host` é barrado porque o navegador o trata como externo. */
const urlLink = z
  .string()
  .trim()
  .max(LIMITES_SLIDE.link, `Máximo de ${LIMITES_SLIDE.link} caracteres`)
  .refine((v) => /^\/(?!\/)/.test(v) || v.startsWith('https://'), {
    message: 'Use um caminho do portal (começando com /) ou um link https://',
  })

/** Imagem enviada pelo upload do admin, arquivo do próprio portal ou link https. */
const urlImagem = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^\/(?!\/)/.test(v) || v.startsWith('https://'), { message: 'Endereço de imagem inválido' })

const texto = (max: number, rotulo: string) =>
  z.string().trim().min(1, `${rotulo} é obrigatório`).max(max, `Máximo de ${max} caracteres`)

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .nullish()
    .transform((v) => (v ? v : null))

const dataOpcional = z
  .string()
  .nullish()
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), { message: 'Data inválida' })
  .transform((v) => (v ? v : null))

export const varalSchema = z
  .object({
    rotulo: texto(LIMITES_SLIDE.varalRotulo, 'O texto da faixa'),
    quantidade: z.coerce
      .number()
      .int()
      .min(VARAL_QUANTIDADE.min, `Mínimo de ${VARAL_QUANTIDADE.min} fotografias`)
      .max(VARAL_QUANTIDADE.max, `Máximo de ${VARAL_QUANTIDADE.max} fotografias`),
    anoInicial: z.coerce.number().int().min(1800, 'Ano inválido').max(2100, 'Ano inválido'),
    anoFinal: z.coerce.number().int().min(1800, 'Ano inválido').max(2100, 'Ano inválido'),
  })
  .refine((v) => v.anoFinal > v.anoInicial, {
    message: 'O ano final precisa ser depois do inicial',
    path: ['anoFinal'],
  })

export const pecaSchema = z.object({
  chamada: texto(LIMITES_SLIDE.chamada, 'A chamada'),
  chamadaDestaque: textoOpcional(LIMITES_SLIDE.chamadaDestaque),
  autoria: textoOpcional(LIMITES_SLIDE.autoria),
  apoioDestaque: textoOpcional(LIMITES_SLIDE.apoioDestaque),
  ctaSecundario: z
    .object({ label: texto(LIMITES_SLIDE.ctaLabel, 'O texto do botão'), url: urlLink })
    .nullish()
    .transform((v) => v ?? null),
  destaque: z
    .object({
      url: urlImagem,
      alt: texto(LIMITES_SLIDE.alt, 'A descrição da foto'),
      legenda: textoOpcional(LIMITES_SLIDE.legenda),
    })
    .nullish()
    .transform((v) => v ?? null),
  linhas: z
    .array(texto(LIMITES_SLIDE.linha, 'A linha'))
    .max(LIMITES_SLIDE.linhas, `No máximo ${LIMITES_SLIDE.linhas} linhas`)
    .default([]),
  varal: varalSchema.nullish().transform((v) => v ?? null),
})

export type PecaInput = z.infer<typeof pecaSchema>

export const slideSchema = z
  .object({
    formato: z.enum(FORMATOS_SLIDE).default('ARTE'),
    titulo: z
      .string()
      .trim()
      .min(3, 'Título deve ter no mínimo 3 caracteres')
      .max(LIMITES_SLIDE.titulo, `Máximo de ${LIMITES_SLIDE.titulo} caracteres`),
    descricao: textoOpcional(LIMITES_SLIDE.descricaoArte),
    imagemUrl: urlImagem.nullish().or(z.literal('')).transform((v) => (v ? v : null)),
    ctaLabel: textoOpcional(LIMITES_SLIDE.ctaLabel),
    ctaUrl: urlLink.nullish().or(z.literal('')).transform((v) => (v ? v : null)),
    ordem: z.coerce.number().int().default(0),
    ativo: z.boolean().default(true),
    inicioEm: dataOpcional,
    fimEm: dataOpcional,
    peca: pecaSchema.nullish().transform((v) => v ?? null),
  })
  .superRefine((s, ctx) => {
    if (s.inicioEm && s.fimEm && Date.parse(s.fimEm) <= Date.parse(s.inicioEm)) {
      ctx.addIssue({ code: 'custom', path: ['fimEm'], message: 'O fim precisa ser depois do início' })
    }
    if (s.formato !== 'PECA') return

    // A peça editorial ocupa a faixa inteira: sem fundo, chamada ou botão ela
    // não se sustenta no quadro, então esses campos passam a ser obrigatórios.
    const exigir = (path: string, ok: unknown, message: string) => {
      if (!ok) ctx.addIssue({ code: 'custom', path: [path], message })
    }
    exigir('peca', s.peca, 'Preencha o conteúdo da peça')
    exigir('imagemUrl', s.imagemUrl, 'Envie a imagem de fundo')
    exigir('ctaLabel', s.ctaLabel, 'O texto do botão principal é obrigatório')
    exigir('ctaUrl', s.ctaUrl, 'O link do botão principal é obrigatório')
    if (s.descricao && s.descricao.length > LIMITES_SLIDE.apoio) {
      ctx.addIssue({
        code: 'custom',
        path: ['descricao'],
        message: `Máximo de ${LIMITES_SLIDE.apoio} caracteres`,
      })
    }
  })

export type SlideInput = z.infer<typeof slideSchema>
