'use client'

import { ListaExposicoes } from '@/app/(public)/memorial/_componentes/lista-exposicoes'
import type { ValoresExposicao } from './exposicao-valores'

/**
 * O cartão da exposição exatamente como o site desenha, com o que está no formulário
 * agora. Inerte: clicar na prévia não sai da edição.
 */
export function PreviaExposicao({ valores }: { valores: ValoresExposicao }) {
  return (
    <section aria-labelledby="titulo-previa" className="rounded-xl border border-tinta-900/10 bg-papel-50 p-4 sm:p-6">
      <h2 id="titulo-previa" className="mb-4 text-sm font-bold text-tinta-800">
        Assim aparece na página do Memorial
      </h2>
      <div inert aria-hidden="true">
        <ListaExposicoes
          exposicoes={[
            {
              id: 'previa',
              slug: valores.slug || 'previa',
              titulo: valores.titulo || 'Título da exposição',
              subtitulo: valores.subtitulo || null,
              periodo: valores.periodo || null,
              localizacao: valores.localizacao || null,
              capaUrl: valores.capaUrl,
            },
          ]}
        />
      </div>
      {!valores.capaUrl && <p className="mt-3 text-sm font-semibold text-accent-900">Sem capa, o espaço da imagem fica vazio no site.</p>}
    </section>
  )
}
