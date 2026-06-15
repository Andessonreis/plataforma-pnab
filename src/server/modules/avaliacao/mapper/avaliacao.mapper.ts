import type { Prisma } from '@prisma/client'
import type { InscricaoStatus } from '@shared/enums/inscricao-status'
import type {
  AvaliacaoDetalheDTO,
  AvaliacaoDTO,
  AvaliacaoSalvaDTO,
} from '@shared/dtos/avaliacao.dto'
import type { AvaliacaoRow, AvaliacaoSalvaRow } from '../repository/avaliacao.repository'

function decimalToNumber(d: Prisma.Decimal | null): number | null {
  return d === null ? null : Number(d)
}

function toAvaliacao(a: AvaliacaoRow): AvaliacaoDTO {
  return {
    id: a.id,
    notas: a.notas,
    parecer: a.parecer,
    notaTotal: decimalToNumber(a.notaTotal),
    finalizada: a.finalizada,
    updatedAt: a.updatedAt.toISOString(),
  }
}

export function toAvaliacaoDetalhe(result: {
  avaliacao: AvaliacaoRow | null
  criterios: unknown[]
  inscricaoStatus: string
}): AvaliacaoDetalheDTO {
  return {
    avaliacao: result.avaliacao ? toAvaliacao(result.avaliacao) : null,
    criterios: result.criterios,
    inscricaoStatus: result.inscricaoStatus as InscricaoStatus,
  }
}

export function toAvaliacaoSalva(a: AvaliacaoSalvaRow): AvaliacaoSalvaDTO {
  return {
    id: a.id,
    notaTotal: decimalToNumber(a.notaTotal),
    finalizada: a.finalizada,
    updatedAt: a.updatedAt.toISOString(),
  }
}
