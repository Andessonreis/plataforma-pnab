'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui'
import { UserForm } from './user-form'

export function NovoUsuarioModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleSuccess() {
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Novo Usuário</DialogTitle>
          <DialogDescription className="text-slate-600">
            Cadastre um usuário e defina o perfil de acesso dele no portal.
          </DialogDescription>
        </DialogHeader>

        <UserForm onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
