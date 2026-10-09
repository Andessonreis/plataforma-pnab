import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ServiceError } from '@/lib/services/errors'
import { obterQuestionarioPublicado } from '@/lib/services/questionario.service'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { ResponderQuestionario } from './responder-questionario'

interface Props {
  params: Promise<{ slug: string }>
}

const FOTOS = ['/images/galeria/foto-05.png', '/images/cidade/panoramica-irece.jpg', '/images/galeria/foto-02.png']

// generateMetadata e a página pedem o mesmo questionário; o cache evita a segunda consulta.
const buscar = cache(async (slug: string) => {
  try {
    return await obterQuestionarioPublicado(slug)
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'NOT_FOUND') return null
    throw err
  }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const questionario = await buscar((await params).slug)
  if (!questionario) return { title: 'Questionário não encontrado — Portal PNAB Irecê' }
  return {
    title: `${questionario.titulo} — Portal PNAB Irecê`,
    description: questionario.descricao ?? undefined,
  }
}

export default async function QuestionarioPage({ params }: Props) {
  const { slug } = await params
  const questionario = await buscar(slug)
  if (!questionario) notFound()

  if (questionario.exigeLogin) {
    const session = await auth()
    if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(`/questionarios/${slug}`)}`)
  }

  const temObrigatorio = questionario.campos.some((c) => c.obrigatorio)

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Questionário"
        chamada="Sua resposta conta"
        titulo={questionario.titulo}
        apoio={questionario.descricao ?? undefined}
      />

      <section aria-labelledby="questionario-titulo" className="papel-textura bg-papel-50 pb-16 pt-10 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="border-t-2 border-tinta-900 pt-8">
            <h2 id="questionario-titulo" className="titulo text-2xl leading-tight tracking-wide text-tinta-900">
              Responda abaixo
            </h2>
            {temObrigatorio && (
              <p className="mb-8 mt-2 text-sm leading-relaxed text-tinta-600">
                Perguntas marcadas com asterisco são obrigatórias.
              </p>
            )}
            <div className={`border-2 border-tinta-900/15 bg-white p-5 sm:p-8 ${temObrigatorio ? '' : 'mt-8'}`}>
              <ResponderQuestionario slug={questionario.slug} campos={questionario.campos} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
