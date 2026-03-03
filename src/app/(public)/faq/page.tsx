import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button, PageHeader, EmptyState } from '@/components/ui'
import { IconQuestion } from '@/components/ui/icons'
import { FaqAccordion } from './faq-accordion'

export const metadata: Metadata = {
  title: 'Perguntas Frequentes — Portal PNAB Irecê',
  description:
    'Encontre respostas para as dúvidas mais comuns sobre editais, inscrições, prazos e resultados da PNAB em Irecê.',
}

interface FaqPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function FaqPage({ searchParams }: FaqPageProps) {
  const params = await searchParams
  const query = params.q ?? ''

  const generalItems = await prisma.faqItem.findMany({
    where: {
      publicado: true,
      editalId: null,
    },
    orderBy: { ordem: 'asc' },
    select: {
      id: true,
      pergunta: true,
      resposta: true,
    },
  })

  const editalItems = await prisma.faqItem.findMany({
    where: {
      publicado: true,
      editalId: { not: null },
    },
    orderBy: { ordem: 'asc' },
    select: {
      id: true,
      pergunta: true,
      resposta: true,
      edital: {
        select: {
          titulo: true,
          slug: true,
        },
      },
    },
  })

  const editalGroups = new Map<string, { titulo: string; slug: string; items: { id: string; pergunta: string; resposta: string }[] }>()

  for (const item of editalItems) {
    if (!item.edital) continue
    const key = item.edital.slug

    if (!editalGroups.has(key)) {
      editalGroups.set(key, {
        titulo: item.edital.titulo,
        slug: item.edital.slug,
        items: [],
      })
    }

    editalGroups.get(key)!.items.push({
      id: item.id,
      pergunta: item.pergunta,
      resposta: item.resposta,
    })
  }

  const hasAnyContent = generalItems.length > 0 || editalGroups.size > 0

  return (
    <>
      <PageHeader
        title="Perguntas Frequentes"
        subtitle="Encontre respostas para as dúvidas mais comuns sobre editais, inscrições e o processo de fomento cultural da PNAB em Irecê."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Perguntas Frequentes' },
        ]}
      />

      {/* Conteúdo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {!hasAnyContent ? (
            <EmptyState
              icon={<IconQuestion className="h-8 w-8 text-slate-400" />}
              title="Nenhuma pergunta cadastrada ainda"
              description="Em breve publicaremos as dúvidas mais frequentes. Enquanto isso, entre em contato diretamente com a Secretaria."
              action={{ label: 'Entrar em contato', href: '/contato' }}
            />
          ) : (
            <>
              {generalItems.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Dúvidas Gerais
                  </h2>
                  <FaqAccordion items={generalItems} initialQuery={query} />
                </div>
              )}

              {Array.from(editalGroups.values()).map((group) => (
                <div key={group.slug} className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {group.titulo}
                    </h2>
                    <Link
                      href={`/editais/${group.slug}`}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Ver edital
                    </Link>
                  </div>
                  <FaqAccordion items={group.items} />
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* CTA de contato */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Não encontrou sua resposta?
          </h2>
          <p className="mt-3 text-slate-600">
            Entre em contato com a Secretaria de Arte e Cultura. Sua mensagem gerará
            um protocolo para acompanhamento.
          </p>
          <div className="mt-6">
            <Button href="/contato">
              Enviar mensagem
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
