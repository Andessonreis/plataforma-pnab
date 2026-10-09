import { describe, expect, it } from 'vitest'
import type { RelatorioVisitas } from '@/lib/memorial/agendamento/relatorio'
import { gerarRelatorioVisitasMemorial } from '../relatorio-visitas-memorial'
import { GERADO_EM, lerPdf, semEspacos } from './primitivas.fixtures'

const relatorio = (parcial: Partial<RelatorioVisitas> = {}): RelatorioVisitas => ({
  pedidos: 10, porStatus: { REALIZADO: 5, NAO_COMPARECEU: 1, CONFIRMADO: 2, RECUSADO: 2 },
  visitas: 7, visitantes: 140, realizadas: 5, visitantesRealizados: 100, cancelamentos: 0, recusas: 2,
  taxaComparecimento: 5 / 6,
  porTipoVisitante: [{ chave: 'Escola', visitas: 7, visitantes: 140 }],
  porFaixaEtaria: [{ chave: 'Não informada', visitas: 7, visitantes: 140 }],
  porHorario: [{ chave: '14:00', visitas: 3, visitantes: 60 }, { chave: '09:00', visitas: 4, visitantes: 80 }],
  ...parcial,
})

async function textoDoPdf(atual: RelatorioVisitas, anterior = relatorio({ visitantes: 100, pedidos: 0 })) {
  const pdf = await gerarRelatorioVisitasMemorial({
    de: '2026-10-01', ate: '2026-10-31', atual, anterior,
    periodoAnterior: { de: '2026-08-31', ate: '2026-09-30' }, geradoEm: GERADO_EM,
  })
  return semEspacos((await lerPdf(pdf)).paginas.join('\n'))
}

describe('relatório de visitas do Memorial em PDF', () => {
  it('traz o período, os números-chave e a comparação com o período anterior', async () => {
    const texto = await textoDoPdf(relatorio())
    expect(texto).toContain(semEspacos('01/10/2026 a 31/10/2026'))
    expect(texto).toContain(semEspacos('Comparado com'))
    expect(texto).toContain(semEspacos('40% a mais (antes: 100)'))
    expect(texto).toContain(semEspacos('Nada no período anterior'))
    expect(texto).toContain(semEspacos('Comparecimento: 83%'))
  })

  it('lista tipo de visitante, faixa etária e situação dos pedidos', async () => {
    const texto = await textoDoPdf(relatorio())
    for (const trecho of ['Escola', 'Não informada', 'Não compareceram', 'Recusadas', '09:00', '14:00']) {
      expect(texto).toContain(semEspacos(trecho))
    }
  })

  it('sai mesmo sem visitas na agenda', async () => {
    const vazio = relatorio({
      pedidos: 0, porStatus: {}, visitas: 0, visitantes: 0, realizadas: 0, visitantesRealizados: 0,
      taxaComparecimento: null, porTipoVisitante: [], porFaixaEtaria: [], porHorario: [],
    })
    const texto = await textoDoPdf(vazio, vazio)
    expect(texto).toContain(semEspacos('nenhuma visita encerrada'))
    expect(texto).toContain(semEspacos('Nenhuma visita na agenda neste período.'))
  })
})
