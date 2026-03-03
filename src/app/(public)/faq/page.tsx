import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
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

  // Busca perguntas gerais (sem editalId) publicadas
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

  // Busca perguntas associadas a editais publicados
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

  // Agrupa por edital
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
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <nav className="mb-4 text-sm text-brand-200" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium">Perguntas Frequentes</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Perguntas Frequentes
          </h1>
          <p className="mt-3 text-lg text-brand-100 max-w-2xl">
            Encontre respostas para as duvidas mais comuns sobre editais, inscricoes e o
            processo de fomento cultural da PNAB em Irece.
          </p>
        </div>
      </section>

      {/* Conteudo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {!hasAnyContent ? (
            /* Estado vazio */
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Nenhuma pergunta cadastrada ainda
              </h2>
              <p className="mt-2 text-slate-600 max-w-md mx-auto">
                Em breve publicaremos as duvidas mais frequentes. Enquanto isso, entre
                em contato diretamente com a Secretaria.
              </p>
              <Link
                href="/contato"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 transition-colors min-h-[44px]"
              >
                Entrar em contato
              </Link>
            </div>
          ) : (
            <>
              {/* Perguntas gerais */}
              {generalItems.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    Duvidas Gerais
                  </h2>
                  <FaqAccordion items={generalItems} initialQuery={query} />
                </div>
              )}

              {/* Perguntas por edital */}
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
            Nao encontrou sua resposta?
          </h2>
          <p className="mt-3 text-slate-600">
            Entre em contato com a Secretaria de Arte e Cultura. Sua mensagem gerara
            um protocolo para acompanhamento.
          </p>
          <Link
            href="/contato"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 transition-colors min-h-[44px]"
          >
            Enviar mensagem
          </Link>
        </div>
      </section>
    </>
  )
}
