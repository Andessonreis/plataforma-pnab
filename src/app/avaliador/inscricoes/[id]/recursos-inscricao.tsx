import type { Prisma } from '@prisma/client'
import { Card, Badge } from '@/components/ui'
import { RecursoRespostaAvaliador } from '@/app/admin/inscricoes/[id]/recurso-resposta-avaliador'
import { RecursoAnexos } from '@/components/recurso/recurso-anexos'
import { SomenteLeitura } from '@/app/avaliador/somente-leitura'

/** Recurso com as respostas já filtradas para o avaliador dono da visão. */
export type RecursoComMinhaResposta = Prisma.RecursoGetPayload<{ include: { respostas: true } }>

interface Props {
  inscricaoId: string
  recursos: RecursoComMinhaResposta[]
  /** Modo espelho: mostra o formulário de resposta, mas travado. */
  somenteLeitura: boolean
}

/** Recursos da inscrição, com o formulário de resposta do avaliador designado. */
export function RecursosInscricao({ inscricaoId, recursos, somenteLeitura }: Props) {
  return (
    <Card>
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Recursos</h2>
      <div className="space-y-4">
        {recursos.map((recurso) => {
          const minha = recurso.respostas[0]
          return (
            <div key={recurso.id} className="p-3 sm:p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="info">{recurso.fase}</Badge>
                {recurso.decisao && (
                  <Badge variant={recurso.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                    {recurso.decisao}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-700 break-words whitespace-pre-wrap">{recurso.texto}</p>
              {recurso.urlAnexos.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Anexos do recurso</p>
                  <RecursoAnexos
                    urls={recurso.urlAnexos}
                    inscricaoId={inscricaoId}
                    recursoId={recurso.id}
                    scope="admin"
                  />
                </div>
              )}

              {recurso.decisao ? (
                <p className="text-xs text-slate-500 mt-3">
                  Recurso já decidido. Sua resposta foi registrada.
                </p>
              ) : (
                <div className="mt-3">
                  {minha && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-slate-500">Sua resposta</p>
                        <Badge variant={minha.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                          {minha.decisao}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 break-words whitespace-pre-wrap">{minha.justificativa}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Você pode revisar enquanto o recurso não for decidido.
                      </p>
                    </div>
                  )}
                  <SomenteLeitura ativo={somenteLeitura}>
                    <RecursoRespostaAvaliador
                      inscricaoId={inscricaoId}
                      recursoId={recurso.id}
                      fase={recurso.fase}
                      initialDecisao={(minha?.decisao as 'DEFERIDO' | 'INDEFERIDO' | undefined) ?? null}
                      initialJustificativa={minha?.justificativa ?? ''}
                    />
                  </SomenteLeitura>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
