import Link from 'next/link'
import { IconEye, IconMail, IconFileText, IconArrowRight } from '@/components/ui/icons'

const SERVICOS = [
  {
    Icon: IconEye,
    titulo: 'Transparência',
    descricao:
      'Projetos apoiados pela PNAB em Irecê, com valores, resultados e contrapartidas abertos à comunidade.',
    href: '/projetos-apoiados',
    rotulo: 'Ver projetos apoiados',
    cor: 'text-brand-700',
  },
  {
    Icon: IconMail,
    titulo: 'Atendimento',
    descricao:
      'Dúvidas sobre editais ou inscrições? Envie sua mensagem e receba um número de protocolo para acompanhar.',
    href: '/contato',
    rotulo: 'Entrar em contato',
    cor: 'text-accent-700',
  },
  {
    Icon: IconFileText,
    titulo: 'Manuais',
    descricao:
      'Guias de inscrição, modelos de documentos e materiais para preparar sua proposta antes de enviar.',
    href: '/manuais',
    rotulo: 'Acessar manuais',
    cor: 'text-oliva-700',
  },
] as const

/**
 * Serviços do portal como lista, não como grade de cartões.
 *
 * Três caixas iguais com ícone em cima é o cartão de visita de toda página
 * gerada — aqui virou fio corrido: ícone ao lado do título, descrição e link
 * sublinhado embaixo. É a seção "quieta" da home, de propósito — depois da
 * capa de jornal, o scroll pede um respiro sem foto e sem cor de destaque.
 */
export function SecaoServicos() {
  return (
    <section className="bg-papel-100 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="titulo text-center text-xl tracking-wide text-tinta-900 sm:text-left sm:text-2xl">
          Serviços do portal
        </h2>

        <ul className="mt-5 divide-y divide-tinta-900/15 border-t-2 border-tinta-900/15">
          {SERVICOS.map((servico) => (
            <li
              key={servico.titulo}
              className="flex flex-col items-center gap-2 py-5 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left"
            >
              <div className="flex items-center gap-2.5 sm:w-52 sm:shrink-0">
                <servico.Icon className={`h-5 w-5 shrink-0 ${servico.cor}`} />
                <h3 className="titulo text-lg tracking-wide text-tinta-900">{servico.titulo}</h3>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-tinta-700 sm:text-base">
                  {servico.descricao}
                </p>
                <Link
                  href={servico.href}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 underline decoration-2 underline-offset-4 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                >
                  {servico.rotulo}
                  <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
