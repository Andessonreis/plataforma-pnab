import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button, PageHeader } from '@/components/ui'
import { IconMail, IconPhone, IconMapPin, IconClock, IconArrowRight } from '@/components/ui/icons'
import { ContactForm } from './contact-form'

export const metadata: Metadata = {
  title: 'Contato e Atendimento — Portal PNAB Irecê',
  description:
    'Entre em contato com a Secretaria de Arte e Cultura de Irecê. Envie sua mensagem e receba um protocolo para acompanhamento.',
}

export default async function ContatoPage() {
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
      <PageHeader
        title="Contato e Atendimento"
        subtitle="Envie sua mensagem para a Secretaria de Arte e Cultura. Você receberá um número de protocolo para acompanhamento."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Contato' },
        ]}
      />

      {/* Conteúdo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Formulário */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Envie sua mensagem
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Preencha os campos abaixo. Todos os campos marcados com * são obrigatórios.
                </p>
                <ContactForm editais={editais} />
              </div>
            </div>

            {/* Informações de contato */}
            <div className="lg:col-span-2 space-y-6">
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
                      <p className="text-sm font-medium text-slate-900">Endereço</p>
                      <p className="text-sm text-slate-600">
                        Prefeitura Municipal de Irecê<br />
                        Praça Teotônio Marques Dourado, s/n<br />
                        Centro — Irecê/BA<br />
                        CEP: 44900-000
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <IconClock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Horário de Atendimento</p>
                      <p className="text-sm text-slate-600">
                        Segunda a sexta-feira<br />
                        08h às 12h e 14h às 17h
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ rápido */}
              <div className="bg-accent-50 rounded-xl border border-accent-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Antes de entrar em contato
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Confira se sua dúvida já foi respondida na nossa página de perguntas
                  frequentes.
                </p>
                <Link
                  href="/faq"
                  className="inline-flex items-center text-sm font-medium text-accent-700 hover:text-accent-800 transition-colors"
                >
                  Ver Perguntas Frequentes
                  <IconArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
