import { LogoutButton } from '@/components/logout-button'
import { UserAvatar } from '@/components/ui'

interface UserBlockProps {
  nome: string
  avatarUrl: string | null
}

/** Quem está logado e o botão de sair, no pé do menu lateral do desktop. */
export function UserBlock({ nome, avatarUrl }: UserBlockProps) {
  return (
    <div className="border-t border-papel-50/15 px-3 py-3">
      <div className="flex items-center gap-3 px-3 py-2">
        <UserAvatar nome={nome} src={avatarUrl} size={40} />
        <p className="min-w-0 truncate font-semibold text-papel-50">{nome}</p>
      </div>
      <LogoutButton className="flex min-h-[48px] w-full items-center gap-3 px-3 text-base font-semibold text-papel-200 transition-colors hover:bg-papel-50/10 hover:text-accent-300 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-400" />
    </div>
  )
}
