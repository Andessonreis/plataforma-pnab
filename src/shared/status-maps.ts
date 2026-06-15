import type { InscricaoStatus, EditalStatus } from '@prisma/client'

export const inscricaoStatusLabel: Record<InscricaoStatus, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  HABILITADA: 'Habilitada',
  INABILITADA: 'Inabilitada',
  EM_AVALIACAO: 'Em Avaliação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RECURSO_ABERTO: 'Recurso Aberto',
  RESULTADO_FINAL: 'Resultado Final',
  CONTEMPLADA: 'Contemplada',
  NAO_CONTEMPLADA: 'Não Contemplada',
  SUPLENTE: 'Suplente',
}

// Ao gerar "Lista de Habilitados", inclui todos que passaram pela habilitação
// (mesmo que já estejam em fases posteriores como Contemplada).
// Status terminais (Inabilitada, Contemplada, etc.) usam correspondência exata.
export const cumulativeStatuses: Record<InscricaoStatus, InscricaoStatus[]> = {
  RASCUNHO: ['RASCUNHO'],
  ENVIADA: ['ENVIADA'],
  HABILITADA: ['HABILITADA', 'EM_AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
  INABILITADA: ['INABILITADA'],
  EM_AVALIACAO: ['EM_AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
  RESULTADO_PRELIMINAR: ['RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
  RECURSO_ABERTO: ['RECURSO_ABERTO'],
  RESULTADO_FINAL: ['RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
  CONTEMPLADA: ['CONTEMPLADA'],
  NAO_CONTEMPLADA: ['NAO_CONTEMPLADA'],
  SUPLENTE: ['SUPLENTE'],
}

export const editalStatusLabel: Record<EditalStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
  INSCRICOES_ABERTAS: 'Inscrições Abertas',
  INSCRICOES_ENCERRADAS: 'Inscrições Encerradas',
  HABILITACAO: 'Habilitação',
  AVALIACAO: 'Avaliação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RECURSO: 'Recurso',
  RESULTADO_FINAL: 'Resultado Final',
  ENCERRADO: 'Encerrado',
}

export const editalCronogramaLabel: Record<EditalStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicação do Edital',
  INSCRICOES_ABERTAS: 'Início das Inscrições',
  INSCRICOES_ENCERRADAS: 'Encerramento das Inscrições',
  HABILITACAO: 'Início da Habilitação',
  AVALIACAO: 'Início da Avaliação',
  RESULTADO_PRELIMINAR: 'Publicação do Resultado Preliminar',
  RECURSO: 'Início da Fase de Recursos',
  RESULTADO_FINAL: 'Publicação do Resultado Final',
  ENCERRADO: 'Encerramento do Edital',
}
