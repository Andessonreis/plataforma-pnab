import type { StatusConteudo } from '@prisma/client'
import {
  type Autor,
  type EntidadeMemorial,
  type FiltroSlug,
  comConflito,
  definirSlug,
  exigirEncontrado,
  registrarAlteracao,
  transicionar,
  verificadorDeSlug,
} from './memorial-conteudo.service'

/**
 * O roteiro de escrita é o mesmo para exposição, item do acervo, pessoa e evento:
 * resolver o slug, gravar, versionar e auditar. Cada entidade entra só com as
 * chamadas do Prisma dela.
 */
export function crudConteudo<
  R extends { id: string; slug?: string; status: StatusConteudo },
  D extends { id: string },
  I extends object,
>(def: {
  entidade: EntidadeMemorial
  naoEncontrado: string
  /** Texto de onde nasce o slug e que identifica o registro na auditoria. */
  nomeDaEntrada: (i: I) => string
  nomeDoRegistro: (r: R) => string
  pendencias: (r: R) => string[]
  buscar: (id: string) => Promise<R | null>
  detalhar: (id: string) => Promise<D | null>
  /** Ausente para entidades sem endereço próprio (itens do acervo). */
  contarSlug?: (where: FiltroSlug) => Promise<number>
  inserir: (i: I, slug: string) => Promise<D>
  alterar: (id: string, i: I, slug: string) => Promise<D>
  apagar: (id: string) => Promise<unknown>
  salvarStatus: (id: string, status: StatusConteudo) => Promise<R>
}) {
  const { entidade } = def

  /** Slug escolhido no formulário, quando a entidade tem um. */
  function slugPedido(i: I): string | undefined {
    return 'slug' in i && typeof i.slug === 'string' ? i.slug : undefined
  }

  async function existente(id: string) {
    return exigirEncontrado(await def.buscar(id), def.naoEncontrado)
  }

  return {
    async obter(id: string) {
      return exigirEncontrado(await def.detalhar(id), def.naoEncontrado)
    },

    async criar(i: I, autor: Autor) {
      const slug = def.contarSlug
        ? await definirSlug(slugPedido(i), def.nomeDaEntrada(i), verificadorDeSlug(def.contarSlug))
        : ''
      const r = await comConflito(() => def.inserir(i, slug))
      const rotulo = def.nomeDaEntrada(i)
      await registrarAlteracao({ acao: 'MEMORIAL_CONTEUDO_CRIADO', entidade, id: r.id, rotulo, autor, estado: r })
      return r
    },

    async atualizar(id: string, i: I, autor: Autor) {
      const atual = await existente(id)
      const pedido = slugPedido(i)
      const slug =
        def.contarSlug && pedido && pedido !== atual.slug
          ? await definirSlug(pedido, def.nomeDaEntrada(i), verificadorDeSlug(def.contarSlug, id))
          : (atual.slug ?? '')
      const r = await comConflito(() => def.alterar(id, i, slug))
      const rotulo = def.nomeDaEntrada(i)
      await registrarAlteracao({ acao: 'MEMORIAL_CONTEUDO_ATUALIZADO', entidade, id, rotulo, autor, estado: r })
      return r
    },

    async excluir(id: string, autor: Autor) {
      const atual = await existente(id)
      await def.apagar(id)
      const rotulo = def.nomeDoRegistro(atual)
      await registrarAlteracao({ acao: 'MEMORIAL_CONTEUDO_EXCLUIDO', entidade, id, rotulo, autor })
    },

    async mudarStatus(id: string, status: StatusConteudo, autor: Autor) {
      return transicionar({
        entidade,
        autor,
        novo: status,
        atual: await def.buscar(id),
        pendencias: def.pendencias,
        rotulo: def.nomeDoRegistro,
        salvar: (s) => def.salvarStatus(id, s),
      })
    },
  }
}
