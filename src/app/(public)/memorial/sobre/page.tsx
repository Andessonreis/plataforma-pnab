import type { Metadata } from 'next'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { getConfig } from '@/lib/memorial/config'
import { renderMarkdown } from '@/lib/utils/markdown'
import { BlocoContato } from '@/components/memorial/bloco-contato'
import { abertura } from '../_componentes/consultas'
import { FaixaVisite } from '@/components/memorial/faixa-visite'

export const metadata: Metadata = {
  title: 'Sobre o Memorial',
  description: 'O que é o Memorial de Irecê, como visitar e como falar com a equipe.',
}

export default async function SobrePage() {
  const [institucional, contato, visitacao, capa] = await Promise.all([
    getConfig('institucional'),
    getConfig('contato'),
    getConfig('visitacao'),
    abertura(),
  ])

  return (
    <>
      <FolhaDeRosto
        fotos={capa.fotos}
        trilha="Sobre o Memorial"
        chamada={institucional.titulo}
        titulo="Sobre o Memorial"
        apoio={institucional.chamada}
      />
      {institucional.texto && (
        <section aria-label="Apresentação do Memorial" className="papel-textura bg-papel-50 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-lg leading-relaxed text-tinta-800 sm:px-6 [&_p]:mt-5 first:[&_p]:mt-0">
            {renderMarkdown(institucional.texto)}
          </div>
        </section>
      )}
      <FaixaVisite visitacao={visitacao} contato={contato} />
      <BlocoContato contato={contato} />
    </>
  )
}
