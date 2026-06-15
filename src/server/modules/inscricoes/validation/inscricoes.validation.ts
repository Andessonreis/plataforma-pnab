import { BadRequestError } from '@server/lib/http/errors'
import { resolveCharLimits } from '@shared/campo-limits'
import { filterCamposByTipo, type CampoFormulario } from '@/types/campo-formulario'
import type { InscricaoParaSubmit } from '../repository/inscricoes.repository'

export function validateSubmit(inscricao: InscricaoParaSubmit): void {
  validaCategoria(inscricao)

  const camposEsperados = resolveCamposEsperados(inscricao)
  const respostas = getRespostas(inscricao)

  validaCamposObrigatorios(camposEsperados, respostas)
  validaLimitesCaracteres(camposEsperados, respostas)
  validaAnexos(inscricao)
}

function getRespostas(inscricao: InscricaoParaSubmit): Record<string, unknown> {
  return (inscricao.campos as Record<string, unknown>) || {}
}

function resolveCamposEsperados(inscricao: InscricaoParaSubmit): CampoFormulario[] {
  const campos = (inscricao.edital.camposFormulario as unknown as CampoFormulario[]) || []
  const etapas = Array.isArray(inscricao.edital.etapasCustomizadas)
    ? (inscricao.edital.etapasCustomizadas as unknown as Array<{ campos: CampoFormulario[] }>)
    : []
  const camposDeEtapas = etapas.flatMap((e) => e.campos || [])
  return filterCamposByTipo([...campos, ...camposDeEtapas], inscricao.proponente.tipoProponente)
}

function validaCategoria(inscricao: InscricaoParaSubmit): void {
  if (inscricao.edital.categorias.length > 0 && !inscricao.categoria) {
    throw new BadRequestError('Selecione uma categoria antes de enviar.')
  }
}

function validaCamposObrigatorios(campos: CampoFormulario[], respostas: Record<string, unknown>): void {
  const faltando: string[] = []

  for (const campo of campos) {
    if (campo.tipo === 'info' || campo.tipo === 'arquivo') continue

    if (campo.tipo === 'tabela') {
      faltando.push(...validaTabela(campo, respostas))
      continue
    }
    if (campo.tipo === 'grupo_repetivel') {
      faltando.push(...validaGrupoRepetivel(campo, respostas))
      continue
    }

    if (campo.obrigatorio) {
      const valor = respostas[campo.nome]
      if (vazio(valor)) faltando.push(campo.label || campo.nome)
    }
  }

  if (faltando.length > 0) {
    throw new BadRequestError(`Campos obrigatórios não preenchidos: ${faltando.join(', ')}`)
  }
}

function validaTabela(campo: CampoFormulario, respostas: Record<string, unknown>): string[] {
  const erros: string[] = []
  const linhas = Array.isArray(respostas[campo.nome]) ? (respostas[campo.nome] as Record<string, unknown>[]) : []

  if (campo.obrigatorio && linhas.length === 0) return [campo.label || campo.nome]
  if ((campo.linhaMin ?? 0) > linhas.length) {
    return [`${campo.label || campo.nome} (mínimo ${campo.linhaMin} linhas)`]
  }

  linhas.forEach((linha, i) => {
    for (const col of campo.colunas ?? []) {
      if (col.obrigatorio && vazio(linha?.[col.nome])) {
        erros.push(`${campo.label || campo.nome} — linha ${i + 1}: ${col.label || col.nome}`)
      }
    }
  })
  return erros
}

function validaGrupoRepetivel(campo: CampoFormulario, respostas: Record<string, unknown>): string[] {
  const erros: string[] = []
  const itens = Array.isArray(respostas[campo.nome]) ? (respostas[campo.nome] as Record<string, unknown>[]) : []

  if (campo.obrigatorio && itens.length === 0) return [campo.label || campo.nome]
  if ((campo.itemMin ?? 0) > itens.length) {
    return [`${campo.label || campo.nome} (mínimo ${campo.itemMin} itens)`]
  }

  const labelItem = campo.labelItem || 'item'
  itens.forEach((item, i) => {
    for (const sub of campo.subcampos ?? []) {
      if (sub.obrigatorio && vazio(item?.[sub.nome])) {
        erros.push(`${campo.label || campo.nome} — ${labelItem} ${i + 1}: ${sub.label || sub.nome}`)
      }
    }
  })
  return erros
}

function validaLimitesCaracteres(campos: CampoFormulario[], respostas: Record<string, unknown>): void {
  const simples = campos.filter(
    (c) => c.tipo !== 'info' && c.tipo !== 'arquivo' && c.tipo !== 'tabela' && c.tipo !== 'grupo_repetivel',
  )

  const excedidos: string[] = []
  const curtos: string[] = []

  for (const campo of simples) {
    const valor = respostas[campo.nome]
    if (vazio(valor)) continue

    const limits = resolveCharLimits(campo)
    if (!limits) continue

    const texto = String(valor)
    if (texto.length > limits.maxLength) excedidos.push(`${campo.label || campo.nome} (máx. ${limits.maxLength})`)
    if (limits.minLength > 0 && texto.length < limits.minLength) {
      curtos.push(`${campo.label || campo.nome} (mín. ${limits.minLength})`)
    }
  }

  if (excedidos.length > 0) {
    throw new BadRequestError(`Campos excedem o limite de caracteres: ${excedidos.join(', ')}`)
  }
  if (curtos.length > 0) {
    throw new BadRequestError(`Campos abaixo do mínimo de caracteres: ${curtos.join(', ')}`)
  }
}

function validaAnexos(inscricao: InscricaoParaSubmit): void {
  if (inscricao.anexos.length === 0) {
    throw new BadRequestError('Envie pelo menos um anexo antes de submeter.')
  }
}

function vazio(valor: unknown): boolean {
  return valor === undefined || valor === null || valor === ''
}
