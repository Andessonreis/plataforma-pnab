import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge, Button, PageHeader, EmptyState } from '@/components/ui'
import { IconPdf, IconDocument, IconDownload, IconBook } from '@/components/ui/icons'

export const metadata: Metadata = {
  title: 'Manuais e Documentos — Portal PNAB Irecê',
  description:
    'Baixe manuais, guias e documentos de apoio para proponentes dos editais PNAB Irecê.',
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
      <PageHeader
        title="Manuais e Documentos"
        subtitle="Materiais de apoio para proponentes: guias de inscrição, manuais de prestação de contas e documentos institucionais."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Manuais' },
        ]}
      />

      {/* Conteúdo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {manuais.length === 0 ? (
            <EmptyState
              icon={<IconBook className="h-8 w-8 text-slate-400" />}
              title="Nenhum manual disponível ainda"
              description="Os manuais e documentos de apoio serão disponibilizados aqui quando houver editais em andamento."
            />
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
                          className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex items-start gap-4"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors">
                            <FileIcon className="h-6 w-6" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                              {manual.titulo}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="section-labeltext-slate-500">
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
              Se tiver dificuldades com algum manual ou precisar de orientação sobre o
              preenchimento de formulários, entre em contato com a Secretaria.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button href="/faq" variant="outline">
                Ver Perguntas Frequentes
              </Button>
              <Button href="/contato">
                Entrar em contato
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
