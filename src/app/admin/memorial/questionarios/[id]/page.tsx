import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/app/admin/require-role'
import { prisma } from '@/lib/db'
import { ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { Badge } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { Cabecalho } from '../cabecalho'
import { QuestionarioForm } from '../questionario-form'
import { VARIANTE_STATUS } from '../status'
import { AcoesQuestionario } from './acoes-questionario'

export const metadata: Metadata = {
  title: 'Editar questionário — Portal PNAB Irecê',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarQuestionarioPage({ params }: Props) {
  await requireRole('COMUNICACAO')
  const { id } = await params

  const questionario = await prisma.questionario.findUnique({
    where: { id },
    include: { _count: { select: { respostas: true } } },
  })
  if (!questionario) notFound()

  const respostas = questionario._count.respostas

  return (
    <section>
      <Cabecalho
        titulo={questionario.titulo}
        voltar={{ href: '/admin/memorial/questionarios', rotulo: 'Questionários' }}
        descricao={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={VARIANTE_STATUS[questionario.status]}>{ROTULO_STATUS[questionario.status]}</Badge>
            <span>Versão {questionario.versao}</span>
          </span>
        }
        acoes={
          <AcoesQuestionario
            id={questionario.id}
            slug={questionario.slug}
            titulo={questionario.titulo}
            status={questionario.status}
            respostas={respostas}
          />
        }
      />

      <QuestionarioForm
        questionarioId={questionario.id}
        valoresIniciais={{
          slug: questionario.slug,
          titulo: questionario.titulo,
          descricao: questionario.descricao ?? '',
          finalidade: questionario.finalidade,
          exigeLogin: questionario.exigeLogin,
          mensagemSucesso: questionario.mensagemSucesso ?? '',
          campos: questionario.campos as unknown as CampoFormulario[],
        }}
      />
    </section>
  )
}
