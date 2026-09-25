import { templateQuerySchema } from './template'

/** Texto do 400 das rotas de PDF quando `?template=` vem fora de 1 e 2. */
export const MENSAGEM_TEMPLATE_INVALIDO = 'Parâmetro "template" inválido. Use 1 ou 2.'

/**
 * Lê `?template=` da URL de uma rota de PDF. Ausente é válido — a rota cai na
 * preferência de quem emite —, e o resultado é o do `safeParse`: a rota
 * responde 400 com `MENSAGEM_TEMPLATE_INVALIDO` quando `success` é falso.
 */
export function templateDaUrl(url: string) {
  return templateQuerySchema.safeParse({ template: new URL(url).searchParams.get('template') ?? undefined })
}
