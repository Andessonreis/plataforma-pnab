import { Card, Badge } from '@client/components/ui'
import { IconCheck, IconDocument, IconDownload, IconAccessible } from '@client/components/ui/icons'
import { getBadgeVariantForTipo } from '@/lib/utils/badge-variant'
import { AnexoUpload } from '../AnexoUpload'
import type { Anexo, ArquivoEditalDownload, TipoAnexoEdital } from '../types'

export function EtapaAnexos({
  arquivos,
  tipoLabels,
  effectiveTiposAnexo,
  tiposAnexoEdital,
  anexos,
  onUpload,
  uploading,
  onDeleteAnexo,
}: {
  arquivos?: ArquivoEditalDownload[]
  tipoLabels?: Record<string, string>
  effectiveTiposAnexo: TipoAnexoEdital[]
  tiposAnexoEdital?: TipoAnexoEdital[] | null
  anexos: Anexo[]
  onUpload: (file: File, tipo: string, titulo: string) => Promise<boolean>
  uploading: boolean
  onDeleteAnexo: (anexoId: string) => void
}) {
  const tiposObrigatorios = effectiveTiposAnexo.filter((t) => t.obrigatorio)
  const totalObrigatorios = tiposObrigatorios.length
  const obrigatoriosEnviados = tiposObrigatorios.filter((t) =>
    anexos.some((a) => a.tipo === t.tipo),
  ).length
  const allObrigatoriosOk = obrigatoriosEnviados === totalObrigatorios

  // Conta quantos arquivos por tipo
  const countByTipo = anexos.reduce<Record<string, number>>((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] ?? 0) + 1
    return acc
  }, {})

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Documentos e Anexos</h2>
      <p className="text-sm text-slate-500 mb-6">
        Envie os documentos necessários para sua inscrição. Formatos aceitos: PDF, PNG, JPEG (máx. 10MB cada).
        <span className="block mt-1">Você pode enviar <strong>mais de um arquivo</strong> por item se precisar.</span>
      </p>

      {/* Arquivos do edital para download (modelos, planilhas, declarações etc.) */}
      {arquivos && arquivos.length > 0 && (
        <div className="mb-6 rounded-lg border border-brand-100 bg-brand-50/40 p-4">
          <div className="flex items-start gap-2 mb-3">
            <IconDownload className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800">
                Arquivos do Edital para Download
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
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
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50 transition-colors group min-h-[44px]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 group-hover:bg-brand-100 shrink-0 transition-colors">
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
      )}

      {/* Checklist de documentos esperados */}
      {effectiveTiposAnexo.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-800">
              Documentos necessários
            </h3>
            {totalObrigatorios > 0 && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  allObrigatoriosOk
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
                aria-live="polite"
              >
                {obrigatoriosEnviados}/{totalObrigatorios} obrigatórios enviados
              </span>
            )}
          </div>
          <ul className="space-y-2" role="list">
            {effectiveTiposAnexo.map((t) => {
              const qtd = countByTipo[t.tipo] ?? 0
              const enviado = qtd > 0
              return (
                <li key={t.tipo} className="flex items-start gap-2 text-sm">
                  {enviado ? (
                    <IconCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <span
                      className="h-4 w-4 rounded-full border border-slate-300 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={enviado ? 'text-slate-900' : 'text-slate-700'}>
                        {t.label}
                      </span>
                      {t.obrigatorio ? (
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-red-600">
                          obrigatório
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wide font-medium text-slate-400">
                          opcional
                        </span>
                      )}
                      {enviado && (
                        <span className="text-[11px] font-medium text-green-700">
                          {qtd === 1 ? '1 arquivo' : `${qtd} arquivos`}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Upload */}
      <AnexoUpload onUpload={onUpload} uploading={uploading} tiposAnexoEdital={tiposAnexoEdital} />

      {/* Lista de anexos */}
      {anexos.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-slate-700">
            Anexos enviados ({anexos.length})
          </h3>
          {anexos.map((anexo) => (
            <div
              key={anexo.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconDocument className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{anexo.titulo}</p>
                  <p className="text-xs text-slate-500">{anexo.tipo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteAnexo(anexo.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0 ml-3 min-h-[44px] px-2"
                aria-label={`Remover ${anexo.titulo}`}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
