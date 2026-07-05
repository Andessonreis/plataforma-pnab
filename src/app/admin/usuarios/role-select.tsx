'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge, Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import type { UserRole } from '@prisma/client'

const roleLabels: Record<UserRole, string> = {
  PROPONENTE: 'Proponente',
  ATENDIMENTO: 'Atendimento',
  HABILITADOR: 'Habilitador',
  AVALIADOR: 'Avaliador',
  ADMIN: 'Administrador',
}

interface RoleSelectProps {
  userId: string
  userName: string
  currentRole: UserRole
  /** Admin logado não pode alterar o próprio perfil */
  isSelf: boolean
}

export function RoleSelect({ userId, userName, currentRole, isSelf }: RoleSelectProps) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(currentRole)
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!pendingRole) return
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro ao alterar perfil',
          description: data.message || 'Tente novamente em instantes.',
        })
        return
      }

      setRole(pendingRole)
      toast({ title: `Perfil de ${userName} alterado para ${roleLabels[pendingRole]}` })
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Verifique sua internet e tente novamente.',
      })
    } finally {
      setLoading(false)
      setPendingRole(null)
    }
  }

  if (isSelf) {
    return (
      <span
        className="inline-block text-sm text-slate-500 py-1.5"
        title="Você não pode alterar o seu próprio perfil de acesso"
      >
        {roleLabels[role]} (você)
      </span>
    )
  }

  return (
    <>
      <select
        value={role}
        onChange={(e) => setPendingRole(e.target.value as UserRole)}
        disabled={loading}
        aria-label={`Perfil de acesso de ${userName}`}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed min-h-[36px]"
      >
        {(Object.keys(roleLabels) as UserRole[]).map((r) => (
          <option key={r} value={r}>
            {roleLabels[r]}
          </option>
        ))}
      </select>

      <Dialog
        open={pendingRole !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !loading) setPendingRole(null)
        }}
      >
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Alterar perfil de acesso</DialogTitle>
            <DialogDescription className="text-slate-600">
              O acesso de <strong className="text-slate-900">{userName}</strong> ao portal será
              alterado imediatamente. Essa ação fica registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>

          {pendingRole && (
            <div className="flex items-center justify-center gap-3 py-2">
              <Badge variant="neutral">{roleLabels[role]}</Badge>
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <Badge variant="info">{roleLabels[pendingRole]}</Badge>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingRole(null)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} loading={loading}>
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
