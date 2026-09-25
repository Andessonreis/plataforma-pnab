import { describe, it, expect } from 'vitest'
import { recursosDeTeste, relatorioRecursosDeTeste } from '@/lib/pdf/__tests__/apoio-pdf'
import type { RelatorioRecursosData } from '@/lib/pdf/modelo/tipos'
import { gerarRelatorioRecursosV1 } from '../relatorio-recursos'
import { EMISSAO, lerPdf, semEspacos } from './primitivas.fixtures'

/**
 * Gera o extrato de recursos da versão 1 de verdade, sem mock, e confere no
 * texto do PDF a coluna de protocolo e a conclusão, que mudam juntas quando o
 * protocolo é ocultado.
 */

async function textoDoRelatorio(parcial: Partial<RelatorioRecursosData> = {}): Promise<string> {
  const dados = relatorioRecursosDeTeste({ recursos: recursosDeTeste(2), emissao: EMISSAO, ...parcial })
  const { paginas } = await lerPdf(await gerarRelatorioRecursosV1(dados))
  return paginas.join('\n')
}

describe('coluna de protocolo', () => {
  it('por padrão traz a coluna e a data e hora de cada recurso', async () => {
    const texto = await textoDoRelatorio()

    expect(texto).toMatch(/Protocolado em/i)
    expect(texto).toContain('17/09/2026 10:00')
  })

  it('com ocultarProtocolo, tira a coluna e as datas, mas mantém os recursos', async () => {
    const texto = await textoDoRelatorio({ ocultarProtocolo: true })

    expect(texto).not.toMatch(/Protocolado em/i)
    expect(texto).not.toContain('17/09/2026 10:00')
    expect(texto).toContain('PNAB-2026-0001')
    expect(texto).toContain('PNAB-2026-0002')
  })
})

describe('conclusão', () => {
  it('com o protocolo à mostra, afirma que os recursos foram registrados no prazo', async () => {
    const texto = await textoDoRelatorio()

    expect(semEspacos(texto)).toContain(semEspacos('No prazo recursal previsto no cronograma'))
    expect(semEspacos(texto)).toContain(semEspacos('na etapa e no prazo indicados'))
  })

  it('com ocultarProtocolo, não afirma que foi no prazo: cita só o encerramento e a etapa', async () => {
    const texto = await textoDoRelatorio({ ocultarProtocolo: true })

    const compacto = semEspacos(texto)
    expect(compacto).not.toContain(semEspacos('No prazo recursal'))
    expect(compacto).toContain(semEspacos('Encerrado o prazo recursal previsto no cronograma'))
    expect(compacto).toContain(semEspacos('na etapa indicada'))
    expect(compacto).not.toContain(semEspacos('e no prazo indicados'))
  })
})
