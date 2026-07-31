import { Cartela } from '@/components/ui/cartela'
import { IconAccessible, IconDownload } from '@/components/ui/icons'
import { IconeEdital } from '@/components/ui/ornamentos/icones'

export interface ArquivoEdital {
  id: string
  titulo: string
  url: string
  tipo: string
  tipoLabel: string
  acessivel: boolean
}

interface AnexosEditalProps {
  arquivos: ArquivoEdital[]
}

/**
 * Anexos do edital em uma lista só.
 *
 * A página trazia duas árvores para os mesmos arquivos: cartões no celular e
 * uma tabela no desktop, com cada campo escrito duas vezes. Além do custo de
 * manutenção, as duas divergiam — a tabela mostrava o tipo do anexo, o cartão
 * não. Aqui é uma estrutura só, que empilha no telefone.
 *
 * A marca de versão acessível fica junto do arquivo, e não numa coluna à
 * parte: é uma qualidade daquele documento, não uma categoria de listagem.
 */
export function AnexosEdital({ arquivos }: AnexosEditalProps) {
  if (arquivos.length === 0) return null

  return (
    <section>
      <Cartela id="anexos" cor="ameixa">Documentos do edital</Cartela>

      <ul className="mt-6 divide-y divide-tinta-900/15 border-y border-tinta-900/15">
        {arquivos.map((arquivo) => (
          <li key={arquivo.id}>
            <a
              href={arquivo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 py-4 transition-colors hover:bg-papel-100/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500"
            >
              <IconeEdital className="h-8 w-8 shrink-0 text-brand-700" aria-hidden="true" />

              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-tinta-900 transition-colors group-hover:text-brand-700">
                  {arquivo.titulo}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs uppercase tracking-[0.14em] text-tinta-500">
                  {arquivo.tipoLabel}
                  {arquivo.acessivel && (
                    <span className="inline-flex items-center gap-1 text-turquesa-700">
                      <IconAccessible className="h-3.5 w-3.5" aria-hidden="true" />
                      Versão acessível
                    </span>
                  )}
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                <IconDownload className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Baixar</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
