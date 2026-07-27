import { describe, it, expect } from 'vitest'
import { alocarVagasCategoria, type CandidatoAlocacao } from '../alocar-cotas'
import type { CategoriaConfig } from '@/types/categoria-config'

function candidato(inscricaoId: string, notaFinal: number, cotasOptIn: string[] = []): CandidatoAlocacao {
  return { inscricaoId, notaFinal, totalAvaliacoes: notaFinal > 0 ? 1 : 0, cotasOptIn }
}

function config(overrides: Partial<CategoriaConfig> = {}): CategoriaConfig {
  return {
    nome: 'Teatro',
    vagasAmplaConcorrencia: 2,
    cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }],
    valorPorProjeto: 10000,
    valorTotalCategoria: 30000,
    ...overrides,
  }
}

describe('alocarVagasCategoria', () => {
  it('ampla simples: preenche pelos mais bem colocados, sem cotistas', () => {
    const candidatos = [
      candidato('a', 90),
      candidato('b', 80),
      candidato('c', 70),
    ]
    const r = alocarVagasCategoria(candidatos, config({ cotas: [] }), null, 0)
    expect(r.find((x) => x.inscricaoId === 'a')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'b')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'c')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('cota preenchida: cotista com nota mais baixa ocupa a vaga reservada', () => {
    const candidatos = [
      candidato('a', 90),           // ampla concorrência
      candidato('b', 85),           // ampla concorrência
      candidato('c', 80, ['negros']), // não entra na ampla (só 2 vagas), mas cota tem 1 vaga
      candidato('d', 70),
    ]
    const r = alocarVagasCategoria(candidatos, config(), null, 0)
    expect(r.find((x) => x.inscricaoId === 'a')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'b')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'c')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'd')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('concorrência concomitante: cotista com nota alta já cai na ampla, sem consumir a vaga de cota', () => {
    const candidatos = [
      candidato('a', 95, ['negros']), // melhor nota, cotista — ocupa ampla
      candidato('b', 90),
      candidato('c', 80, ['negros']), // ainda pode usar a vaga de cota
    ]
    const r = alocarVagasCategoria(candidatos, config())
    expect(r.find((x) => x.inscricaoId === 'a')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'b')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'c')?.status).toBe('CONTEMPLADA')
  })

  it('remanejamento: vaga de cota sem optantes aptos volta pra ampla concorrência', () => {
    const candidatos = [
      candidato('a', 90),
      candidato('b', 85),
      candidato('c', 80), // sem optar por cota nenhuma
      candidato('d', 70),
    ]
    // vagasAmplaConcorrencia=2 + cota negros=1 sem nenhum optante -> remaneja pra 'c'
    const r = alocarVagasCategoria(candidatos, config(), null, 0)
    expect(r.find((x) => x.inscricaoId === 'a')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'b')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'c')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'd')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('zero optantes de cota em categoria só com cota (sem ampla): tudo remanejado', () => {
    const candidatos = [candidato('a', 90), candidato('b', 80)]
    const r = alocarVagasCategoria(
      candidatos,
      config({ vagasAmplaConcorrencia: 0, cotas: [{ key: 'negros', label: 'x', vagas: 1 }] }),
      null,
      0,
    )
    expect(r.find((x) => x.inscricaoId === 'a')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'b')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('empate na fronteira: candidatos empatados nas duas últimas posições seguem a ordem recebida', () => {
    const candidatos = [
      candidato('a', 90),
      candidato('b', 80),
      candidato('c', 80), // empate com b, mas veio depois -> fica de fora
    ]
    const r = alocarVagasCategoria(candidatos, config({ cotas: [] }), null, 0)
    expect(r.find((x) => x.inscricaoId === 'a')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'b')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'c')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('categoria sem config discreta: nota > 0 é sempre CONTEMPLADA, sem corte', () => {
    const candidatos = [candidato('a', 10), candidato('b', 1), candidato('c', 0)]
    const r = alocarVagasCategoria(candidatos, config({ vagasAmplaConcorrencia: null, cotas: [] }))
    expect(r.find((x) => x.inscricaoId === 'a')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'b')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'c')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('nota abaixo do mínimo não ocupa vaga mesmo dentro do corte por posição', () => {
    const candidatos = [candidato('a', 90), candidato('b', 5)]
    const r = alocarVagasCategoria(candidatos, config({ cotas: [] }), 10)
    expect(r.find((x) => x.inscricaoId === 'a')?.status).toBe('CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'b')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('suplentes respeitam o teto de maxSuplentes', () => {
    const candidatos = [
      candidato('a', 90), candidato('b', 85), // ampla (2 vagas)
      candidato('c', 80), candidato('d', 70), candidato('e', 60),
    ]
    const r = alocarVagasCategoria(candidatos, config({ cotas: [] }), null, 1)
    expect(r.find((x) => x.inscricaoId === 'c')?.status).toBe('SUPLENTE')
    expect(r.find((x) => x.inscricaoId === 'd')?.status).toBe('NAO_CONTEMPLADA')
    expect(r.find((x) => x.inscricaoId === 'e')?.status).toBe('NAO_CONTEMPLADA')
  })

  it('suplentes sem teto (null): todos os elegíveis restantes viram suplentes', () => {
    const candidatos = [
      candidato('a', 90), candidato('b', 85),
      candidato('c', 80), candidato('d', 70),
    ]
    const r = alocarVagasCategoria(candidatos, config({ cotas: [] }), null, null)
    expect(r.find((x) => x.inscricaoId === 'c')?.status).toBe('SUPLENTE')
    expect(r.find((x) => x.inscricaoId === 'd')?.status).toBe('SUPLENTE')
  })

  it('posicaoCategoria reflete o índice dentro da categoria, 1-based', () => {
    const candidatos = [candidato('a', 90), candidato('b', 80), candidato('c', 70)]
    const r = alocarVagasCategoria(candidatos, config({ cotas: [] }))
    expect(r.map((x) => x.posicaoCategoria)).toEqual([1, 2, 3])
  })
})
