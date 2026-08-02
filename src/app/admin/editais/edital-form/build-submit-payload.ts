import { generateFieldName } from '@/lib/utils/slug'
import { formItemsToCronograma } from '@/lib/utils/cronograma'
import type { CronogramaItem } from '@/types/cronograma'
import type { EditalFormContextValue } from './edital-form-context'

/** Normaliza o estado do formulário para o payload aceito por POST/PUT /api/admin/editais. */
export function buildEditalFormBody(form: EditalFormContextValue) {
  const cronogramaFiltrado: CronogramaItem[] = formItemsToCronograma(
    form.cronogramaItems.filter((item) => (item.tipo === 'fase' ? true : item.label?.trim())),
  )

  const valorTotalNum = form.valorTotal.trim() ? parseFloat(form.valorTotal) : null

  const camposFiltrados = form.camposFormulario
    .filter((c) => c.label.trim() !== '')
    .map((c) => ({ ...c, nome: c.nome.trim() || generateFieldName(c.label) }))

  const etapasNormalizadas = form.etapasCustomizadas
    .filter((e) => e.titulo.trim() !== '')
    .map((e, i) => ({
      ...e,
      ordem: i,
      id: e.id.trim() || `etapa_${i + 1}`,
      campos: e.campos
        .filter((c) => c.label.trim() !== '')
        .map((c) => ({ ...c, nome: c.nome.trim() || generateFieldName(c.label) })),
    }))

  return {
    titulo: form.titulo,
    resumo: form.resumo,
    ano: Number(form.ano),
    valorTotal: valorTotalNum,
    categorias: form.categorias,
    categoriasConfig: form.categoriasConfig.length > 0 ? form.categoriasConfig : null,
    regrasElegibilidade: form.regrasElegibilidade,
    acoesAfirmativas: form.acoesAfirmativas,
    status: form.status,
    cronograma: cronogramaFiltrado,
    camposFormulario: camposFiltrados,
    etapasCustomizadas: etapasNormalizadas,
    vagasContemplados: form.vagasContemplados.trim() ? Number(form.vagasContemplados) : null,
    vagasSuplentes: form.vagasSuplentes.trim() ? Number(form.vagasSuplentes) : null,
    criteriosAvaliacao: form.criteriosAvaliacao.length > 0 ? form.criteriosAvaliacao : null,
    formulaAvaliacao: form.formulaAvaliacao.trim() || null,
    tiposAnexo: form.tiposAnexo.length > 0 ? form.tiposAnexo : null,
    notaMinima: form.notaMinima.trim() ? Number(form.notaMinima) : null,
    tiposProponentePermitidos: form.tiposProponentePermitidos,
    equipeAvaliadores: form.avaliadoresSelecionados.map((a) => a.id),
    equipeHabilitadores: form.habilitadoresSelecionados.map((h) => h.id),
  }
}
