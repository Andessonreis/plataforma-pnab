import type { Metadata } from 'next'
import { requireRole } from '@/app/admin/require-role'
import { Cabecalho } from '../cabecalho'
import { QuestionarioForm } from '../questionario-form'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = {
  title: 'Novo questionário — Portal PNAB Irecê',
}

export default async function NovoQuestionarioPage() {
  await requireRole(...ROLES_MEMORIAL)

  return (
    <section>
      <Cabecalho
        titulo="Novo questionário"
        descricao="Começa como rascunho. Depois de salvar, use Publicar para abrir as respostas."
        voltar={{ href: '/admin/memorial/questionarios', rotulo: 'Questionários' }}
      />
      <QuestionarioForm />
    </section>
  )
}
