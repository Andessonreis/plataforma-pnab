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

export const TEMPLATE_RESULTADO_PADRAO: TemplateResultado = {
  fotos: [
    '/images/galeria/foto-03.png', // arraiá no coreto
    '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
  ],
  titulos: { preliminar: 'Resultado preliminar', definitivo: 'Resultado final' },
  rotulos: {
    classificado: 'Classificado',
    desclassificado: 'Desclassificado',
    suplente: 'Suplente',
    emRecurso: 'Em recurso',
    naoSeAplica: 'Não se aplica',
  },
  foraDaClassificacao: [],
}

/** Só imagem do próprio portal: caminho absoluto, sem `//` (que abriria outro domínio) nem `..`. */
const CAMINHO_DE_IMAGEM = /^\/(?!\/)(?!.*\.\.)[\w\-./]+\.(png|jpe?g|webp|avif)$/i

/** Texto de rótulo ou título; inválido ou ausente volta ao padrão, sem derrubar a página. */
const texto = (padrao: string) => z.string().trim().min(1).max(80).catch(padrao)

const P = TEMPLATE_RESULTADO_PADRAO

const schema = z
  .object({
    fotos: z.array(z.string().regex(CAMINHO_DE_IMAGEM)).min(1).max(4).catch(P.fotos),
    titulos: z
      .object({ preliminar: texto(P.titulos.preliminar), definitivo: texto(P.titulos.definitivo) })
      .catch(P.titulos),
    rotulos: z
      .object({
        classificado: texto(P.rotulos.classificado),
        desclassificado: texto(P.rotulos.desclassificado),
        suplente: texto(P.rotulos.suplente),
        emRecurso: texto(P.rotulos.emRecurso),
        naoSeAplica: texto(P.rotulos.naoSeAplica),
      })
      .catch(P.rotulos),
    // Lista de exceções: uma entrada malformada é descartada sem apagar as outras,
    // porque perder a lista promoveria a inscrição a uma classificação que ela não tem.
    foraDaClassificacao: z
      .array(z.unknown())
      .transform((itens) =>
        itens.filter((item): item is string => typeof item === 'string' && item.trim() !== '').map((item) => item.trim()),
      )
      .catch([]),
  })
  .catch(P)

/**
 * Lê o `Edital.resultadoTemplate`. Cada campo inválido ou ausente cai no padrão
 * sozinho, então uma configuração incompleta ou quebrada nunca derruba a página
 * pública nem desfaz o que estava certo nos outros campos.
 */
export function resolverTemplateResultado(bruto: unknown): TemplateResultado {
  return schema.parse(bruto ?? {})
}
