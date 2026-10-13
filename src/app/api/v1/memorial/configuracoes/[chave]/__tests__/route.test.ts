import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { CONFIG_PADRAO } from '@/lib/memorial/config'

const salvar = vi.fn()
vi.mock('@/lib/services/memorial-config.service', async () => {
  const { validarValorConfig } = await import('@/lib/schemas/memorial-config')
  return {
    atualizarConfiguracao: (chave: 'visitacao', valor: unknown) => {
      const validado = validarValorConfig(chave, valor)
      salvar(chave, validado)
      return validado
    },
  }
})

const { PUT } = await import('../route')

const params = { params: Promise.resolve({ chave: 'visitacao' }) }
const sessao = (role: string | null) =>
  vi.mocked(auth).mockResolvedValue((role ? { user: { id: 'u1', role } } : null) as never)
const put = (valor: unknown) =>
  PUT(new NextRequest('http://localhost/api/v1/memorial/configuracoes/visitacao', { method: 'PUT', body: JSON.stringify(valor) }), params)

const visitacao = CONFIG_PADRAO.visitacao

beforeEach(() => vi.clearAllMocks())

describe('PUT /api/v1/memorial/configuracoes/visitacao', () => {
  it('ADMIN, COMUNICACAO e SUPER_ADMIN salvam a grade', async () => {
    for (const role of ['ADMIN', 'COMUNICACAO', 'SUPER_ADMIN']) {
      sessao(role)
      expect((await put(visitacao)).status).toBe(200)
    }
    expect(salvar).toHaveBeenCalledTimes(3)
  })

  it('anônimo e proponente não salvam', async () => {
    sessao(null)
    expect((await put(visitacao)).status).toBe(403)
    sessao('PROPONENTE')
    expect((await put(visitacao)).status).toBe(403)
    expect(salvar).not.toHaveBeenCalled()
  })

  it('recusa horário que termina antes de começar e horários sobrepostos', async () => {
    sessao('COMUNICACAO')
    const invertido = await put({ ...visitacao, horarios: { ...visitacao.horarios, MANHA: [{ inicio: '10:00', fim: '09:00' }] } })
    expect(invertido.status).toBe(400)
    expect((await invertido.json()).fieldErrors['horarios.MANHA']).toContain('terminar depois de começar')

    const sobreposto = await put({
      ...visitacao,
      horarios: { MANHA: [{ inicio: '09:00', fim: '10:00' }, { inicio: '09:30', fim: '10:15' }], TARDE: [] },
    })
    expect((await sobreposto.json()).fieldErrors['horarios.MANHA']).toContain('se sobrepõe')
    expect(salvar).not.toHaveBeenCalled()
  })

  it('exige pelo menos um horário, mas aceita um turno fechado', async () => {
    sessao('ADMIN')
    expect((await put({ ...visitacao, horarios: { MANHA: [], TARDE: [] } })).status).toBe(400)
    expect((await put({ ...visitacao, horarios: { ...visitacao.horarios, TARDE: [] } })).status).toBe(200)
  })
})
