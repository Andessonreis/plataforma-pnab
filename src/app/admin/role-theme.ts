import type { UserRole } from '@prisma/client'

export interface RoleTheme {
  /** Selo/logo no topo da sidebar e badge de papel no header — cor sólida + texto. */
  soloBg: string
  soloText: string
  /** Item de navegação ativo — mesmo par de contraste do selo. */
  activeBg: string
  activeText: string
  /** Destaque sutil (pendências) sobre o fundo escuro da sidebar. */
  highlightText: string
  highlightBg: string
  highlightRing: string
  highlightIcon: string
  /** Badge claro no header (fundo 50, texto 700-ish) — mesmo padrão usado em StatCard/Badge. */
  chipBg: string
  chipText: string
  chipRing: string
}

/**
 * Um tema por papel interno — cada área do backoffice usa uma cor da
 * identidade SECULT 2025 já carregada em `tailwind.config.ts` (oliva,
 * ameixa, turquesa), em vez de repetir o dourado do proponente. A cor
 * carrega o significado que a própria identidade já atribuiu a ela:
 * oliva (esperança) pra quem triagem/aprova, ameixa (criatividade) pra quem
 * avalia mérito cultural, turquesa (acolhimento) pra quem atende.
 *
 * Pares fundo/texto abaixo foram checados a olho por contraste AA (4.5:1)
 * — por isso oliva/ameixa usam o stop 600 com texto claro (papel-50) e
 * turquesa/accent usam o stop 500 com texto escuro (tinta-950): nos tons
 * mais claros da paleta, texto escuro é o que fecha 4.5:1; nos mais
 * escuros, é o texto claro.
 */
const TEMAS: Record<UserRole, RoleTheme> = {
  HABILITADOR: {
    soloBg: 'bg-oliva-600', soloText: 'text-papel-50',
    activeBg: 'bg-oliva-600', activeText: 'text-papel-50',
    highlightText: 'text-oliva-300', highlightBg: 'bg-oliva-500/10', highlightRing: 'ring-oliva-500/25', highlightIcon: 'text-oliva-300',
    chipBg: 'bg-oliva-50', chipText: 'text-oliva-700', chipRing: 'ring-oliva-200',
  },
  AVALIADOR: {
    soloBg: 'bg-ameixa-600', soloText: 'text-papel-50',
    activeBg: 'bg-ameixa-600', activeText: 'text-papel-50',
    highlightText: 'text-ameixa-300', highlightBg: 'bg-ameixa-400/10', highlightRing: 'ring-ameixa-400/25', highlightIcon: 'text-ameixa-300',
    chipBg: 'bg-ameixa-50', chipText: 'text-ameixa-700', chipRing: 'ring-ameixa-200',
  },
  ATENDIMENTO: {
    soloBg: 'bg-turquesa-500', soloText: 'text-tinta-950',
    activeBg: 'bg-turquesa-500', activeText: 'text-tinta-950',
    highlightText: 'text-turquesa-300', highlightBg: 'bg-turquesa-400/10', highlightRing: 'ring-turquesa-400/25', highlightIcon: 'text-turquesa-300',
    chipBg: 'bg-turquesa-50', chipText: 'text-turquesa-700', chipRing: 'ring-turquesa-200',
  },
  ADMIN: {
    soloBg: 'bg-accent-500', soloText: 'text-tinta-950',
    activeBg: 'bg-accent-500', activeText: 'text-tinta-950',
    highlightText: 'text-accent-300', highlightBg: 'bg-accent-500/10', highlightRing: 'ring-accent-500/25', highlightIcon: 'text-accent-300',
    chipBg: 'bg-accent-50', chipText: 'text-accent-800', chipRing: 'ring-accent-200',
  },
  // Nunca renderizado no backoffice (proponente tem sua própria sidebar) — só aqui pra fechar o Record.
  PROPONENTE: {
    soloBg: 'bg-accent-500', soloText: 'text-tinta-950',
    activeBg: 'bg-accent-500', activeText: 'text-tinta-950',
    highlightText: 'text-accent-300', highlightBg: 'bg-accent-500/10', highlightRing: 'ring-accent-500/25', highlightIcon: 'text-accent-300',
    chipBg: 'bg-accent-50', chipText: 'text-accent-800', chipRing: 'ring-accent-200',
  },
}

export function getRoleTheme(role: UserRole): RoleTheme {
  return TEMAS[role]
}
