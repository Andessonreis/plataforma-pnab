import Link from 'next/link'
import type { CSSProperties } from 'react'
import { StaggerContainer, StaggerItem } from '@/components/ui/animated'
import { Button } from '@/components/ui'
import { IconEye, IconMail, IconFileText, IconArrowRight } from '@/components/ui/icons'

const SERVICOS = [
  {
    Icon: IconEye,
    titulo: 'Transparência',
    chamada: 'Prestação de contas pública',
    descricao:
      'Projetos apoiados pela PNAB em Irecê, com valores, resultados e contrapartidas abertos à comunidade.',
    href: '/projetos-apoiados',
    rotulo: 'Ver projetos apoiados',
    faixa: 'bg-brand-600',
    cor: 'text-brand-700',
    vaoSelo: '#fdf3ef',
    variante: 'primary',
  },
  {
    Icon: IconMail,
    titulo: 'Atendimento',
    chamada: 'Suporte e acompanhamento',
    descricao:
      'Dúvidas sobre editais ou inscrições? Envie sua mensagem e receba um número de protocolo para acompanhar.',
    href: '/contato',
    rotulo: 'Entrar em contato',
    faixa: 'bg-accent-500',
    cor: 'text-accent-700',
    vaoSelo: '#fefbf6',
    variante: 'secondary',
  },
  {
    Icon: IconFileText,
    titulo: 'Manuais',
    chamada: 'Materiais de apoio',
    descricao:
      'Guias de inscrição, modelos de documentos e materiais para preparar sua proposta antes de enviar.',
    href: '/manuais',
    rotulo: 'Acessar manuais',
    faixa: 'bg-oliva-700',
    cor: 'text-oliva-700',
    vaoSelo: '#bad87b',
    variante: 'outline',
  },
] as const

/** Serviços do portal: transparência, atendimento e materiais de apoio. */
export function SecaoServicos() {
  return (
    <section className="papel-textura border-t-2 border-tinta-900/10 bg-papel-100 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerContainer
          className="grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-7"
          staggerDelay={0.15}
        >
          {SERVICOS.map((servico) => (
            <StaggerItem key={servico.titulo}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-md border-2 border-tinta-900/15 bg-papel-50 p-6 transition-colors duration-300 hover:border-tinta-900/30 sm:p-7">
                <div className={`absolute left-0 top-0 h-1.5 w-full ${servico.faixa}`} />

                <div
                  className={`selo mb-4 h-12 w-12 shrink-0 transition-transform duration-300 group-hover:scale-105 ${servico.cor}`}
                  style={{ '--selo-gap': servico.vaoSelo } as CSSProperties}
                >
                  <servico.Icon className="h-6 w-6" />
                </div>

                <h2 className="font-rye text-xl tracking-wide text-tinta-900">{servico.titulo}</h2>
                <p className="mt-0.5 text-sm text-tinta-600">{servico.chamada}</p>
                <p className="mt-3 flex-1 leading-relaxed text-tinta-700">{servico.descricao}</p>

                <Button href={servico.href} variant={servico.variante} className="mt-5 self-start">
                  {servico.rotulo}
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="mt-8 text-center">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Acompanhe as notícias da Secretaria
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
