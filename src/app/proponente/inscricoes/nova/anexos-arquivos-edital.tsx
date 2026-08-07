'use client'

import { Badge } from '@/components/ui'
import { IconDownload, IconAccessible } from '@/components/ui/icons'
import { getBadgeVariantForTipo } from '@/lib/utils/badge-variant'

interface ArquivoEditalDownload {
  id: string
  tipo: string
  titulo: string
  url: string
  acessivel: boolean
}

interface AnexosArquivosEditalProps {
  arquivos: ArquivoEditalDownload[]
  tipoLabels?: Record<string, string>
}

// Lista de modelos e anexos do edital disponíveis para download antes do envio.
export function AnexosArquivosEdital({ arquivos, tipoLabels }: AnexosArquivosEditalProps) {
  if (arquivos.length === 0) return null

  return (
    <div className="mb-6 rounded-lg border border-brand-100 bg-brand-50 p-4">
      <div className="flex items-start gap-2 mb-3">
        <IconDownload className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            Arquivos do Edital para Download
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Baixe os modelos e anexos disponibilizados pela Secretaria. Preencha os modelos exigidos e envie o documento preenchido na seção abaixo.
          </p>
        </div>
      </div>
      <ul className="space-y-2" role="list">
        {arquivos.map((arquivo) => (
          <li key={arquivo.id}>
            <a
              href={arquivo.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50 transition-colors group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-brand-100 shrink-0 transition-colors">
                <IconDownload className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {arquivo.titulo}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant={getBadgeVariantForTipo(arquivo.tipo)} className="text-[10px]">
                    {tipoLabels?.[arquivo.tipo] ?? arquivo.tipo}
                  </Badge>
                  {arquivo.acessivel && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-700 font-medium">
                      <IconAccessible className="h-3 w-3" />
                      Acessível
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-brand-600 shrink-0 hidden sm:inline">
                Baixar
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
