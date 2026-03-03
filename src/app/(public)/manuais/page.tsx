import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Manuais e Documentos — Portal PNAB Irece',
  description:
    'Baixe manuais, guias e documentos de apoio para proponentes dos editais PNAB Irece.',
}

function IconPdf({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function getFileIcon(url: string) {
  const lower = url.toLowerCase()
  if (lower.endsWith('.pdf')) return IconPdf
  return IconDocument
}

function getFileExtension(url: string): string {
  const parts = url.split('.')
  if (parts.length > 1) {
    return parts[parts.length - 1].toUpperCase()
  }
  return 'ARQUIVO'
}

export default async function ManuaisPage() {
  const manuais = await prisma.manual.findMany({
    where: { publicado: true },
    orderBy: [{ categoria: 'asc' }, { titulo: 'asc' }],
  })

  // Agrupa por categoria
  const groups = new Map<string, typeof manuais>()
  for (const manual of manuais) {
    const key = manual.categoria
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(manual)
  }

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
              <li className="text-white font-medium">Manuais</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Manuais e Documentos
          </h1>
          <p className="mt-3 text-lg text-brand-100 max-w-2xl">
            Materiais de apoio para proponentes: guias de inscricao, manuais de
            prestacao de contas e documentos institucionais.
          </p>
        </div>
      </section>

      {/* Conteudo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {manuais.length === 0 ? (
            /* Estado vazio */
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Nenhum manual disponivel ainda
              </h2>
              <p className="mt-2 text-slate-600 max-w-md mx-auto">
                Os manuais e documentos de apoio serao disponibilizados aqui quando
                houver editais em andamento.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {Array.from(groups.entries()).map(([categoria, items]) => (
                <div key={categoria}>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {categoria}
                    </h2>
                    <Badge variant="neutral">
                      {items.length} {items.length === 1 ? 'documento' : 'documentos'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((manual) => {
                      const FileIcon = getFileIcon(manual.url)
                      const extension = getFileExtension(manual.url)

                      return (
                        <a
                          key={manual.id}
                          href={manual.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex items-start gap-4"
                        >
                          {/* Icone do arquivo */}
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors">
                            <FileIcon className="h-6 w-6" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                              {manual.titulo}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs text-slate-500 uppercase font-medium">
                                {extension}
                              </span>
                              {manual.versao && (
                                <>
                                  <span className="text-slate-300" aria-hidden="true">|</span>
                                  <span className="text-xs text-slate-500">
                                    v{manual.versao}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Download icon */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                            <IconDownload className="h-5 w-5" />
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ajuda */}
          <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              Precisa de ajuda com os documentos?
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
              Se tiver dificuldades com algum manual ou precisar de orientacao sobre o
              preenchimento de formularios, entre em contato com a Secretaria.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/faq"
                className="inline-flex items-center justify-center rounded-lg border-2 border-brand-600 text-brand-700 px-5 py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors min-h-[44px]"
              >
                Ver Perguntas Frequentes
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors min-h-[44px]"
              >
                Entrar em contato
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
