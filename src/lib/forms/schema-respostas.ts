import { z } from 'zod'
import { resolveCharLimits } from '@/lib/campo-limits'
import type { CampoFormulario } from '@/types/campo-formulario'

/**
 * Gera o schema Zod das respostas de um formulário dinâmico a partir da lista
 * de campos (`CampoFormulario[]`). É a mesma regra usada no navegador, antes do
 * envio, e no servidor, ao gravar — então quem responde vê exatamente o erro
 * que a API devolveria.
 *
 * Segue as regras do envio de inscrição (`/api/proponente/inscricoes/[id]/submit`):
 * vazio é `undefined`, `null` ou string em branco; limites de caracteres vêm de
 * `resolveCharLimits` (com os defaults por tipo); `arquivo` não é validado aqui,
 * porque o upload segue fluxo próprio. Chaves que não correspondem a campo
 * nenhum são descartadas.
 */
export function construirSchemaDeRespostas(campos: CampoFormulario[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const campo of campos) {
    if (campo.tipo === 'info' || campo.tipo === 'arquivo' || !campo.nome) continue
    shape[campo.nome] = schemaDoCampo(campo)
  }
  return z.object(shape)
}

export type RespostasFormulario = Record<string, unknown>

function rotulo(campo: CampoFormulario): string {
  return campo.label || campo.nome
}

function estaVazio(valor: unknown): boolean {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')
}

/** Campo opcional deixado em branco vira `undefined` e some do objeto gravado. */
function comVazio(campo: CampoFormulario, schema: z.ZodTypeAny): z.ZodTypeAny {
  const obrigatorio = z.preprocess(
    (v) => (estaVazio(v) ? undefined : v),
    z.unknown().refine((v) => v !== undefined, `${rotulo(campo)} é obrigatório.`).pipe(schema),
  )
  if (campo.obrigatorio) return obrigatorio
  return z.preprocess((v) => (estaVazio(v) ? undefined : v), schema.optional())
}

function schemaDoCampo(campo: CampoFormulario): z.ZodTypeAny {
  switch (campo.tipo) {
    case 'tabela':
      return schemaDeLista(campo, campo.colunas ?? [], campo.linhaMin, campo.linhaMax, 'linha')
    case 'grupo_repetivel':
      return schemaDeLista(campo, campo.subcampos ?? [], campo.itemMin, campo.itemMax, 'item')
    case 'multiselect':
      return schemaMultiselect(campo)
    default:
      return comVazio(campo, schemaSimples(campo))
  }
}

function schemaSimples(campo: CampoFormulario): z.ZodTypeAny {
  const nome = rotulo(campo)
  switch (campo.tipo) {
    case 'select': {
      const opcoes = campo.opcoes ?? []
      return z
        .string({ invalid_type_error: `${nome}: escolha uma das opções.` })
        .refine((v) => opcoes.includes(v), `${nome}: escolha uma das opções.`)
    }
    case 'numero':
    case 'number':
      return comLimites(campo, schemaNumerico(nome))
    case 'moeda':
    case 'currency':
      return schemaNumerico(nome)
    case 'data':
    case 'date':
      return z
        .string({ invalid_type_error: `${nome}: data inválida.` })
        .refine(ehDataIso, `${nome}: data inválida.`)
    default:
      return comLimites(campo, z.string({ invalid_type_error: `${nome}: valor inválido.` }))
  }
}

/** Número não negativo, vindo como string do input ou como number via API. */
function schemaNumerico(nome: string): z.ZodTypeAny {
  return z
    .union([z.string(), z.number()], { invalid_type_error: `${nome}: informe um número.` })
    .transform((v) => String(v).trim())
    .refine((v) => /^\d+(\.\d+)?$/.test(v), `${nome}: informe um número válido, sem sinal negativo.`)
}

function comLimites(campo: CampoFormulario, schema: z.ZodTypeAny): z.ZodTypeAny {
  const limites = resolveCharLimits(campo)
  if (!limites) return schema
  const nome = rotulo(campo)
  return schema
    .refine(
      (v) => String(v).length <= limites.maxLength,
      `${nome}: no máximo ${limites.maxLength} caracteres.`,
    )
    .refine(
      (v) => limites.minLength === 0 || String(v).length >= limites.minLength,
      `${nome}: no mínimo ${limites.minLength} caracteres.`,
    )
}

function ehDataIso(valor: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (!m) return false
  const data = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return data.getUTCFullYear() === Number(m[1]) && data.getUTCMonth() === Number(m[2]) - 1 && data.getUTCDate() === Number(m[3])
}

function schemaMultiselect(campo: CampoFormulario): z.ZodTypeAny {
  const nome = rotulo(campo)
  const opcoes = campo.opcoes ?? []
  const lista = z
    .array(z.string(), { invalid_type_error: `${nome}: seleção inválida.` })
    .refine((v) => !campo.obrigatorio || v.length > 0, `${nome}: selecione ao menos uma opção.`)
    .refine((v) => v.every((op) => opcoes.includes(op)), `${nome}: opção fora da lista.`)
    .refine((v) => new Set(v).size === v.length, `${nome}: opção repetida.`)
  return z.preprocess((v) => (estaVazio(v) ? [] : v), lista)
}

/**
 * Tabela e grupo repetível: lista de objetos, cada um validado pelas colunas
 * (ou subcampos). Campo obrigatório exige ao menos uma linha, mesmo sem `linhaMin`.
 */
function schemaDeLista(
  campo: CampoFormulario,
  filhos: CampoFormulario[],
  min: number | undefined,
  max: number | undefined,
  unidade: 'linha' | 'item',
): z.ZodTypeAny {
  const nome = rotulo(campo)
  const minimo = Math.max(min ?? 0, campo.obrigatorio ? 1 : 0)
  const plural = unidade === 'linha' ? 'linhas' : 'itens'
  let lista = z.array(construirSchemaDeRespostas(filhos), {
    invalid_type_error: `${nome}: formato inválido.`,
  })
  if (minimo > 0) {
    lista = lista.min(minimo, minimo === 1 ? `${nome}: adicione ao menos 1 ${unidade}.` : `${nome}: adicione ao menos ${minimo} ${plural}.`)
  }
  if (max !== undefined && max !== null) {
    lista = lista.max(max, `${nome}: no máximo ${max} ${max === 1 ? unidade : plural}.`)
  }
  return z.preprocess((v) => (estaVazio(v) ? [] : v), lista)
}
