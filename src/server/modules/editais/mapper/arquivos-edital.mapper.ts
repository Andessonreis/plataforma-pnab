import type { ArquivoEdital } from '@prisma/client'
import type { ArquivoEditalDTO } from '@shared/dtos/arquivos-edital.dto'

export function toArquivoEditalDTO(arquivo: ArquivoEdital): ArquivoEditalDTO {
  return {
    id: arquivo.id,
    editalId: arquivo.editalId,
    tipo: arquivo.tipo,
    titulo: arquivo.titulo,
    url: arquivo.url,
    acessivel: arquivo.acessivel,
    createdAt: arquivo.createdAt.toISOString(),
  }
}
