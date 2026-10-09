import type { ZodError } from 'zod'

/**
 * Agrupa os erros do schema de respostas pelo campo de primeiro nível. Erro de
 * uma célula de tabela (`equipe.2.nome`) fica no campo `equipe`, que é onde a
 * mensagem aparece na tela — só a primeira mensagem de cada campo é mantida.
 */
export function errosPorCampo(erro: ZodError): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const issue of erro.issues) {
    const campo = String(issue.path[0] ?? '')
    if (!campo || erros[campo]) continue
    const posicao = typeof issue.path[1] === 'number' ? ` (${issue.path[1] + 1}ª linha)` : ''
    erros[campo] = `${issue.message}${posicao}`
  }
  return erros
}
