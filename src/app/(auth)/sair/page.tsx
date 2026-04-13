'use client'

import { signOut } from 'next-auth/react'

export default function SignOutPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Sair do sistema
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Tem certeza que deseja encerrar sua sessão?
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors min-h-[44px]"
        >
          Sim, sair
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 transition-colors min-h-[44px]"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
