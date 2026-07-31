import type { CSSProperties } from 'react'
import Image from 'next/image'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animated'
import {
  IconSearch,
  IconClipboard,
  IconFileText,
  IconCheck,
} from '@/components/ui/icons'

/**
 * Cada passo carrega a cor de um dos tons da identidade e a cor do vão do
 * selo (`--selo-gap`), que precisa acompanhar o tom para o anel duplo ler
 * como carimbo e não como borda dupla achatada.
 */
const PASSOS = [
  {
    Icon: IconSearch,
    numero: '01',
    titulo: 'Consulte os editais',
    descricao: 'Veja os editais abertos no topo da página, leia o regulamento e baixe os anexos.',
    cor: 'text-brand-700',
    vaoSelo: '#fdf3ef',
  },
  {
    Icon: IconClipboard,
    numero: '02',
    titulo: 'Cadastre-se',
    descricao: 'Crie sua conta como Pessoa Física, Jurídica ou Coletivo Cultural.',
    cor: 'text-oliva-700',
    vaoSelo: '#bad87b',
  },
  {
    Icon: IconFileText,
    numero: '03',
    titulo: 'Inscreva seu projeto',
    descricao: 'Preencha o formulário, anexe os documentos e envie sua proposta.',
    cor: 'text-agua-700',
    vaoSelo: '#75eaf0',
  },
  {
    Icon: IconCheck,
    numero: '04',
    titulo: 'Acompanhe o resultado',
    descricao: 'Receba notificações sobre habilitação, avaliação e resultado final.',
    cor: 'text-ameixa-700',
    vaoSelo: '#e3dde3',
  },
] as const

/** Passo a passo da inscrição — vem logo após os editais, sem respiro extra. */
export function PassosInscricao() {
  return (
    <section className="papel-textura relative overflow-hidden bg-papel-100 py-8 sm:py-10">
      {/* Sanfona da identidade visual como marca d'água, ocupando a folga à direita do título */}
      <Image
        src="/images/secult/sanfona.png"
        alt=""
        width={800}
        height={654}
        className="pointer-events-none absolute -right-6 -top-4 hidden h-36 w-auto opacity-[0.07] lg:block"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-7">
          <p className="mb-0.5 -rotate-1 font-caveat text-2xl text-brand-700">Como funciona</p>
          <h2 className="font-rye text-2xl tracking-wide text-tinta-900 sm:text-3xl">
            Inscreva-se em 4 passos
          </h2>
        </FadeIn>

        <div className="relative">
          <div
            className="absolute left-7 right-[25%] top-7 hidden border-t-2 border-dashed border-tinta-900/20 lg:block"
            aria-hidden="true"
          />

          <StaggerContainer
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
            staggerDelay={0.12}
            delay={0.1}
          >
            {PASSOS.map((passo) => (
              <StaggerItem key={passo.numero} className="group relative">
                <div
                  className={`selo relative z-10 mb-3 h-14 w-14 font-rye text-lg transition-transform duration-300 group-hover:scale-105 ${passo.cor}`}
                  style={{ '--selo-gap': passo.vaoSelo } as CSSProperties}
                >
                  {passo.numero}
                </div>
                <h3 className="flex items-center gap-1.5 text-lg font-semibold text-tinta-900">
                  <passo.Icon className={`h-4 w-4 shrink-0 ${passo.cor}`} />
                  {passo.titulo}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-tinta-700">{passo.descricao}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  )
}
