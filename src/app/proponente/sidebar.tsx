import { BrandLockup } from './brand-lockup'
import { SidebarNav } from './sidebar-nav'
import { UserBlock } from './user-block'

interface ProponenteSidebarProps {
  userName: string
  userAvatarUrl: string | null
  unreadCount: number
}

/**
 * Menu lateral do desktop. No celular o `<aside>` some do fluxo
 * (`max-lg:contents`) e só o menu sobrevive, como barra de abas no rodapé.
 * Coluna em tinta escura: é a lombada da pasta, a âncora que segura a tela
 * de papel à direita. A marca vai numa etiqueta de papel colada no alto,
 * porque o logo horizontal tem letreiro em tinta e sumiria no fundo escuro.
 */
export function ProponenteSidebar({ userName, userAvatarUrl, unreadCount }: ProponenteSidebarProps) {
  return (
    <aside className="max-lg:contents lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:w-72 lg:shrink-0 lg:flex-col lg:bg-tinta-950 lg:text-papel-50">
      <div className="hidden px-5 pb-5 pt-6 lg:block">
        <div className="cartela bg-papel-100 px-4 py-3">
          <BrandLockup variante="completa" />
        </div>
        <p className="rotulo mt-4 text-xs text-accent-300">Área do proponente</p>
      </div>
      <SidebarNav unreadCount={unreadCount} />
      <div className="hidden lg:block">
        <UserBlock nome={userName} avatarUrl={userAvatarUrl} />
      </div>
    </aside>
  )
}
