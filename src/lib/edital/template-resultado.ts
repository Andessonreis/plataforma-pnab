import { z } from 'zod'

/**
 * Template das páginas públicas de resultado (`/resultados-preliminar` e
 * `/resultados-definitivo`) de um edital.
 *
 * O corpo das páginas é o mesmo para todo edital: capa, índice de categorias,
 * quadro de vagas e tabela de classificação. O que muda de um edital para outro
 * fica em `Edital.resultadoTemplate`, e o que faltar cai no padrão abaixo, que
 * reproduz o layout publicado no Festival. Edital sem configuração continua
 * igual ao de hoje.
 *
 * Atenção: a lista do preliminar publicado fica congelada em
 * `Edital.resultadoPreliminar`, mas a apresentação (título, rótulos e fotos) é
 * lida daqui a cada acesso. Editar o template de um edital cujo preliminar já
 * saiu no Diário Oficial muda a página publicada.
 *
 * Módulo folha: só dados e validação, sem Prisma nem React, para as páginas, os
 * PDFs e os serviços lerem a mesma configuração.
 */

export interface TemplateResultado {
  /** Fotos da capa; caminhos do próprio portal. */
  fotos: string[]
  /** Título da capa de cada fase. */
  titulos: { preliminar: string; definitivo: string }
  /** Rótulos da coluna Situação. */
  rotulos: {
    classificado: string
    desclassificado: string
    suplente: string
    emRecurso: string
    naoSeAplica: string
  }
  /**
   * Números de inscrição que aparecem na lista sem posição nem nota, com a
   * situação "Não se aplica": o cálculo lhes daria uma classificação que o
   * edital não prevê (ex.: inscrita numa categoria que ele não tem).
   */
  foraDaClassificacao: string[]
}

export const TEMPLATE_RESULTADO_PADRAO: TemplateResultado = Object.freeze({
  fotos: Object.freeze([
    '/images/galeria/foto-03.png', // arraiá no coreto
    '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
  ]) as string[],
  titulos: Object.freeze({ preliminar: 'Resultado preliminar', definitivo: 'Resultado final' }),
  rotulos: Object.freeze({
    classificado: 'Classificado',
    desclassificado: 'Desclassificado',
    suplente: 'Suplente',
    emRecurso: 'Em recurso',
    naoSeAplica: 'Não se aplica',
  }),
  foraDaClassificacao: Object.freeze([]) as unknown as string[],
})

/**
 * Cópia do padrão para devolver a quem chama: o zod devolve o mesmo valor do
 * `.catch` a cada leitura, e um chamador que alterasse a lista mudaria o padrão
 * de todos os editais.
 */
function copiaDoPadrao(): TemplateResultado {
  const p = TEMPLATE_RESULTADO_PADRAO
  return { fotos: [...p.fotos], titulos: { ...p.titulos }, rotulos: { ...p.rotulos }, foraDaClassificacao: [] }
}

/** Só imagem do próprio portal, em `/images/`: sem outro domínio, sem `..` e sem rota da API. */
const CAMINHO_DE_IMAGEM = /^\/images\/(?!.*\.\.)[\w\-./]+\.(png|jpe?g|webp|avif)$/i

const MAX_EXCECOES = 200
const MAX_TAMANHO_DO_NUMERO = 32

/** Texto de rótulo ou título; inválido ou ausente volta ao padrão, sem derrubar a página. */
const texto = (padrao: string) => z.string().trim().min(1).max(80).catch(padrao)

const P = TEMPLATE_RESULTADO_PADRAO

/**
 * Lista de exceções, lida com o cuidado de quem protege a classificação: cair
 * no padrão aqui abre a proteção (a inscrição passaria a sair classificada),
 * então uma entrada malformada é descartada sem apagar as outras, o número é
 * normalizado para caixa alta e uma lista que não é lista é registrada no log.
 */
function lerForaDaClassificacao(bruto: unknown): string[] {
  if (bruto === undefined || bruto === null) return []
  if (!Array.isArray(bruto)) {
    console.warn({ escopo: 'template-resultado', campo: 'foraDaClassificacao', problema: 'valor não é uma lista' })
    return []
  }
  return bruto
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item !== '' && item.length <= MAX_TAMANHO_DO_NUMERO)
    .slice(0, MAX_EXCECOES)
}

const schema = z
  .object({
    fotos: z.array(z.string().regex(CAMINHO_DE_IMAGEM)).min(1).max(4).catch(() => [...P.fotos]),
    titulos: z
      .object({ preliminar: texto(P.titulos.preliminar), definitivo: texto(P.titulos.definitivo) })
      .catch(() => ({ ...P.titulos })),
    rotulos: z
      .object({
        classificado: texto(P.rotulos.classificado),
        desclassificado: texto(P.rotulos.desclassificado),
        suplente: texto(P.rotulos.suplente),
        emRecurso: texto(P.rotulos.emRecurso),
        naoSeAplica: texto(P.rotulos.naoSeAplica),
      })
      .catch(() => ({ ...P.rotulos })),
    foraDaClassificacao: z.unknown().transform(lerForaDaClassificacao),
  })
  .catch(copiaDoPadrao)

/**
 * Lê o `Edital.resultadoTemplate`. Cada campo inválido ou ausente cai no padrão
 * sozinho, então uma configuração incompleta ou quebrada nunca derruba a página
 * pública nem desfaz o que estava certo nos outros campos.
 */
export function resolverTemplateResultado(bruto: unknown): TemplateResultado {
  return schema.parse(bruto ?? {})
}
