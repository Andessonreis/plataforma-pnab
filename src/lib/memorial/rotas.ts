import type { NextRequest, NextResponse } from 'next/server'
import type { z } from 'zod'
import type { StatusConteudo } from '@prisma/client'
import {
  createContext,
  created,
  forbidden,
  handleError,
  logRequest,
  ok,
  okPaginated,
  type ApiContext,
} from '@/lib/api/response'
import { getIp, requireRole, resolveAuth } from '@/lib/api/auth-resolver'
import { transicaoSchema } from '@/lib/schemas/memorial-comum'
import { metaPaginacao, type Autor } from '@/lib/services/memorial-conteudo.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

/*
 * Handlers das rotas /api/v1/memorial. As entidades seguem o mesmo contrato
 * (listar, criar, ler, editar, excluir, mudar status), então as rotas são montadas
 * aqui a partir do serviço de cada uma, em vez de repetidas arquivo a arquivo.
 */

export const CACHE_PUBLICO = 'public, s-maxage=60, stale-while-revalidate=300'

type Contexto = { params: Promise<Record<string, string>> }
type Entrada<T> = z.ZodType<T, z.ZodTypeDef, unknown>
type Paginado = { page: number; pageSize: number }

/** Escrita e leitura do painel: equipe de comunicação (SUPER_ADMIN sempre passa). */
export async function autorEditorial(req: NextRequest): Promise<Autor | null> {
  const caller = await resolveAuth(req)
  if (!requireRole(caller, ...ROLES_MEMORIAL)) return null
  return { userId: caller.userId, role: caller.role, ip: getIp(req) }
}

export function querySearch(req: NextRequest) {
  return Object.fromEntries(new URL(req.url).searchParams)
}

/** Envolve o handler com requestId, log de requisição e conversão de erros. */
export function manipulador(
  metodo: string,
  caminho: string,
  executar: (req: NextRequest, ctx: ApiContext, params: Record<string, string>) => Promise<NextResponse>,
) {
  return async (req: NextRequest, { params }: Contexto) => {
    const ctx = createContext()
    try {
      const res = await executar(req, ctx, await params)
      logRequest(ctx, metodo, caminho, res.status)
      return res
    } catch (err) {
      return handleError(ctx, err)
    }
  }
}

/** Rota restrita à equipe editorial. */
export function editorial(
  metodo: string,
  caminho: string,
  executar: (req: NextRequest, ctx: ApiContext, autor: Autor, params: Record<string, string>) => Promise<NextResponse>,
) {
  return manipulador(metodo, caminho, async (req, ctx, params) => {
    const autor = await autorEditorial(req)
    if (!autor) return forbidden(ctx)
    return executar(req, ctx, autor, params)
  })
}

interface ServicoColecao<I, F> {
  listarAdmin(f: F): Promise<{ itens: unknown[]; total: number }>
  criar(i: I, autor: Autor): Promise<unknown>
}

/** GET (lista paginada do painel) + POST (criar) da coleção. */
export function rotasColecao<I, F extends Paginado>(
  caminho: string,
  servico: ServicoColecao<I, F>,
  entrada: Entrada<I>,
  filtro: Entrada<F>,
) {
  return {
    GET: editorial('GET', caminho, async (req, ctx) => {
      const f = filtro.parse(querySearch(req))
      const { itens, total } = await servico.listarAdmin(f)
      return okPaginated(ctx, itens, metaPaginacao(f, total))
    }),
    POST: editorial('POST', caminho, async (req, ctx, autor) => {
      return created(ctx, await servico.criar(entrada.parse(await req.json()), autor))
    }),
  }
}

interface ServicoItem<I> {
  obter(id: string): Promise<unknown>
  atualizar(id: string, i: I, autor: Autor): Promise<unknown>
  excluir(id: string, autor: Autor): Promise<void>
}

/** GET, PUT e DELETE de um registro (`[id]`). */
export function rotasRegistro<I>(caminho: string, servico: ServicoItem<I>, entrada: Entrada<I>) {
  return {
    GET: editorial('GET', caminho, async (_req, ctx, _autor, { id }) => ok(ctx, await servico.obter(id))),
    PUT: editorial('PUT', caminho, async (req, ctx, autor, { id }) =>
      ok(ctx, await servico.atualizar(id, entrada.parse(await req.json()), autor)),
    ),
    DELETE: editorial('DELETE', caminho, async (_req, ctx, autor, { id }) => {
      await servico.excluir(id, autor)
      return ok(ctx, { id })
    }),
  }
}

/** POST `[id]/status` — avança ou recua no fluxo editorial. */
export function rotaStatus(
  caminho: string,
  mudarStatus: (id: string, status: StatusConteudo, autor: Autor) => Promise<unknown>,
) {
  return editorial('POST', caminho, async (req, ctx, autor, { id }) => {
    const { status } = transicaoSchema.parse(await req.json())
    return ok(ctx, await mudarStatus(id, status, autor))
  })
}

/** GET público e paginado, com cache de borda. */
export function rotaPublicaPaginada<F extends Paginado>(
  caminho: string,
  filtro: Entrada<F>,
  listar: (f: F) => Promise<{ itens: unknown[]; total: number }>,
) {
  return manipulador('GET', caminho, async (req, ctx) => {
    const f = filtro.parse(querySearch(req))
    const { itens, total } = await listar(f)
    return okPaginated(ctx, itens, metaPaginacao(f, total), CACHE_PUBLICO)
  })
}

/** GET público de um registro, pelo parâmetro da rota (slug ou id). */
export function rotaPublicaUnica(caminho: string, param: string, obter: (valor: string) => Promise<unknown>) {
  return manipulador('GET', caminho, async (_req, ctx, params) => ok(ctx, await obter(params[param]), CACHE_PUBLICO))
}
