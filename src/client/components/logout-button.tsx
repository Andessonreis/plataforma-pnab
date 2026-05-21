'use client'

import { useRouter } from 'next/navigation'
import { IconLogout } from '@client/components/ui'
import { autenticacaoClient } from '@client/api/autenticacao.client'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter()

  async function handleLogout() {
    await autenticacaoClient.logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      <IconLogout className="h-5 w-5" />
      Sair
    </button>
  )
}
