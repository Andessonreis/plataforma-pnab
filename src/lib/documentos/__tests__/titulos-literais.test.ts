import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

/**
 * Trava de literais de título.
 *
 * Hoje os títulos ainda estão escritos dentro dos geradores, das rotas e dos
 * services — `LITERAIS_PENDENTES` é a lista exata desses arquivos. A trava já
 * vale para tudo que for novo: arquivo fora da lista com literal de título
 * quebra o teste, e o nome do arquivo aparece na falha.
 *
 * `PADROES` é heurística de texto, não garantia: não pega título montado por
 * concatenação, valor lido de `NOME_DO_TIPO`, subtítulo escrito com aspas
 * diferentes nem nome novo que ninguém cadastrou aqui. Passar na trava não
 * dispensa a revisão do diff.
 *
 * Trilhas paralelas: cada uma remove de `LITERAIS_PENDENTES` **somente** as
 * linhas dos arquivos que ela mesma limpou e relê este arquivo depois de
 * salvar, para conferir que não sobrescreveu a remoção de outra trilha. Com a
 * lista vazia a trava fica estrita e nenhum título volta a ser escrito fora de
 * `titulos.ts`.
 */
const RAIZ = process.cwd()

const ALVOS = [
  'src/lib/pdf/lista-inscricoes',
  'src/lib/pdf/modelo',
  'src/lib/pdf/template-1',
  'src/lib/pdf/documento-oficial',
  'src/lib/documentos/descritores',
  'src/lib/pdf/lista-agentes.ts',
  'src/lib/pdf/lista-classificacao.ts',
  'src/lib/pdf/relatorio-final.ts',
  'src/lib/pdf/relatorio-recursos.ts',
  'src/lib/services/relatorio-recursos.service.ts',
  'src/lib/services/relatorio-inscricoes.service.ts',
  'src/lib/edital/notify-inscricao-encerrada.ts',
  'src/app/api/admin/agentes/export/route.ts',
  'src/app/api/admin/editais/[id]/listas/route.ts',
  'src/app/api/admin/editais/[id]/classificacao/route.ts',
  'src/app/api/admin/editais/[id]/relatorio-final/route.ts',
  'src/app/api/admin/editais/[id]/relatorio-recursos/route.ts',
  'src/app/api/admin/inscricoes/relatorio/enviar/route.ts',
]

// `lista-resultado.ts` é código morto (nenhuma rota o chama) e fica de fora até
// ser removido; varrer arquivo que ninguém pode limpar travaria a lista.
// Cada linha traz a trilha que a remove ao terminar.
const LITERAIS_PENDENTES = [
  'src/lib/pdf/lista-classificacao.ts',                       // T1b
  'src/lib/pdf/relatorio-final.ts',                           // T1b
  'src/lib/pdf/relatorio-recursos.ts',                        // T1b
  'src/lib/services/relatorio-recursos.service.ts',           // T3
  'src/app/api/admin/agentes/export/route.ts',                // T3
  'src/app/api/admin/editais/[id]/listas/route.ts',           // T3
  'src/app/api/admin/editais/[id]/classificacao/route.ts',    // T3
  'src/app/api/admin/editais/[id]/relatorio-final/route.ts',  // T3
]

const PADROES = [
  /Relação Definitiva de Habilitados/,
  /Relação de Inscritos/,
  /Relação de Inscrições/,
  /Relação de agentes culturais/,
  /Agentes Culturais Cadastrados/,
  /Classificação —/,
  /Classificação por Categoria/,
  /Relatório Final de Resultado/,
  /Relatório final —/,
  /Relatório final do edital/,
  /Relatório de Recursos Interpostos/,
  /Relatório de recursos( interpostos| —)/,
  /Resultado (Final|Preliminar)/,
  // Subtítulo "{edital} · {ano}" e identificação "{edital} ({ano})" montados à mão.
  /·\s*\$\{[^}]*ano\}/,
  /\(\$\{[^}]*ano[^}]*\}\)/,
]

function arquivosDe(alvo: string): string[] {
  const absoluto = path.join(RAIZ, alvo)
  if (!fs.existsSync(absoluto)) return []
  if (fs.statSync(absoluto).isFile()) return [alvo]

  return fs.readdirSync(absoluto, { withFileTypes: true }).flatMap((entrada) => {
    if (entrada.name === '__tests__') return []
    return arquivosDe(path.join(alvo, entrada.name))
  })
}

describe('trava de literais de título', () => {
  const comLiteral = ALVOS
    .flatMap(arquivosDe)
    .filter((arquivo) => arquivo.endsWith('.ts') || arquivo.endsWith('.tsx'))
    .filter((arquivo) => PADROES.some((padrao) => padrao.test(fs.readFileSync(path.join(RAIZ, arquivo), 'utf8'))))

  it('nenhum arquivo fora da lista de pendências escreve título de documento', () => {
    const novos = comLiteral.filter((arquivo) => !LITERAIS_PENDENTES.includes(arquivo))
    expect(novos).toEqual([])
  })

  it('a lista de pendências não guarda arquivo já limpo', () => {
    const resolvidos = LITERAIS_PENDENTES.filter((arquivo) => !comLiteral.includes(arquivo))
    expect(resolvidos).toEqual([])
  })
})
