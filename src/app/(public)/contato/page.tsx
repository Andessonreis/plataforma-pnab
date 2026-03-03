import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ContactForm } from './contact-form'

export const metadata: Metadata = {
  title: 'Contato e Atendimento — Portal PNAB Irece',
  description:
    'Entre em contato com a Secretaria de Arte e Cultura de Irece. Envie sua mensagem e receba um protocolo para acompanhamento.',
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  )
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  )
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

export default async function ContatoPage() {
  // Busca editais ativos para o dropdown do formulario
  const editais = await prisma.edital.findMany({
    where: {
      status: { not: 'RASCUNHO' },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      titulo: true,
    },
  })

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
              <li className="text-white font-medium">Contato</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Contato e Atendimento
          </h1>
          <p className="mt-3 text-lg text-brand-100 max-w-2xl">
            Envie sua mensagem para a Secretaria de Arte e Cultura. Voce recebera um
            numero de protocolo para acompanhamento.
          </p>
        </div>
      </section>

      {/* Conteudo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Formulario */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Envie sua mensagem
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Preencha os campos abaixo. Todos os campos marcados com * sao obrigatorios.
                </p>
                <ContactForm editais={editais} />
              </div>
            </div>

            {/* Informacoes de contato */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dados da Secretaria */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5">
                  Secretaria de Arte e Cultura
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <IconMail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">E-mail</p>
                      <a
                        href="mailto:cultura@irece.ba.gov.br"
                        className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
                      >
                        cultura@irece.ba.gov.br
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <IconPhone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Telefone</p>
                      <a
                        href="tel:+557436413116"
                        className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
                      >
                        (74) 3641-3116
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <IconMapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Endereco</p>
                      <p className="text-sm text-slate-600">
                        Prefeitura Municipal de Irece<br />
                        Praca Teotonio Marques Dourado, s/n<br />
                        Centro — Irece/BA<br />
                        CEP: 44900-000
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <IconClock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Horario de Atendimento</p>
                      <p className="text-sm text-slate-600">
                        Segunda a sexta-feira<br />
                        08h as 12h e 14h as 17h
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ rapido */}
              <div className="bg-accent-50 rounded-xl border border-accent-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Antes de entrar em contato
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Confira se sua duvida ja foi respondida na nossa pagina de perguntas
                  frequentes.
                </p>
                <Link
                  href="/faq"
                  className="inline-flex items-center text-sm font-medium text-accent-700 hover:text-accent-800 transition-colors"
                >
                  Ver Perguntas Frequentes
                  <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
