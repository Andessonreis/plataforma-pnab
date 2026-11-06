import fs from 'fs'
import path from 'path'
import { gerarListaContemplados, type ContempladoLista } from '../src/lib/pdf/template-1/lista-contemplados'

/**
 * Uso: npx tsx scripts/gerar-pdf-contemplados-finais-festival.ts <contemplados.json> [pasta-de-saída]
 *
 * O JSON (categoria, numero, nome, cpfCnpj) sai de consulta de leitura ao banco de produção:
 * contemplados do resultado final, sem as desclassificações e com os suplentes convocados.
 */
const AVISO_LEGAL =
  'Relação consolidada a partir do Resultado Final do edital (Diário Oficial Ed. 2938), das desclassificações '
  + 'registradas na habilitação documental e das convocações de suplentes para vagas remanescentes publicadas '
  + 'pela Secretaria de Cultura e Turismo. Documentos de identificação publicados de forma parcial, conforme a LGPD.'

async function main() {
  const [entrada, pastaSaida = '.'] = process.argv.slice(2)
  if (!entrada) throw new Error('Informe o JSON de contemplados.')

  const contemplados: ContempladoLista[] = JSON.parse(fs.readFileSync(entrada, 'utf8'))
  const pdf = await gerarListaContemplados({
    titulo: 'Relação Final de Contemplados',
    editalTitulo: 'Festival de Arte e Cultura de Irecê — Centenário da Cidade',
    ano: '2026',
    contemplados,
    avisoLegal: AVISO_LEGAL,
  })

  const saida = path.join(pastaSaida, 'relacao-final-contemplados_festival-arte-cultura-irece-centenario-2026.pdf')
  fs.writeFileSync(saida, pdf)
  console.log(`PDF salvo em: ${saida} (${pdf.length} bytes, ${contemplados.length} contemplados)`)
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
