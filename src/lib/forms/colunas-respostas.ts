import type { CampoFormulario } from '@/types/campo-formulario'

export interface ColunaResposta {
  /** `nome` do campo, ou `tabela.coluna` para colunas de tabela/grupo. */
  chave: string
  rotulo: string
}

/**
 * Colunas-folha de um ou mais snapshots de campos, na ordem do primeiro
 * snapshot em que cada campo aparece. Respostas de versões diferentes do mesmo
 * formulário se alinham pelo `nome` do campo: pergunta removida numa versão
 * nova continua com coluna própria, vazia nas respostas que não a tiveram.
 */
export function colunasDosSnapshots(snapshots: CampoFormulario[][]): ColunaResposta[] {
  const colunas = new Map<string, string>()
  for (const campos of snapshots) {
    for (const campo of campos) {
      if (campo.tipo === 'info' || campo.tipo === 'arquivo' || !campo.nome) continue
      const filhos = campo.tipo === 'tabela' ? campo.colunas : campo.tipo === 'grupo_repetivel' ? campo.subcampos : null
      if (!filhos) {
        if (!colunas.has(campo.nome)) colunas.set(campo.nome, campo.label || campo.nome)
        continue
      }
      for (const filho of filhos) {
        const chave = `${campo.nome}.${filho.nome}`
        if (!colunas.has(chave)) colunas.set(chave, `${campo.label || campo.nome} — ${filho.label || filho.nome}`)
      }
    }
  }
  return [...colunas].map(([chave, rotulo]) => ({ chave, rotulo }))
}

function textoDoValor(valor: unknown): string {
  if (valor === undefined || valor === null) return ''
  if (Array.isArray(valor)) return valor.map(textoDoValor).filter(Boolean).join('; ')
  return String(valor)
}

/**
 * Valor de uma coluna numa resposta. Coluna de tabela junta as linhas com
 * " | ", na ordem em que foram preenchidas, para caber numa célula só.
 */
export function valorDaColuna(dados: Record<string, unknown>, chave: string): string {
  const [pai, filho] = chave.split('.')
  if (!filho) return textoDoValor(dados[pai])
  const linhas = dados[pai]
  if (!Array.isArray(linhas)) return ''
  return linhas
    .map((linha) => textoDoValor((linha as Record<string, unknown> | null)?.[filho]))
    .join(' | ')
}
