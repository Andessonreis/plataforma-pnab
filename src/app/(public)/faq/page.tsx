import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/ui'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { IconArrowRight, IconQuestion } from '@/components/ui/icons'
import { consultarDuvidas } from './consulta'
import { CadernoDuvidas } from './caderno-duvidas'

export const metadata: Metadata = {
  title: 'Dúvidas — Portal PNAB Irecê',
  description:
    'Respostas para as dúvidas mais comuns sobre editais, inscrições, prazos e resultados da PNAB em Irecê.',
}

const FOTOS = [
  '/images/galeria/foto-02.png', // pórtico Minha Feliz Cidade
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
]

export default async function FaqPage() {
  const cadernos = await consultarDuvidas()
  const total = cadernos.reduce((soma, c) => soma + c.duvidas.length, 0)

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Dúvidas"
        chamada="Antes de perguntar"
        titulo="Dúvidas frequentes"
        apoio="O que mais perguntam sobre inscrição, prazos, documentos e resultados. Se a sua não estiver aqui, a Secretaria responde."
      >
        {total > 0 && (
          <p className="mt-8 border-t border-papel-100/20 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
            <span className="text-accent-300">{total}</span>{' '}
            {total === 1 ? 'dúvida respondida' : 'dúvidas respondidas'}
            {cadernos.length > 1 && (
              <>
                <span className="px-2 text-papel-200/40" aria-hidden="true">
                  ·
                </span>
                {cadernos.length} cadernos
              </>
            )}
          </p>
        )}
      </FolhaDeRosto>

      <section className="papel-textura bg-papel-50 pb-16 pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {cadernos.length > 0 ? (
            <CadernoDuvidas cadernos={cadernos} />
          ) : (
            <div className="py-16">
              <EmptyState
                icon={<IconQuestion className="h-8 w-8 text-tinta-400" />}
                title="Nenhuma dúvida publicada ainda"
                description="Assim que as primeiras perguntas chegarem, as respostas passam a viver aqui. Enquanto isso, fale direto com a Secretaria."
                action={{ label: 'Falar com a Secretaria', href: '/contato' }}
              />
            </div>
          )}
        </div>
      </section>

      {/* O convite para perguntar fecha a página, e não uma caixa na lateral:
          só faz sentido depois que a pessoa procurou e não achou. */}
      <section className="bg-tinta-950 text-papel-100">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h2 className="font-rye text-2xl leading-tight tracking-wide text-papel-50">
              Não achou sua dúvida aqui?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-papel-200/85">
              Escreva para a Secretaria. Toda mensagem gera um protocolo, e é por ele que você
              acompanha a resposta.
            </p>
          </div>

          <Link
            href="/contato"
            className="group inline-flex min-h-[48px] shrink-0 items-center gap-2 bg-accent-500 px-6 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
          >
            Escrever à Secretaria
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}
