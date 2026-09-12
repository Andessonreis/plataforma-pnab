import { Manchete } from '@/app/(public)/noticias/manchete'
import { EntradaNoticia } from '@/app/(public)/noticias/entrada-noticia'
import type { NoticiaListada } from '@/app/(public)/noticias/consulta'
import { Button } from '@/components/ui'
import { Cartela } from '@/components/ui/cartela'

interface SecaoNoticiasProps {
  noticias: NoticiaListada[]
}

/**
 * Capa de jornal, não grade de cartões: a notícia mais recente vira manchete
 * (mesmo componente de `/noticias`) e as demais entram como coluna lateral —
 * a mesma hierarquia editorial da página cheia, só que em miniatura.
 * Sem notícia publicada ainda, some sozinha (mesmo critério de `SecaoDiaADia`).
 */
export function SecaoNoticias({ noticias }: SecaoNoticiasProps) {
  if (noticias.length === 0) return null

  const [destaque, ...demais] = noticias

  return (
    <section className="papel-textura relative overflow-hidden bg-papel-100 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Cartela cor="tinta">Fique por dentro</Cartela>

        <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[1.6fr_1fr]">
          <Manchete noticia={destaque} />

          <div className="flex flex-col lg:border-l lg:border-tinta-900/10 lg:pl-8">
            {demais.map((noticia) => (
              <EntradaNoticia key={noticia.id} noticia={noticia} />
            ))}

            <Button href="/noticias" variant="outline" className="mt-5 self-start">
              Ver todas as notícias
            </Button>
          </div>
        </div>
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-tinta-900" aria-hidden="true" />
    </section>
  )
}
