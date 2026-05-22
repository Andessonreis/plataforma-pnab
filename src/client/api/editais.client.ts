import type { EditalDetalheDTO, EditalResumoDTO } from '@shared/dtos/editais.dto'
import type { ArquivoEditalDTO } from '@shared/dtos/arquivos-edital.dto'
import type { EquipeEditalDTO } from '@shared/dtos/equipe-edital.dto'
import type { PaginationMeta } from '@shared/dtos/common.dto'
import type { TipoArquivoEdital } from '@shared/schemas/arquivos-edital.schema'
import type { FuncaoEdital } from '@shared/schemas/equipe-edital.schema'
import type { EditalStatus } from '@shared/enums/edital-status'
import type {
  PublicacaoResultadoDTO,
  ResultadosListagemDTO,
} from '@shared/dtos/resultados-edital.dto'

type ApiSuccess<T> = { data: T; meta?: PaginationMeta; requestId: string }
type ApiError = { error: string; message: string; requestId: string }

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null
    throw new Error(err?.message ?? `Erro ${res.status}`)
  }
  const body = (await res.json()) as ApiSuccess<T>
  return body.data
}

async function unwrapWithMeta<T>(res: Response): Promise<{ data: T; meta?: PaginationMeta }> {
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null
    throw new Error(err?.message ?? `Erro ${res.status}`)
  }
  const body = (await res.json()) as ApiSuccess<T>
  return { data: body.data, meta: body.meta }
}

export type ListEditaisParams = {
  page?: number
  pageSize?: number
  status?: string
}

export type EditalInput = {
  titulo: string
  resumo?: string | null
  ano: number
  valorTotal?: number | null
  categorias: string[]
  acoesAfirmativas?: string | null
  regrasElegibilidade?: string | null
  status:
    | 'RASCUNHO'
    | 'PUBLICADO'
    | 'INSCRICOES_ABERTAS'
    | 'INSCRICOES_ENCERRADAS'
    | 'HABILITACAO'
    | 'AVALIACAO'
    | 'RESULTADO_PRELIMINAR'
    | 'RECURSO'
    | 'RESULTADO_FINAL'
    | 'ENCERRADO'
  cronograma: unknown[]
  camposFormulario: unknown[]
  etapasCustomizadas: unknown[]
  vagasContemplados?: number | null
  vagasSuplentes?: number | null
}

function buildQueryString(params: ListEditaisParams): string {
  const qs = new URLSearchParams()
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize))
  if (params.status) qs.set('status', params.status)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export const editaisClient = {
  async list(params: ListEditaisParams = {}): Promise<{ data: EditalResumoDTO[]; meta?: PaginationMeta }> {
    const res = await fetch(`/api/v1/editais${buildQueryString(params)}`, { credentials: 'same-origin' })
    return unwrapWithMeta<EditalResumoDTO[]>(res)
  },

  async detail(id: string): Promise<EditalDetalheDTO> {
    const res = await fetch(`/api/v1/editais/edital/${id}`, { credentials: 'same-origin' })
    return unwrap<EditalDetalheDTO>(res)
  },

  async create(input: EditalInput): Promise<EditalDetalheDTO> {
    const res = await fetch('/api/v1/editais/edital', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<EditalDetalheDTO>(res)
  },

  async update(id: string, input: EditalInput): Promise<EditalDetalheDTO> {
    const res = await fetch(`/api/v1/editais/edital/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<EditalDetalheDTO>(res)
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/v1/editais/edital/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as ApiError | null
      throw new Error(err?.message ?? `Erro ${res.status}`)
    }
  },

  async listArquivos(editalId: string): Promise<ArquivoEditalDTO[]> {
    const res = await fetch(`/api/v1/editais/edital/${editalId}/arquivos`, { credentials: 'same-origin' })
    return unwrap<ArquivoEditalDTO[]>(res)
  },

  async uploadArquivo(
    editalId: string,
    file: File,
    meta: { tipo: TipoArquivoEdital; titulo: string; acessivel?: boolean },
  ): Promise<ArquivoEditalDTO> {
    const form = new FormData()
    form.set('file', file)
    form.set('tipo', meta.tipo)
    form.set('titulo', meta.titulo)
    if (meta.acessivel) form.set('acessivel', 'true')
    const res = await fetch(`/api/v1/editais/edital/${editalId}/arquivos/arquivo`, {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    })
    return unwrap<ArquivoEditalDTO>(res)
  },

  async removeArquivo(editalId: string, arquivoId: string): Promise<void> {
    const res = await fetch(`/api/v1/editais/edital/${editalId}/arquivos/arquivo/${arquivoId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as ApiError | null
      throw new Error(err?.message ?? `Erro ${res.status}`)
    }
  },

  async getEquipe(editalId: string): Promise<EquipeEditalDTO> {
    const res = await fetch(`/api/v1/editais/edital/${editalId}/equipe`, { credentials: 'same-origin' })
    return unwrap<EquipeEditalDTO>(res)
  },

  async addEquipe(editalId: string, userIds: string[], funcao: FuncaoEdital): Promise<{ adicionados: number }> {
    const res = await fetch(`/api/v1/editais/edital/${editalId}/equipe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userIds, funcao }),
      credentials: 'same-origin',
    })
    return unwrap<{ adicionados: number }>(res)
  },

  async removeEquipe(editalId: string, userId: string, funcao: FuncaoEdital): Promise<void> {
    const res = await fetch(`/api/v1/editais/edital/${editalId}/equipe`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, funcao }),
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as ApiError | null
      throw new Error(err?.message ?? `Erro ${res.status}`)
    }
  },

  async listResultados(editalId: string): Promise<ResultadosListagemDTO> {
    const res = await fetch(`/api/v1/editais/edital/${editalId}/resultados`, { credentials: 'same-origin' })
    return unwrap<ResultadosListagemDTO>(res)
  },

  async publicarResultados(
    editalId: string,
    fase: 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL',
  ): Promise<PublicacaoResultadoDTO> {
    const res = await fetch(`/api/v1/editais/edital/${editalId}/resultados`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fase }),
      credentials: 'same-origin',
    })
    return unwrap<PublicacaoResultadoDTO>(res)
  },

  async reordenarResultados(editalId: string, orderedIds: string[]): Promise<void> {
    const res = await fetch(`/api/v1/editais/edital/${editalId}/resultados/reorder`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as ApiError | null
      throw new Error(err?.message ?? `Erro ${res.status}`)
    }
  },

  relatorioFinalUrl(editalId: string): string {
    return `/api/v1/editais/edital/${editalId}/relatorio-final`
  },

  listaPdfUrl(editalId: string, status: string): string {
    return `/api/v1/editais/edital/${editalId}/listas?status=${encodeURIComponent(status)}`
  },

  async avancarFase(
    id: string,
    proximoStatus: EditalStatus,
    justificativa: string,
  ): Promise<{ statusAnterior: EditalStatus; novoStatus: EditalStatus; retrocesso: boolean }> {
    const res = await fetch(`/api/v1/editais/edital/${id}/avancar-fase`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ proximoStatus, justificativa }),
      credentials: 'same-origin',
    })
    return unwrap<{ statusAnterior: EditalStatus; novoStatus: EditalStatus; retrocesso: boolean }>(res)
  },

  async updateAcessivel(id: string, conteudoAcessivel: string): Promise<void> {
    const res = await fetch(`/api/v1/editais/edital/${id}/acessivel`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ conteudoAcessivel }),
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as ApiError | null
      throw new Error(err?.message ?? `Erro ${res.status}`)
    }
  },
}
