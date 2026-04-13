'use client'

import { signOut } from 'next-auth/react'
import { IconLogout } from '@/components/ui'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={className}
    >
      <IconLogout className="h-5 w-5" />
      Sair
    </button>
  )
}
