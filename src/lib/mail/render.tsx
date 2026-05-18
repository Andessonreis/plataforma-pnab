import { render } from '@react-email/render'
import { createElement, type ComponentType } from 'react'
import { findActiveOverride, renderOverride } from './db-template'
import { templateRegistry, type EmailTemplate } from './templates'

export interface RenderedEmail {
  /** Assunto resolvido (override > subject explícito > default do template). */
  subject: string
  html: string
  text: string
}

// Renderiza um template aplicando override do banco quando habilitado.
// Aceita dados como `Record<string, unknown>` no boundary (compatível com a
// fila); o cast pro shape tipado acontece dentro.
export async function renderTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>,
): Promise<RenderedEmail> {
  const override = await findActiveOverride(template)
  if (override) {
    return renderOverride(override, data)
  }

  const entry = templateRegistry[template]
  if (!entry) {
    throw new Error(`[mail] Template desconhecido: ${template}`)
  }

  const Component = entry.Component as unknown as ComponentType<Record<string, unknown>>
  const element = createElement(Component, data)

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  const subject = defaultSubjectFor(template, data)
  return { subject, html, text }
}

// Mantido como helper síncrono: retorna sempre o assunto padrão do código
// (ignora overrides). Útil quando você quer o assunto "canônico" sem hit no
// banco. Para enviar e-mails, prefira o `subject` retornado por `renderTemplate`.
export function defaultSubjectFor(
  template: EmailTemplate,
  data: Record<string, unknown>,
): string {
  const entry = templateRegistry[template]
  if (!entry) {
    throw new Error(`[mail] Template desconhecido: ${template}`)
  }
  const builder = entry.defaultSubject as unknown as (
    d: Record<string, unknown>,
  ) => string
  return builder(data)
}
