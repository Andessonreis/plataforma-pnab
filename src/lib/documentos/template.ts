import { z } from 'zod'

/**
 * Versão de layout dos PDFs de listas e relatórios.
 *
 * A 1 é o layout que o portal usava antes do redesenho; a 2 é o padrão do
 * Diário Oficial, com código e QR de verificação, e é o padrão do sistema. Quem
 * emite escolhe a versão na tela; a escolha viaja na query `?template=` e fica
 * registrada na emissão.
 *
 * Módulo folha de propósito: o seletor da barra de botões (client) e as rotas
 * (server) usam as mesmas funções, então aqui não entra Prisma nem PDFKit.
 */

export type TemplatePdf = 1 | 2

/** Versão usada quando ninguém escolheu nada — o padrão do sistema. */
export const TEMPLATE_PADRAO: TemplatePdf = 2

/** Como cada versão se chama para quem escolhe e para quem confere o documento. */
export const NOME_DO_TEMPLATE: Record<TemplatePdf, string> = {
  1: 'Versão 1 (layout anterior)',
  2: 'Versão 2 (padrão Diário Oficial, com QR)',
}

/**
 * Converte o que veio de fora (query, corpo, banco) em versão de layout.
 *
 * Regra única e estrita: só os números 1 e 2 e os textos "1" e "2". Nada de
 * conversão numérica frouxa — "01", " 1 ", "0x1" e "1.0" são entrada suspeita,
 * não versão de PDF, e viram null. Cabe a quem chamou decidir entre recusar a
 * requisição (400) e cair no padrão.
 */
export function parseTemplate(valor: unknown): TemplatePdf | null {
  if (valor === 1 || valor === '1') return 1
  if (valor === 2 || valor === '2') return 2
  return null
}

/**
 * Mesma regra do `parseTemplate` em forma de esquema: a query manda texto e o
 * corpo JSON manda número, mas o que vale é o valor, não o transporte.
 */
const valorDeTemplate = z
  .unknown()
  .refine((valor) => parseTemplate(valor) !== null, { message: 'Versão de PDF inválida' })
  .transform((valor) => parseTemplate(valor) as TemplatePdf)

/** `?template=1|2` na query. Ausente é válido: quem chama cai na preferência. */
export const templateSchema = valorDeTemplate

export const templateQuerySchema = z.object({
  template: templateSchema.optional(),
})

/** `template` no corpo JSON — mesmo esquema, nomeado para o lado de quem envia. */
export const templateBodySchema = valorDeTemplate

/**
 * Acrescenta (ou troca) o `template` de uma URL de download, preservando o
 * resto da query e o fragmento. Aceita URL relativa, que é o caso das rotas de
 * API montadas no client.
 */
export function comTemplate(url: string, template: TemplatePdf): string {
  const corteHash = url.indexOf('#')
  const hash = corteHash >= 0 ? url.slice(corteHash) : ''
  const semHash = corteHash >= 0 ? url.slice(0, corteHash) : url

  const corteQuery = semHash.indexOf('?')
  const caminho = corteQuery >= 0 ? semHash.slice(0, corteQuery) : semHash
  const params = new URLSearchParams(corteQuery >= 0 ? semHash.slice(corteQuery + 1) : '')

  params.set('template', String(template))
  return `${caminho}?${params.toString()}${hash}`
}
