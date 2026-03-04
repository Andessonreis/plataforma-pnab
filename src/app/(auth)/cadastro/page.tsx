import type { Metadata } from 'next'
import { CadastroForm } from './cadastro-form'

export const metadata: Metadata = {
  title: 'Cadastro',
}

export default function CadastroPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Criar conta
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Cadastre-se para se inscrever nos editais PNAB Irecê.
        </p>
      </div>

      <CadastroForm />
    </div>
  )
}
