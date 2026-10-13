import { LogoutButton } from '@/components/logout-button'
import { UserAvatar } from '@/components/ui'
import { BrandLockup } from './brand-lockup'

interface MobileTopBarProps {
  nome: string
  avatarUrl: string | null
}

/**
 * Barra de topo do celular: marca à esquerda, quem está logado e "Sair" à
 * direita, sobre a mesma tinta da barra de abas. A navegação mora no rodapé, não aqui.
 */
export function MobileTopBar({ nome, avatarUrl }: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between gap-3 bg-tinta-950 px-4 text-papel-50 lg:hidden">
      <BrandLockup variante="compacta" />
      <div className="flex items-center gap-1">
        <UserAvatar nome={nome} src={avatarUrl} size={32} />
        <LogoutButton className="flex min-h-[44px] items-center gap-2 px-3 text-sm font-semibold text-papel-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400" />
      </div>
    </header>
  )
}
