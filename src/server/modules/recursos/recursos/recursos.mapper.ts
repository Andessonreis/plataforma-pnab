import type { Recurso } from '@prisma/client'
import type { RecursoDTO } from '@shared/dtos/recursos.dto'

export function toRecurso(r: Recurso): RecursoDTO {
  return {
    id: r.id,
    fase: r.fase,
    texto: r.texto,
    urlAnexos: r.urlAnexos,
    decisao: r.decisao,
    justificativa: r.justificativa,
    createdAt: r.createdAt.toISOString(),
    decidedAt: r.decidedAt?.toISOString() ?? null,
  }
}
