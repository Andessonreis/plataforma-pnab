import type { EditalStatus, InscricaoStatus } from '@prisma/client'

export const ABAS = {
  pendentes: {
    status: 'ENVIADA' as InscricaoStatus,
    label: 'Aguardando conferência',
  },
  habilitadas: {
    status: 'HABILITADA' as InscricaoStatus,
    label: 'Habilitadas / Aptas',
  },
  inabilitadas: {
    status: 'INABILITADA' as InscricaoStatus,
    label: 'Inabilitadas / Inaptas',
  },
} as const

export type AbaKey = keyof typeof ABAS

/** Editais que alcançaram (ou já passaram por) a fase de habilitação. */
export const EDITAL_STATUS_COM_HABILITACAO: EditalStatus[] = [
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

export const STATUS_HABILITACAO: InscricaoStatus[] = ['ENVIADA', 'HABILITADA', 'INABILITADA']
