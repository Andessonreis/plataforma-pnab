import { prisma } from '@/lib/db'
import { parseTemplate, TEMPLATE_PADRAO, type TemplatePdf } from './template'
import type { TipoDocumento } from './titulos'

/**
 * Versão de layout que a tela de emissão deve abrir pré-selecionada.
 *
 * Quem está montando a publicação de um edital gera várias peças seguidas e
 * espera que todas saiam iguais: a preferência é, portanto, a última emissão
 * daquela pessoa naquele edital. Sem histórico no edital, vale a última de
 * qualquer edital; sem histórico nenhum, o padrão do sistema.
 */

/** Documentos que existem nas duas versões — os únicos que formam preferência. */
export const TIPOS_COM_TEMPLATE = [
  'LISTA_INSCRICOES',
  'LISTA_AGENTES',
  'CLASSIFICACAO',
  'RELATORIO_FINAL',
  'RELATORIO_RECURSOS',
] as const satisfies readonly TipoDocumento[]

async function ultimoTemplate(userId: string, editalId: string | null): Promise<TemplatePdf | null> {
  const registro = await prisma.documentoEmitido.findFirst({
    where: {
      emitidoPorId: userId,
      tipo: { in: [...TIPOS_COM_TEMPLATE] },
      ...(editalId ? { editalId } : {}),
    },
    orderBy: { emitidoEm: 'desc' },
    select: { template: true },
  })
  return registro ? parseTemplate(registro.template) : null
}

/**
 * Nunca lança: preferência é conveniência de UI, não pode derrubar a página nem
 * a rota que a consulta. Qualquer falha ou valor fora de 1/2 cai no padrão.
 */
export async function templatePreferido(userId: string, editalId: string | null): Promise<TemplatePdf> {
  try {
    const noEdital = editalId ? await ultimoTemplate(userId, editalId) : null
    if (noEdital) return noEdital

    return (await ultimoTemplate(userId, null)) ?? TEMPLATE_PADRAO
  } catch (err) {
    console.error({ escopo: 'templatePreferido', erro: err instanceof Error ? err.message : 'desconhecido' })
    return TEMPLATE_PADRAO
  }
}
