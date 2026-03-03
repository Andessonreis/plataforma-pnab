import type { Metadata } from 'next'
import { CadastroForm } from './cadastro-form'

export const metadata: Metadata = {
  title: 'Cadastro',
}

export default function CadastroPage() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
        <p className="mt-2 text-sm text-slate-600">
          Cadastre-se para se inscrever nos editais PNAB Irecê.
        </p>
      </div>

      <CadastroForm />
    </div>
  )
}
