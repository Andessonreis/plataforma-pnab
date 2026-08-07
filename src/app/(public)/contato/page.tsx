import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { AtalhoDuvidas } from './atalho-duvidas'
import { FaixaAtendimento } from './faixa-atendimento'
import { FormularioContato } from './formulario-contato'

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

      <section
        id="antes-de-escrever"
        aria-label="Antes de escrever"
        className="papel-textura bg-papel-50 py-10 sm:py-14"
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <AtalhoDuvidas />
        </div>
      </section>

      <section
        id="formulario-contato"
        aria-labelledby="formulario-contato-titulo"
        className="papel-textura bg-papel-50 pb-16 pt-2 sm:pb-20"
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="border-t-2 border-tinta-900 pt-8">
            <h2
              id="formulario-contato-titulo"
              className="titulo text-2xl leading-tight tracking-wide text-tinta-900"
            >
              Escreva sua mensagem
            </h2>
            <p className="mb-8 mt-2 text-sm leading-relaxed text-tinta-600">
              Campos marcados com asterisco são obrigatórios. Se a mensagem for sobre um edital
              específico, informar qual ajuda a resposta a chegar mais rápido.
            </p>

            <div className="border-2 border-tinta-900/15 bg-white p-6 sm:p-8">
              <FormularioContato editais={editais} />
            </div>
          </div>
        </div>
      </section>

      <FaixaAtendimento />
    </div>
  )
}
