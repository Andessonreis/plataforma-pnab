import type { Metadata } from 'next'
import { requireRole } from '@/app/admin/require-role'
import { Cabecalho } from '../cabecalho'
import { QuestionarioForm } from '../questionario-form'

export const metadata: Metadata = {
  title: 'Novo questionário — Portal PNAB Irecê',
}

export default async function NovoQuestionarioPage() {
  await requireRole('COMUNICACAO')

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
