import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { IconArrowRight, IconQuestion } from '@/components/ui/icons'
import { ContactForm } from './contact-form'
import { FaixaAtendimento } from './faixa-atendimento'

export const metadata: Metadata = {
  title: 'Falar com a Secretaria — Portal PNAB Irecê',
  description:
    'Envie sua mensagem para a Secretaria de Cultura e Turismo de Irecê e receba um protocolo para acompanhamento.',
}

const FOTOS = [
  '/images/galeria/foto-04.png', // fogueira do São João
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
  '/images/galeria/foto-03.png', // arraiá no coreto
]

export default async function ContatoPage() {
  const editais = await prisma.edital.findMany({
    where: { status: { not: 'RASCUNHO' } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, titulo: true },
  })

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Contato"
        chamada="Estamos ouvindo"
        titulo="Falar com a Secretaria"
        apoio="Toda mensagem enviada por aqui gera um número de protocolo, e é por ele que você acompanha a resposta."
      />

      <section className="papel-textura bg-papel-50 pb-16 pt-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* O atalho para as dúvidas vem antes do formulário: depois de
              escrever a mensagem, ninguém volta para conferir se a resposta
              já existia. */}
          <Link
            href="/faq"
            className="group mb-10 flex items-start gap-4 border-l-4 border-accent-500 bg-papel-100/70 p-5 transition-colors hover:bg-papel-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <IconQuestion className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
            <span>
              <span className="block font-rye text-lg leading-snug tracking-wide text-tinta-900">
                Sua pergunta pode já ter resposta
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-tinta-600">
                Prazos, documentos e recursos são o que mais perguntam. Vale conferir antes de
                escrever.
              </span>
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                Ver dúvidas frequentes
                <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </span>
          </Link>

          <div className="border-t-2 border-tinta-900 pt-8">
            <h2 className="font-rye text-2xl leading-tight tracking-wide text-tinta-900">
              Escreva sua mensagem
            </h2>
            <p className="mb-8 mt-2 text-sm leading-relaxed text-tinta-600">
              Campos marcados com asterisco são obrigatórios. Se a mensagem for sobre um edital
              específico, informar qual ajuda a resposta a chegar mais rápido.
            </p>

            <ContactForm editais={editais} />
          </div>
        </div>
      </section>

      <FaixaAtendimento />
    </div>
  )
}
