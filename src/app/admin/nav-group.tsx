'use client'

import { useEffect, useId, useState } from 'react'
import { IconChevronDown } from '@/components/ui'
import { AdminNavLink } from './nav-link'
import type { NavItem, NavSection } from './nav-items'
import { isNavItemActive } from './nav-items'
import type { RoleTheme } from './role-theme'

const CHAVE_ARMAZENAMENTO = 'admin.menu.grupos-abertos'

interface NavGroupProps {
  section: NavSection
  items: NavItem[]
  pathname: string
  theme: RoleTheme
  badgeFor: (item: NavItem) => number | null
  isHighlighted: (item: NavItem, active: boolean) => boolean
}

function lerAbertos(): string[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_ARMAZENAMENTO)
    const lido: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lido) ? lido.filter((t): t is string => typeof t === 'string') : []
  } catch {
    return []
  }
}

function gravarAbertos(titulos: string[]) {
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(titulos))
  } catch {
    // Sem armazenamento (janela privada, bloqueio): o menu só deixa de lembrar a escolha.
  }
}

/**
 * Grupo do menu que abre e fecha. O grupo da página atual abre sozinho; o resto
 * lembra o que a pessoa deixou aberto. Fechado, soma as pendências dos itens para
 * ninguém perder um aviso por ter recolhido o grupo.
 */
export function NavGroup({ section, items, pathname, theme, badgeFor, isHighlighted }: NavGroupProps) {
  const painelId = useId()
  const temAtivo = items.some((item) => isNavItemActive(item, pathname))
  const [aberto, setAberto] = useState(temAtivo)

  useEffect(() => {
    if (temAtivo) setAberto(true)
    else if (lerAbertos().includes(section.title)) setAberto(true)
  }, [temAtivo, section.title])

  function alternar() {
    const proximo = !aberto
    setAberto(proximo)
    const atuais = lerAbertos().filter((titulo) => titulo !== section.title)
    gravarAbertos(proximo ? [...atuais, section.title] : atuais)
  }

  const pendencias = items.reduce((soma, item) => soma + (badgeFor(item) ?? 0), 0)

  return (
    <div>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        aria-controls={painelId}
        className={[
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left text-sm font-semibold',
          'transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60',
          temAtivo ? 'text-papel-50' : 'text-papel-100/75 hover:bg-papel-100/10 hover:text-papel-50',
        ].join(' ')}
      >
        <span className={temAtivo ? theme.highlightIcon : 'text-papel-100/50'}>{section.icon}</span>
        <span className="flex-1">{section.title}</span>
        {!aberto && pendencias > 0 && (
          <span
            className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${theme.activeBg} ${theme.activeText}`}
            aria-label={`${pendencias} ${pendencias === 1 ? 'pendência' : 'pendências'}`}
          >
            {pendencias > 99 ? '99+' : pendencias}
          </span>
        )}
        <IconChevronDown
          className={`h-4 w-4 shrink-0 text-papel-100/40 transition-transform duration-200 motion-reduce:transition-none ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id={painelId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="ml-5 mt-1 space-y-1 border-l border-papel-100/10 pl-2" inert={!aberto ? true : undefined}>
            {items.map((item) => {
              const active = isNavItemActive(item, pathname)
              return (
                <AdminNavLink
                  key={item.href}
                  item={item}
                  active={active}
                  highlighted={isHighlighted(item, active)}
                  badgeCount={badgeFor(item)}
                  theme={theme}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
