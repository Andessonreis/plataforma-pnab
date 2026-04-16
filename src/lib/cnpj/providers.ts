import type { CnpjLookupResult, CnpjSocio } from './types'

const TIMEOUT_MS = 5000

const BRASILAPI_URL =
  process.env.BRASILAPI_CNPJ_URL ?? 'https://brasilapi.com.br/api/cnpj/v1/'
const RECEITAWS_URL =
  process.env.RECEITAWS_CNPJ_URL ?? 'https://receitaws.com.br/v1/cnpj/'

export class CnpjProviderError extends Error {
  constructor(message: string, readonly provider: 'brasilapi' | 'receitaws') {
    super(message)
    this.name = 'CnpjProviderError'
  }
}

function nullIfEmpty(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed.length ? trimmed : null
}

// ── BrasilAPI ───────────────────────────────────────────────────────────────

interface BrasilApiResponse {
  cnpj: string
  razao_social: string
  nome_fantasia?: string | null
  descricao_situacao_cadastral?: string | null
  data_situacao_cadastral?: string | null
  cnae_fiscal?: number | null
  cnae_fiscal_descricao?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  municipio?: string | null
  uf?: string | null
  ddd_telefone_1?: string | null
  email?: string | null
  qsa?: Array<{ nome_socio?: string; qualificacao_socio?: string }>
}

export async function fetchFromBrasilApi(
  cnpj: string,
): Promise<CnpjLookupResult | null> {
  let res: Response
  try {
    res = await fetch(`${BRASILAPI_URL}${cnpj}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    throw new CnpjProviderError(
      err instanceof Error ? err.message : 'network error',
      'brasilapi',
    )
  }

  if (res.status === 404) return null
  if (!res.ok) {
    throw new CnpjProviderError(`HTTP ${res.status}`, 'brasilapi')
  }

  const raw = (await res.json()) as BrasilApiResponse

  const socios: CnpjSocio[] = (raw.qsa ?? []).map((s) => ({
    nome: s.nome_socio ?? '',
    qualificacao: nullIfEmpty(s.qualificacao_socio),
  }))

  const cnaePrincipal = raw.cnae_fiscal
    ? {
        codigo: String(raw.cnae_fiscal),
        descricao: raw.cnae_fiscal_descricao ?? '',
      }
    : null

  return {
    cnpj,
    razaoSocial: raw.razao_social,
    nomeFantasia: nullIfEmpty(raw.nome_fantasia),
    situacao: (raw.descricao_situacao_cadastral ?? '').toUpperCase() || 'DESCONHECIDA',
    dataSituacao: nullIfEmpty(raw.data_situacao_cadastral),
    cnaePrincipal,
    endereco: {
      cep: nullIfEmpty(raw.cep),
      logradouro: nullIfEmpty(raw.logradouro),
      numero: nullIfEmpty(raw.numero),
      complemento: nullIfEmpty(raw.complemento),
      bairro: nullIfEmpty(raw.bairro),
      municipio: nullIfEmpty(raw.municipio),
      uf: nullIfEmpty(raw.uf),
    },
    telefone: nullIfEmpty(raw.ddd_telefone_1),
    email: nullIfEmpty(raw.email),
    socios,
    fonte: 'brasilapi',
  }
}

// ── ReceitaWS (fallback) ────────────────────────────────────────────────────

interface ReceitaWsResponse {
  status?: string
  message?: string
  cnpj?: string
  nome?: string
  fantasia?: string | null
  situacao?: string | null
  data_situacao?: string | null
  atividade_principal?: Array<{ code?: string; text?: string }>
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  municipio?: string | null
  uf?: string | null
  telefone?: string | null
  email?: string | null
  qsa?: Array<{ nome?: string; qual?: string }>
}

export async function fetchFromReceitaWs(
  cnpj: string,
): Promise<CnpjLookupResult | null> {
  let res: Response
  try {
    res = await fetch(`${RECEITAWS_URL}${cnpj}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    throw new CnpjProviderError(
      err instanceof Error ? err.message : 'network error',
      'receitaws',
    )
  }

  if (res.status === 404) return null
  if (!res.ok) {
    throw new CnpjProviderError(`HTTP ${res.status}`, 'receitaws')
  }

  const raw = (await res.json()) as ReceitaWsResponse

  // ReceitaWS usa status=ERROR no body quando não encontra / rate-limit.
  if (raw.status === 'ERROR') {
    if (raw.message && /não encontrado|not found/i.test(raw.message)) return null
    throw new CnpjProviderError(raw.message ?? 'error', 'receitaws')
  }

  const socios: CnpjSocio[] = (raw.qsa ?? []).map((s) => ({
    nome: s.nome ?? '',
    qualificacao: nullIfEmpty(s.qual),
  }))

  const principal = raw.atividade_principal?.[0]
  const cnaePrincipal = principal?.code
    ? { codigo: principal.code.replace(/\D/g, ''), descricao: principal.text ?? '' }
    : null

  return {
    cnpj,
    razaoSocial: raw.nome ?? '',
    nomeFantasia: nullIfEmpty(raw.fantasia),
    situacao: (raw.situacao ?? '').toUpperCase() || 'DESCONHECIDA',
    dataSituacao: nullIfEmpty(raw.data_situacao),
    cnaePrincipal,
    endereco: {
      cep: nullIfEmpty(raw.cep),
      logradouro: nullIfEmpty(raw.logradouro),
      numero: nullIfEmpty(raw.numero),
      complemento: nullIfEmpty(raw.complemento),
      bairro: nullIfEmpty(raw.bairro),
      municipio: nullIfEmpty(raw.municipio),
      uf: nullIfEmpty(raw.uf),
    },
    telefone: nullIfEmpty(raw.telefone),
    email: nullIfEmpty(raw.email),
    socios,
    fonte: 'receitaws',
  }
}
