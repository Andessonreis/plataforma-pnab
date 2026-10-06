import fs from 'fs'
import path from 'path'
import { prisma } from '../src/lib/db'
import { montarClassificacao } from '../src/lib/results/classificacao'
import { opcoesDaClassificacao } from '../src/lib/results/classificacao-opcoes'
import { resolverTemplateResultado } from '../src/lib/edital/template-resultado'
import { gerarListaClassificacaoV1 } from '../src/lib/pdf/template-1/lista-classificacao'
import type { CategoriaClassificacao } from '../src/lib/pdf/modelo/tipos'
import { TEXTO_ERRATA_0103 } from './gerar-pdf-resultado-final-mestres'

const EDITAL_ID = 'cms614ec20005og0ufjjyagr7' // Premiação para Mestres e Mestras de Irecê
const NOME_ARQUIVO = 'relacao-de-classificados_mestres-e-mestras-de-irece_v2_2026-10-01.pdf'

const DESTINOS = [
  '/home/andesson-reis/Documents',
  '/home/andesson-reis/Downloads',
  path.resolve('.omc/artifacts'),
]

/** Lê a classificação do banco apontado por DATABASE_URL e monta as categorias do PDF. */
async function montarCategorias(): Promise<{ edital: { titulo: string; ano: number }; categorias: CategoriaClassificacao[] }> {
  const edital = await prisma.edital.findUnique({
    where: { id: EDITAL_ID },
    select: {
      titulo: true, ano: true, vagasSuplentes: true, notaMinima: true, categoriasConfig: true,
      bonusVisivelParaAdmin: true, itensBonus: true, resultadoTemplate: true,
    },
  })
  if (!edital) throw new Error('Edital não encontrado')

  const { foraDaClassificacao } = resolverTemplateResultado(edital.resultadoTemplate)
  const classificadas = await montarClassificacao(EDITAL_ID, opcoesDaClassificacao(edital, false))

  const categorias = classificadas.map((c) => ({
    nome: c.nome,
    vagasAmplaConcorrencia: c.vagasAmplaConcorrencia,
    cotas: c.cotas.map((cota) => ({ key: cota.key, label: cota.label, vagas: cota.vagas })),
    valorPorProjeto: c.valorPorProjeto,
    linhas: c.linhas.map((l) => {
      const fora = foraDaClassificacao.includes(l.numero)
      return {
        posicao: l.posicao,
        numero: l.numero,
        proponente: l.proponenteNome,
        notaBase: l.notaBase,
        notaBonus: l.notaBonus,
        notaFinal: l.notaFinal,
        cotista: l.cotista,
        cotasOptIn: l.cotasOptIn,
        vaga: fora ? null : l.vaga,
        bonusItens: l.bonusItens,
        status: fora ? ('NAO_SE_APLICA' as const) : l.status,
        semAvaliacao: fora || l.semAvaliacao,
      }
    }),
  }))
  return { edital: { titulo: edital.titulo, ano: edital.ano }, categorias }
}

async function main() {
  const { edital, categorias } = await montarCategorias()
  const buffer = await gerarListaClassificacaoV1({
    edital,
    categorias,
    situacao: 'CONSOLIDADA',
    mostraBonus: false,
    geradoEm: new Date(),
    emissao: null,
    errata: TEXTO_ERRATA_0103,
    ocultarComoLer: true,
  })

  for (const dir of DESTINOS.filter((d) => fs.existsSync(d))) {
    const saida = path.join(dir, NOME_ARQUIVO)
    fs.writeFileSync(saida, buffer)
    console.log(`Salvo em: ${saida} (${buffer.length} bytes)`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
