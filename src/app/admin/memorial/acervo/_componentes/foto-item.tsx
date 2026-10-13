'use client'

import { ImagemMemorial } from '@/components/memorial/imagem-memorial'
import { linkDiscreto } from '../../_ui'
import type { SecaoItemProps } from './item-valores'
import { AcervoTrocaImagem } from '../../_ui/acervo-troca-imagem'

/** Moldura que mostra a imagem inteira, sem cortar, sobre fundo de papel. */
function Moldura({ src, alt, proporcao }: { src: string; alt: string; proporcao: string }) {
  return (
    <div className={`relative ${proporcao} overflow-hidden rounded-xl bg-papel-200 ring-1 ring-tinta-900/10`}>
      <ImagemMemorial src={src} alt={alt} sizes="(min-width: 1024px) 40vw, 100vw" className="!object-contain" />
    </div>
  )
}

/**
 * Coluna da imagem: a foto grande, para a equipe reconhecer o que está descrevendo,
 * e logo abaixo a foto do mesmo lugar hoje, que liga a comparação "antes e hoje" no site.
 */
export function FotoItem({ valores, definir }: Pick<SecaoItemProps, 'valores' | 'definir'>) {
  const foto = valores.tipo === 'FOTOGRAFIA'
  const alt = valores.legenda || valores.titulo || 'Imagem do item'

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      {valores.arquivoUrl ? (
        <Moldura src={valores.arquivoUrl} alt={alt} proporcao="aspect-[4/3]" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-tinta-900/20 bg-white p-6 text-center text-sm text-tinta-600">
          {foto ? 'Esta fotografia ainda não tem arquivo. Envie a imagem digitalizada.' : 'Sem imagem. Envie uma foto ou digitalização, se houver.'}
        </div>
      )}
      <AcervoTrocaImagem pasta="acervo" rotulo={valores.arquivoUrl ? 'Trocar imagem' : 'Enviar imagem'} onEnviada={(url) => definir('arquivoUrl', url)} />

      {foto && (
        <div className="rounded-xl border border-tinta-900/10 bg-white p-3">
          <h3 className="text-sm font-bold text-tinta-900">O mesmo lugar hoje</h3>
          <p className="mt-0.5 text-xs text-tinta-600">Opcional. Com ela, o site mostra a comparação entre antes e hoje.</p>
          {valores.fotoAtualUrl && (
            <div className="mt-3 max-w-[16rem]">
              <Moldura src={valores.fotoAtualUrl} alt={`${alt}, nos dias de hoje`} proporcao="aspect-[4/3]" />
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <AcervoTrocaImagem pasta="acervo" rotulo={valores.fotoAtualUrl ? 'Trocar foto de hoje' : 'Enviar foto de hoje'} onEnviada={(url) => definir('fotoAtualUrl', url)} />
            {valores.fotoAtualUrl && (
              <button type="button" className={`${linkDiscreto} min-h-[44px]`} onClick={() => definir('fotoAtualUrl', null)}>
                Tirar foto de hoje
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
