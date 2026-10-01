/**
 * As fontes padrão do PDFKit só desenham o conjunto WinAnsi. Tabulação colada
 * do Word ou um emoji fora dele não some: o PDFKit embaralha o resto da linha
 * em lixo ("1.•&VÆ—¦…"). Texto digitado pelo proponente passa por aqui antes
 * de ir para o PDF.
 */

// Faixa 0x80–0x9F do WinAnsi, onde o latin1 tem só caracteres de controle.
const WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'

function cabeNaFonte(caractere: string): boolean {
  const codigo = caractere.codePointAt(0) ?? 0
  return caractere === '\n'
    || (codigo >= 0x20 && codigo <= 0x7e)
    || (codigo >= 0xa0 && codigo <= 0xff)
    || WINANSI_EXTRA.includes(caractere)
}

export function textoParaPdf(texto: string): string {
  return Array.from(texto.replace(/\r\n?/g, '\n').replace(/\t/g, ' '))
    .filter(cabeNaFonte)
    .join('')
    .replace(/ {2,}/g, ' ')
    .replace(/ +$/gm, '')
}
