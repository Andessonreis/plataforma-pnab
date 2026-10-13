import type { Metadata } from 'next'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { modeloPorChave } from '../modelos'
import { QuestionarioForm } from '../questionario-form'

export const metadata: Metadata = {
  title: 'Novo questionário — Portal PNAB Irecê',
}

export default async function NovoQuestionarioPage({ searchParams }: { searchParams: Promise<{ modelo?: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const modelo = modeloPorChave((await searchParams).modelo)

  return (
    <section>
      <CabecalhoPagina
        titulo={modelo ? `Novo: ${modelo.titulo.toLowerCase()}` : 'Novo questionário'}
        descricao={
          modelo
            ? 'As perguntas do modelo já estão abaixo. Mude o que quiser; nada fica gravado até você criar.'
            : 'Começa como rascunho, fora do site. Depois de criar, use Publicar para começar a receber respostas.'
        }
        voltar={{ href: '/admin/memorial/questionarios', rotulo: 'Questionários' }}
      />
      <QuestionarioForm valoresIniciais={modelo?.valores} />
    </section>
  )
}
