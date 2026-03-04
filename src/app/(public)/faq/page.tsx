import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button, PageHeader, EmptyState } from '@/components/ui'
import {
  IconQuestion,
  IconDocument,
  IconMail,
  IconArrowRight,
} from '@/components/ui/icons'
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/animated'
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
  const totalQuestions = generalItems.length + editalItems.length

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
      <section className="bg-slate-50 py-6 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {!hasAnyContent ? (
            <EmptyState
              icon={<IconQuestion className="h-8 w-8 text-slate-400" />}
              title="Nenhuma pergunta cadastrada ainda"
              description="Em breve publicaremos as dúvidas mais frequentes. Enquanto isso, entre em contato diretamente com a Secretaria."
              action={{ label: 'Entrar em contato', href: '/contato' }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Coluna principal (2/3) */}
              <div className="lg:col-span-2 space-y-8 sm:space-y-10">
                {/* Dúvidas gerais */}
                {generalItems.length > 0 && (
                  <FadeIn delay={0.1}>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                      <div className="flex items-start gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                          <IconQuestion className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900 pt-0.5">
                            Dúvidas Gerais
                          </h2>
                          <p className="text-sm text-slate-500 mt-0.5">
                            Sobre a PNAB, editais e inscrições
                          </p>
                        </div>
                      </div>
                      <FaqAccordion items={generalItems} initialQuery={query} />
                    </div>
                  </FadeIn>
                )}

                {/* FAQs por edital */}
                {Array.from(editalGroups.values()).map((group, index) => (
                  <FadeIn key={group.slug} delay={0.15 + index * 0.1}>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 shrink-0">
                            <IconDocument className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-slate-900 pt-0.5">
                              {group.titulo}
                            </h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {group.items.length} {group.items.length === 1 ? 'pergunta' : 'perguntas'}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/editais/${group.slug}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors shrink-0 mt-1"
                        >
                          Ver edital
                          <IconArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                      <FaqAccordion items={group.items} />
                    </div>
                  </FadeIn>
                ))}
              </div>

              {/* Sidebar (1/3) */}
              <aside className="lg:col-span-1">
                <FadeIn delay={0.2} direction="right">
                  <div className="sticky top-6 space-y-6">
                    {/* Resumo */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-base font-semibold text-slate-900 mb-4">
                        Resumo
                      </h3>
                      <dl className="space-y-3 text-sm">
                        <div>
                          <dt className="text-slate-500">Total de perguntas</dt>
                          <dd className="mt-0.5 font-semibold text-slate-900 text-lg">
                            {totalQuestions}
                          </dd>
                        </div>
                        {generalItems.length > 0 && (
                          <div>
                            <dt className="text-slate-500">Dúvidas gerais</dt>
                            <dd className="mt-0.5 font-medium text-slate-900">
                              {generalItems.length} {generalItems.length === 1 ? 'pergunta' : 'perguntas'}
                            </dd>
                          </div>
                        )}
                        {editalGroups.size > 0 && (
                          <div>
                            <dt className="text-slate-500">Editais com FAQ</dt>
                            <dd className="mt-0.5 font-medium text-slate-900">
                              {editalGroups.size} {editalGroups.size === 1 ? 'edital' : 'editais'}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Links rápidos */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-base font-semibold text-slate-900 mb-4">
                        Links Úteis
                      </h3>
                      <StaggerContainer className="space-y-2" staggerDelay={0.08}>
                        <StaggerItem>
                          <Link
                            href="/editais"
                            className="flex items-center gap-3 rounded-lg p-3 -mx-1 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors group"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 group-hover:bg-brand-50 shrink-0 transition-colors">
                              <IconDocument className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
                            </div>
                            <span className="font-medium">Ver editais abertos</span>
                          </Link>
                        </StaggerItem>
                        <StaggerItem>
                          <Link
                            href="/contato"
                            className="flex items-center gap-3 rounded-lg p-3 -mx-1 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors group"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 group-hover:bg-brand-50 shrink-0 transition-colors">
                              <IconMail className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
                            </div>
                            <span className="font-medium">Enviar mensagem</span>
                          </Link>
                        </StaggerItem>
                      </StaggerContainer>
                    </div>

                    {/* CTA contato */}
                    <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white shadow-lg">
                      <h3 className="text-lg font-semibold mb-2">
                        Não encontrou sua resposta?
                      </h3>
                      <p className="text-brand-100 text-sm mb-5 leading-relaxed">
                        Entre em contato com a Secretaria. Sua mensagem gerará um protocolo para acompanhamento.
                      </p>
                      <Link
                        href="/contato"
                        className="inline-flex items-center justify-center w-full gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-md hover:bg-brand-50 transition-colors"
                      >
                        <IconMail className="h-4 w-4" />
                        Enviar mensagem
                      </Link>
                    </div>
                  </div>
                </FadeIn>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
