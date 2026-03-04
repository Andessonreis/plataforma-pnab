import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/ui'
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconClock,
  IconArrowRight,
  IconQuestion,
} from '@/components/ui/icons'
import { FadeIn } from '@/components/ui/animated'
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
      <section className="bg-slate-50 py-6 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Formulário (2/3) */}
            <div className="lg:col-span-2">
              <FadeIn delay={0.1}>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                      <IconMail className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 pt-0.5">
                        Envie sua mensagem
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Preencha os campos abaixo. Campos com * são obrigatórios.
                      </p>
                    </div>
                  </div>
                  <ContactForm editais={editais} />
                </div>
              </FadeIn>
            </div>

            {/* Sidebar (1/3) */}
            <aside className="lg:col-span-1">
              <FadeIn delay={0.2} direction="right">
                <div className="sticky top-6 space-y-5 sm:space-y-6">
                  {/* Informações de contato */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-5">
                      Secretaria de Arte e Cultura
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <IconMail className="h-4 w-4" />
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <IconPhone className="h-4 w-4" />
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <IconMapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Endereço</p>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Prefeitura Municipal de Irecê<br />
                            Praça Teotônio Marques Dourado, s/n<br />
                            Centro — Irecê/BA<br />
                            CEP: 44900-000
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <IconClock className="h-4 w-4" />
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
                  <div className="bg-accent-50 rounded-xl border border-accent-200 p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                        <IconQuestion className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Antes de entrar em contato
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Confira se sua dúvida já foi respondida na nossa página de perguntas frequentes.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/faq"
                      className="inline-flex items-center text-sm font-medium text-accent-700 hover:text-accent-800 transition-colors mt-1"
                    >
                      Ver Perguntas Frequentes
                      <IconArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </FadeIn>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
