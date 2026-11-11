import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/ui'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { IconArrowRight, IconBook } from '@/components/ui/icons'
import { consultarManuais } from './consulta'
import { SecaoCategoria } from './secao-categoria'

export const metadata: Metadata = {
  title: 'Manuais e Documentos — Portal PNAB Irecê',
  description:
    'Manuais, modelos, documentos e marcas oficiais para proponentes dos editais da PNAB em Irecê.',
}

const FOTOS = [
  '/images/galeria/foto-02.png', // pórtico Minha Feliz Cidade
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
]

export default async function ManuaisPage() {
  const categorias = await consultarManuais()
  const total = categorias.reduce((soma, c) => soma + c.manuais.length, 0)

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Manuais"
        chamada="Para consultar e baixar"
        titulo="Manuais e documentos"
        apoio="Modelos de relatório, guias, documentos institucionais e as marcas oficiais para usar nas suas peças."
      >
        {total > 0 && (
          <nav aria-label="Categorias" className="mt-8 border-t border-papel-100/20 pt-5">
            <ul className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className="inline-flex min-h-[44px] items-center border border-papel-100/40 px-4 text-xs font-bold uppercase tracking-[0.14em] text-papel-50 transition-colors hover:bg-papel-50 hover:text-tinta-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
                  >
                    {c.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </FolhaDeRosto>

      <div className="papel-textura bg-papel-50 pb-16 pt-10">
        <div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6 lg:px-8">
          {categorias.length > 0 ? (
            categorias.map((c, i) => <SecaoCategoria key={c.id} categoria={c} posicao={i} />)
          ) : (
            <div className="py-16">
              <EmptyState
                icon={<IconBook className="h-8 w-8 text-tinta-400" />}
                title="Nenhum documento publicado ainda"
                description="Os manuais e modelos aparecem aqui assim que a Secretaria publicar."
              />
            </div>
          )}
        </div>
      </div>

      <section id="manuais-ajuda" className="bg-tinta-950 text-papel-100">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h2 className="titulo text-2xl leading-tight tracking-wide text-papel-50">
              Dúvida sobre algum documento?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-papel-200/85">
              Veja as respostas mais comuns ou escreva para a Secretaria. Toda mensagem gera um
              protocolo para acompanhar.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link
              href="/faq"
              className="inline-flex min-h-[48px] items-center border border-papel-100/40 px-6 text-xs font-bold uppercase tracking-[0.14em] text-papel-50 transition-colors hover:bg-papel-50 hover:text-tinta-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
            >
              Ver dúvidas frequentes
            </Link>
            <Link
              href="/contato"
              className="group inline-flex min-h-[48px] items-center gap-2 bg-accent-500 px-6 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
            >
              Escrever à Secretaria
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
