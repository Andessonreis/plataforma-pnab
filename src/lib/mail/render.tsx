import { render } from '@react-email/render'
import { createElement, type ComponentType } from 'react'
import { templateRegistry, type EmailTemplate } from './templates'

export interface RenderedEmail {
  html: string
  text: string
}

// Aceita dados como `Record<string, unknown>` no boundary (compatível com a fila),
// mas internamente cada componente recebe o shape tipado — cast via `unknown`
// porque o registro é um union de templates com props distintas.
export async function renderTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>,
): Promise<RenderedEmail> {
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

  return { html, text }
}

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
