import { Badge } from '@client/components/ui'
import {
  IconDownload,
  IconAccessible,
  IconArrowRight,
} from '@client/components/ui/icons'
import { getBadgeVariantForTipo } from '@/lib/utils/badge-variant'
import type { editaisRepository } from '@server/modules/editais/repository/editais.repository'

type EditalWithRelations = NonNullable<
  Awaited<ReturnType<typeof editaisRepository.findBySlugWithRelations>>
>
type Arquivo = EditalWithRelations['arquivos'][number]

interface ArquivosDownloadProps {
  arquivos: Arquivo[]
  tipoLabels: Record<string, string>
}

export function ArquivosDownload({ arquivos, tipoLabels }: ArquivosDownloadProps) {
  return (
    <>
      {/* Layout cards para mobile */}
      <div className="sm:hidden space-y-3">
        {arquivos.map((arquivo) => (
          <a
            key={arquivo.id}
            href={arquivo.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 hover:border-brand-200 transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-brand-50 shrink-0 transition-colors">
              <IconDownload className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">
                {arquivo.titulo}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={getBadgeVariantForTipo(arquivo.tipo)} className="text-[10px]">
                  {tipoLabels[arquivo.tipo] ?? arquivo.tipo}
                </Badge>
                {arquivo.acessivel && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-700 font-medium">
                    <IconAccessible className="h-3 w-3" />
                    Acessível
                  </span>
                )}
              </div>
            </div>
            <IconArrowRight className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-brand-600 transition-colors" />
          </a>
        ))}
      </div>

      {/* Layout tabela para desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 pr-4 font-medium text-slate-600">
                Documento
              </th>
              <th className="text-left py-3 pr-4 font-medium text-slate-600">
                Tipo
              </th>
              <th className="text-left py-3 pr-4 font-medium text-slate-600">
                Acessível
              </th>
              <th className="text-right py-3 font-medium text-slate-600">
                Ação
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {arquivos.map((arquivo) => (
              <tr
                key={arquivo.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 pr-4 font-medium text-slate-900">
                  {arquivo.titulo}
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={getBadgeVariantForTipo(arquivo.tipo)}>
                    {tipoLabels[arquivo.tipo] ?? arquivo.tipo}
                  </Badge>
                </td>
                <td className="py-3 pr-4">
                  {arquivo.acessivel ? (
                    <span className="inline-flex items-center gap-1 text-brand-700">
                      <IconAccessible className="h-4 w-4" />
                      <span className="text-xs font-medium">Sim</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <a
                    href={arquivo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    download
                  >
                    <IconDownload className="h-4 w-4" />
                    Baixar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
