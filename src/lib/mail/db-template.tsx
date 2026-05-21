import { render } from '@react-email/render'
import sanitizeHtml from 'sanitize-html'
import { prisma } from '@server/lib/db'
import { Layout } from './templates/_shared/layout'
import type { EmailTemplate } from './templates'

export interface ActiveOverride {
  subject: string
  body: string
}

// Busca override habilitado no banco. Erro/DB indisponível → null (cai no
// fallback do componente React Email, que é resiliente).
export async function findActiveOverride(
  key: EmailTemplate,
): Promise<ActiveOverride | null> {
  try {
    const row = await prisma.emailTemplateOverride.findUnique({
      where: { key },
      select: { subject: true, body: true, enabled: true },
    })
    if (!row?.enabled) return null
    return { subject: row.subject, body: row.body }
  } catch (err) {
    console.error('[mail] findActiveOverride falhou:', err)
    return null
  }
}

// Substitui `{{nome}}` etc. usando o objeto `data`. Valores undefined/null
// viram string vazia. Não escapa HTML — quem escapa é a sanitização depois.
export function substitutePlaceholders(
  template: string,
  data: Record<string, unknown>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = data[key]
    if (value === undefined || value === null) return ''
    return String(value)
  })
}

// Sanitização defensiva pra impedir XSS via body editado pelo admin.
// Permite tags básicas de formatação + links + inline styles (necessários
// pra customização visual em e-mail). Bloqueia script/iframe/form/etc.
//
// Usa `sanitize-html` (mesmo já adotado em `src/lib/sanitize`) em vez de
// `isomorphic-dompurify` — DOMPurify exigia ambiente browser e quebrava
// o `npm run build` do Next.js (tentava carregar /app/browser/default-stylesheet.css).
export function sanitizeBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'hr',
      'strong', 'em', 'b', 'i', 'u', 'span',
      'a', 'img',
      'h1', 'h2', 'h3', 'h4',
      'ul', 'ol', 'li',
      'blockquote', 'div',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      // Inline styles + class em qualquer tag — essenciais em e-mail.
      '*': ['style', 'class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    disallowedTagsMode: 'discard',
    // Defensivo extra: tags perigosas explicitamente removidas mesmo que
    // alguém burle `allowedTags`.
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
  })
}

export interface RenderedOverride {
  subject: string
  html: string
  text: string
}

export async function renderOverride(
  override: ActiveOverride,
  data: Record<string, unknown>,
): Promise<RenderedOverride> {
  const subject = substitutePlaceholders(override.subject, data)
  const substituted = substitutePlaceholders(override.body, data)
  const safeBody = sanitizeBody(substituted)

  const element = (
    <Layout preview={subject}>
      <div dangerouslySetInnerHTML={{ __html: safeBody }} />
    </Layout>
  )

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  return { subject, html, text }
}
