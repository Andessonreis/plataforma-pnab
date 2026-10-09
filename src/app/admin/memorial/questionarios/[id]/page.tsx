import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import type { CampoFormulario } from '@/types/campo-formulario'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina, StatusChip } from '@/app/admin/memorial/_ui'
import { descreverFinalidade } from '../finalidades'
import { QuestionarioForm } from '../questionario-form'
import { AcoesQuestionario } from './acoes-questionario'
import { FaixaPublicacao } from './faixa-publicacao'

export const metadata: Metadata = {
  title: 'Editar questionário — Portal PNAB Irecê',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarQuestionarioPage({ params }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params

  const questionario = await prisma.questionario.findUnique({
    where: { id },
    include: { _count: { select: { respostas: true } } },
  })
  if (!questionario) notFound()

  const respostas = questionario._count.respostas

  return (
    <section>
      <CabecalhoPagina
        titulo={questionario.titulo}
        descricao={descreverFinalidade(questionario.finalidade).rotulo}
        voltar={{ href: '/admin/memorial/questionarios', rotulo: 'Questionários' }}
        acoes={<AcoesQuestionario id={questionario.id} titulo={questionario.titulo} status={questionario.status} respostas={respostas} />}
      />
      <div className="-mt-3 mb-4 flex flex-wrap items-center gap-2 text-sm text-tinta-700">
        <StatusChip tipo="conteudo" status={questionario.status} />
        <span>Versão {questionario.versao} das perguntas</span>
      </div>
      <FaixaPublicacao slug={questionario.slug} status={questionario.status} />

      <QuestionarioForm
        questionarioId={questionario.id}
        respostas={respostas}
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
