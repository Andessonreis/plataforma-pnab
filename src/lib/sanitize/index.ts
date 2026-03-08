import sanitizeHtml from 'sanitize-html'

/**
 * Sanitiza conteúdo HTML de editores rich text.
 * Remove scripts, iframes, event handlers e tags perigosas.
 * Mantém formatação segura para conteúdo CMS.
 */
export function sanitizeContent(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      // Estrutura
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'div', 'span', 'br', 'hr',
      // Listas
      'ul', 'ol', 'li',
      // Texto
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
      'sub', 'sup', 'small', 'mark', 'abbr', 'cite',
      'blockquote', 'pre', 'code',
      // Links e mídia
      'a', 'img',
      // Tabelas
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      // Definição
      'dl', 'dt', 'dd',
      // Figuras
      'figure', 'figcaption',
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
      'th': ['colspan', 'rowspan', 'scope'],
      'td': ['colspan', 'rowspan'],
      'col': ['span'],
      'colgroup': ['span'],
      'abbr': ['title'],
      // Classes para estilização do Tailwind
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Força rel noopener em links com target
    transformTags: {
      'a': (tagName, attribs) => {
        if (attribs.target === '_blank') {
          attribs.rel = 'noopener noreferrer'
        }
        return { tagName, attribs }
      },
    },
    // Remove tudo que não está na whitelist (scripts, iframes, style, event handlers)
    disallowedTagsMode: 'discard',
  })
}
