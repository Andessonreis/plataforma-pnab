import Image from 'next/image'
import { IconFileText } from '@/components/ui/icons'
import type { RelatorioItem } from './tipos'

interface DetalheProjetoProps {
  nome: string
  imagens: string[]
  relatorios: RelatorioItem[]
}

/**
 * Conteúdo do "ver mais" de um lançamento: galeria completa da execução e os
 * documentos de prestação de contas, quando o edital os disponibiliza.
 *
 * Fica de fora do lançamento em si porque a maioria dos registros não tem
 * nada aqui — só é chamado quando há mais de 4 imagens ou algum relatório,
 * então esta árvore não pesa nos projetos que não precisam dela.
 */
export function DetalheProjeto({ nome, imagens, relatorios }: DetalheProjetoProps) {
  return (
    <div className="mt-4 space-y-5 border-t border-tinta-900/10 pt-4">
      {imagens.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {imagens.map((url) => (
            <li key={url} className="relative h-24 w-32 overflow-hidden rounded-sm">
              <Image
                src={url}
                alt={`Registro da execução do projeto ${nome}`}
                fill
                sizes="128px"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      )}

      {relatorios.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-tinta-500">
            Documentos de prestação de contas
          </p>
          <ul className="space-y-1.5">
            {relatorios.map((relatorio) => (
              <li key={relatorio.url}>
                <a
                  href={relatorio.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                >
                  <IconFileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {relatorio.titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
