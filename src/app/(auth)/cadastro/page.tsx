import type { Metadata } from 'next'
import { PaginaAcesso } from '../pagina-acesso'
import { CadastroForm } from './cadastro-form'

export const metadata: Metadata = {
  title: 'Criar conta',
}

export default function CadastroPage() {
  return (
    <PaginaAcesso
      titulo="Criar conta"
      descricao="O cadastro é único: feito uma vez, vale para todos os editais da PNAB em Irecê."
    >
      <CadastroForm />
    </PaginaAcesso>
  )
}
