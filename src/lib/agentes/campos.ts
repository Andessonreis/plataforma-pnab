/**
 * Catálogo de campos da lista de agentes culturais.
 *
 * Fonte única do que pode ser exportado: a tela de filtros oferece estes
 * campos, o CSV monta as colunas a partir daqui e o PDF calcula as larguras
 * pelos pesos. Campo novo entra num lugar só.
 */
import type { TipoProponente, UserRole } from '@prisma/client'
import { formatTelefoneBR } from '@/lib/utils/format'
import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import { tipoProponenteLabel, userRoleLabel } from '@/lib/status-maps'

// ─── Linha ───────────────────────────────────────────────────────────────────

/** Agente já carregado do banco, no formato que todo formato de saída consome. */
export interface AgenteRow {
  nome: string
  email: string
  telefone: string | null
  cpfCnpj: string | null
  tipoProponente: TipoProponente | null
  role: UserRole
  cidade: string | null
  uf: string | null
  ativo: boolean
  totalInscricoes: number
  createdAt: Date
}

// ─── Campos ──────────────────────────────────────────────────────────────────

export const CAMPOS_AGENTE = [
  'nome',
  'email',
  'telefone',
  'cpfCnpj',
  'tipo',
  'perfil',
  'cidade',
  'situacao',
  'inscricoes',
  'cadastradoEm',
] as const

export type CampoAgente = (typeof CAMPOS_AGENTE)[number]

interface DefinicaoCampo {
  label: string
  /** Peso relativo na distribuição de largura das colunas do PDF. */
  peso: number
  valor: (agente: AgenteRow, opcoes: OpcoesCampo) => string
}

export interface OpcoesCampo {
  /**
   * Oculta parte do CPF/CNPJ. Ligado nos documentos que circulam impressos;
   * desligado no CSV de trabalho, que a equipe usa pra conferir cadastro.
   */
  mascararDocumento: boolean
}

function formatData(data: Date): string {
  return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export const DEFINICOES_CAMPO: Record<CampoAgente, DefinicaoCampo> = {
  nome: {
    label: 'Nome',
    peso: 30,
    valor: (a) => a.nome.trim(),
  },
  email: {
    label: 'E-mail',
    peso: 30,
    valor: (a) => a.email,
  },
  telefone: {
    label: 'Telefone',
    peso: 14,
    valor: (a) => formatTelefoneBR(a.telefone ?? '') || '—',
  },
  cpfCnpj: {
    label: 'CPF/CNPJ',
    peso: 16,
    valor: (a, o) => (o.mascararDocumento ? maskCpfCnpjParcial(a.cpfCnpj) : a.cpfCnpj ?? '—'),
  },
  tipo: {
    label: 'Tipo',
    peso: 12,
    valor: (a) => (a.tipoProponente ? tipoProponenteLabel[a.tipoProponente] : '—'),
  },
  perfil: {
    label: 'Perfil',
    peso: 14,
    valor: (a) => userRoleLabel[a.role],
  },
  cidade: {
    label: 'Cidade/UF',
    peso: 16,
    valor: (a) => [a.cidade, a.uf].filter(Boolean).join('/') || '—',
  },
  situacao: {
    label: 'Situação',
    peso: 10,
    valor: (a) => (a.ativo ? 'Ativo' : 'Inativo'),
  },
  inscricoes: {
    label: 'Inscrições',
    peso: 10,
    valor: (a) => String(a.totalInscricoes),
  },
  cadastradoEm: {
    // Rótulo curto: em tabela com muitas colunas, "Cadastrado em" quebra no meio da palavra.
    label: 'Cadastro',
    peso: 14,
    valor: (a) => formatData(a.createdAt),
  },
}

/** Seleção inicial: os dados de contato que a Secretaria usa no dia a dia. */
export const CAMPOS_PADRAO: CampoAgente[] = ['nome', 'email', 'telefone', 'cpfCnpj', 'tipo']

export function valorDoCampo(agente: AgenteRow, campo: CampoAgente, opcoes: OpcoesCampo): string {
  return DEFINICOES_CAMPO[campo].valor(agente, opcoes)
}

export function labelDoCampo(campo: CampoAgente): string {
  return DEFINICOES_CAMPO[campo].label
}
