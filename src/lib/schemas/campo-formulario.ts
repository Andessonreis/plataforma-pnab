import { z } from 'zod'
import type { CampoFormulario } from '@/types/campo-formulario'

/**
 * Validação da definição de campos de um formulário dinâmico (o que o painel
 * salva), não das respostas — essas ficam em `@/lib/forms`.
 *
 * `arquivo` fica de fora de propósito: formulário público não tem fluxo de
 * upload, e um campo de arquivo obrigatório deixaria o formulário impossível
 * de enviar.
 */
export const TIPOS_CAMPO_SIMPLES = [
  'texto', 'text', 'textarea', 'select', 'multiselect',
  'numero', 'number', 'moeda', 'currency', 'data', 'date',
] as const

const TIPOS_CAMPO = [...TIPOS_CAMPO_SIMPLES, 'info', 'tabela', 'grupo_repetivel'] as const

const NOME_TECNICO = /^[a-z0-9_]+$/
const inteiroOpcional = z.number().int().min(0).max(1000).nullable().optional()

const subcampoSchema = z.object({
  nome: z.string().max(64),
  label: z.string().max(300),
  tipo: z.enum(TIPOS_CAMPO_SIMPLES, { errorMap: () => ({ message: 'Coluna ou subcampo aceita só tipos simples.' }) }),
  obrigatorio: z.boolean().optional(),
  placeholder: z.string().max(200).optional(),
  opcoes: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
  hint: z.string().max(500).optional(),
  minLength: inteiroOpcional,
  maxLength: z.number().int().min(1).max(20000).nullable().optional(),
})

const campoSchemaBase = subcampoSchema.extend({
  tipo: z.enum(TIPOS_CAMPO, { errorMap: () => ({ message: 'Tipo de campo inválido.' }) }),
  conteudo: z.string().max(10000).optional(),
  variante: z.enum(['info', 'atencao', 'alerta']).optional(),
  colunas: z.array(subcampoSchema).max(30).optional(),
  linhaMin: inteiroOpcional,
  linhaMax: inteiroOpcional,
  subcampos: z.array(subcampoSchema).max(30).optional(),
  labelItem: z.string().max(100).optional(),
  itemMin: inteiroOpcional,
  itemMax: inteiroOpcional,
})

type CampoValidado = z.infer<typeof campoSchemaBase>
type Contexto = z.RefinementCtx
type Caminho = (string | number)[]

function validarFolha(campo: Omit<CampoValidado, 'tipo'> & { tipo: string }, ctx: Contexto, caminho: Caminho) {
  const nome = campo.label || campo.nome || `campo ${Number(caminho.at(-1)) + 1}`
  if (!NOME_TECNICO.test(campo.nome)) {
    ctx.addIssue({ code: 'custom', path: [...caminho, 'nome'], message: `${nome}: nome técnico deve ter só letras minúsculas, números e "_".` })
  }
  if (!campo.label.trim()) {
    ctx.addIssue({ code: 'custom', path: [...caminho, 'label'], message: `Campo "${campo.nome}" está sem rótulo.` })
  }
  if ((campo.tipo === 'select' || campo.tipo === 'multiselect')) {
    const opcoes = campo.opcoes ?? []
    if (opcoes.length === 0) ctx.addIssue({ code: 'custom', path: [...caminho, 'opcoes'], message: `${nome}: informe ao menos uma opção.` })
    if (new Set(opcoes).size !== opcoes.length) ctx.addIssue({ code: 'custom', path: [...caminho, 'opcoes'], message: `${nome}: há opções repetidas.` })
  }
  if (campo.minLength != null && campo.maxLength != null && campo.minLength > campo.maxLength) {
    ctx.addIssue({ code: 'custom', path: [...caminho, 'minLength'], message: `${nome}: mínimo de caracteres maior que o máximo.` })
  }
}

function validarNomesUnicos(campos: { nome: string; tipo: string }[], ctx: Contexto, caminho: Caminho) {
  const vistos = new Set<string>()
  campos.forEach((c, i) => {
    if (c.tipo === 'info') return
    if (vistos.has(c.nome)) {
      ctx.addIssue({ code: 'custom', path: [...caminho, i, 'nome'], message: `Nome técnico "${c.nome}" repetido.` })
    }
    vistos.add(c.nome)
  })
}

function validarLista(
  campo: CampoValidado,
  filhos: CampoValidado['colunas'],
  limites: [number | null | undefined, number | null | undefined],
  chaveFilhos: 'colunas' | 'subcampos',
  ctx: Contexto,
  caminho: Caminho,
) {
  const nome = campo.label || campo.nome
  if (!filhos || filhos.length === 0) {
    ctx.addIssue({ code: 'custom', path: [...caminho, chaveFilhos], message: `${nome}: adicione ao menos uma coluna ou subcampo.` })
    return
  }
  filhos.forEach((f, i) => validarFolha(f, ctx, [...caminho, chaveFilhos, i]))
  validarNomesUnicos(filhos, ctx, [...caminho, chaveFilhos])
  const [min, max] = limites
  if (min != null && max != null && min > max) {
    ctx.addIssue({ code: 'custom', path: caminho, message: `${nome}: mínimo maior que o máximo.` })
  }
}

export const camposFormularioSchema = z
  .array(campoSchemaBase)
  .max(150, 'Formulário com campos demais (máximo 150).')
  .superRefine((campos, ctx) => {
    campos.forEach((campo, i) => {
      const caminho = [i]
      if (campo.tipo === 'info') {
        if (!campo.conteudo?.trim()) ctx.addIssue({ code: 'custom', path: [i, 'conteudo'], message: `Bloco informativo ${i + 1} está sem conteúdo.` })
        return
      }
      validarFolha(campo, ctx, caminho)
      if (campo.tipo === 'tabela') validarLista(campo, campo.colunas, [campo.linhaMin, campo.linhaMax], 'colunas', ctx, caminho)
      if (campo.tipo === 'grupo_repetivel') validarLista(campo, campo.subcampos, [campo.itemMin, campo.itemMax], 'subcampos', ctx, caminho)
    })
    validarNomesUnicos(campos, ctx, [])
  })
  .transform((campos) => campos as CampoFormulario[])
