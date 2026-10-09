import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

vi.mock('@/lib/rate-limit/config', () => ({ RATE_LIMITS: { 'memorial/agendamento': { window: 60, max: 3 } } }))

const solicitar = vi.fn()
const listar = vi.fn()
const disponibilidade = vi.fn()
const exportar = vi.fn()
vi.mock('@/lib/services/memorial-agendamento.service', () => ({
  solicitarVisita: (...a: unknown[]) => solicitar(...a),
  consultarDisponibilidade: (...a: unknown[]) => disponibilidade(...a),
}))
vi.mock('@/lib/services/memorial-agendamento-gestao.service', () => ({ listarVisitas: (...a: unknown[]) => listar(...a) }))
vi.mock('@/lib/memorial/config', () => ({ getConfig: async () => ({ maxPessoasPorGrupo: 20 }) }))
vi.mock('@/lib/services/memorial-agendamento-relatorio.service', () => ({ exportarVisitasCsv: (...a: unknown[]) => exportar(...a) }))

const { GET, POST } = await import('../route')
const { GET: GET_DISP } = await import('../disponibilidade/route')
const { GET: GET_CSV } = await import('../exportar/route')

const sessao = (role: string) => vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', role } } as never)
const req = (url: string, init?: RequestInit) => new NextRequest(`http://localhost:3000/api/v1/memorial/agendamentos${url}`, init as never)

const corpo = {
  data: '2026-10-15',
  turno: 'MANHA',
  horaInicio: '09:00',
  horaFim: '09:45',
  tipoVisitante: 'Grupo de Turistas',
  instituicao: 'Turma da Bahia',
  quantidade: 10,
  idadeMinima: 18,
  idadeMaxima: 59,
  responsavelNome: 'Ana Souza',
  responsavelEmail: 'ANA@example.com',
  responsavelTelefone: '74999990000',
  regulamentoVersao: 1,
  aceite: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(null as never)
  vi.mocked(rateLimit).mockResolvedValue(null)
})

describe('POST /api/v1/memorial/agendamentos', () => {
  it('pedido válido → 201 com protocolo, sem exigir login', async () => {
    solicitar.mockResolvedValue({ protocolo: 'MEM-2026-AAAAAA' })
    const res = await POST(req('', { method: 'POST', body: JSON.stringify(corpo) }))
    expect(res.status).toBe(201)
    expect((await res.json()).data.protocolo).toBe('MEM-2026-AAAAAA')
    expect(solicitar.mock.calls[0][0].responsavelEmail).toBe('ana@example.com')
    expect(solicitar.mock.calls[0][1].userId).toBeUndefined()
  })

  it('logado, o pedido fica ligado à conta', async () => {
    sessao('PROPONENTE')
    solicitar.mockResolvedValue({ protocolo: 'x' })
    await POST(req('', { method: 'POST', body: JSON.stringify(corpo) }))
    expect(solicitar.mock.calls[0][1].userId).toBe('u1')
  })

  it('sem aceite do regulamento → 400', async () => {
    const res = await POST(req('', { method: 'POST', body: JSON.stringify({ ...corpo, aceite: false }) }))
    expect(res.status).toBe(400)
    expect(solicitar).not.toHaveBeenCalled()
  })

  const enviar = (extra: Record<string, unknown>) => POST(req('', { method: 'POST', body: JSON.stringify({ ...corpo, ...extra }) }))
  const errosDe = async (res: Response) => (await res.json()).fieldErrors as Record<string, string>

  it('quantidade só inteira de 1 até o teto da configuração', async () => {
    for (const quantidade of [0, -3, 21, 2.5, 'abc', '']) {
      const res = await enviar({ quantidade })
      expect(res.status).toBe(400)
      expect(await errosDe(res)).toHaveProperty('quantidade')
    }
    expect((await errosDe(await enviar({ quantidade: 21 }))).quantidade).toBe('Cada agendamento atende até 20 pessoas.')
    solicitar.mockResolvedValue({ protocolo: 'x' })
    expect((await enviar({ quantidade: 20 })).status).toBe(201)
    expect(solicitar).toHaveBeenCalledTimes(1)
  })

  it('faixa etária vem de duas idades válidas e vira texto legível', async () => {
    expect((await errosDe(await enviar({ idadeMinima: 12, idadeMaxima: 8 })))).toHaveProperty('idadeMaxima')
    expect((await errosDe(await enviar({ idadeMinima: -1 })))).toHaveProperty('idadeMinima')
    expect((await errosDe(await enviar({ idadeMaxima: 130 })))).toHaveProperty('idadeMaxima')
    solicitar.mockResolvedValue({ protocolo: 'x' })
    await enviar({ idadeMinima: 6, idadeMaxima: 10 })
    expect(solicitar.mock.calls[0][0].faixaEtaria).toBe('Fundamental I (6 a 10 anos)')
    await enviar({ idadeMinima: 8, idadeMaxima: 12 })
    expect(solicitar.mock.calls[1][0].faixaEtaria).toBe('Entre 8 e 12 anos')
  })

  it('ano/turma só segue para escolas', async () => {
    solicitar.mockResolvedValue({ protocolo: 'x' })
    await enviar({ turma: '4º ano B' })
    expect(solicitar.mock.calls[0][0].turma).toBeUndefined()
    await enviar({ tipoVisitante: 'Unidade Escolar Municipal', turma: '4º ano B' })
    expect(solicitar.mock.calls[1][0].turma).toBe('4º ano B')
  })

  it('preferência de contato: e-mail por padrão e só opções conhecidas', async () => {
    solicitar.mockResolvedValue({ protocolo: 'x' })
    await enviar({})
    expect(solicitar.mock.calls[0][0].preferenciaContato).toBe('E-mail')
    expect((await enviar({ preferenciaContato: 'Tanto faz' })).status).toBe(400)
    await enviar({ preferenciaContato: 'E-mail e WhatsApp' })
    expect(solicitar.mock.calls[1][0].preferenciaContato).toBe('E-mail e WhatsApp')
  })

  it('rate limit barra antes de tudo', async () => {
    vi.mocked(rateLimit).mockResolvedValue(new Response(null, { status: 429 }) as never)
    const res = await POST(req('', { method: 'POST', body: JSON.stringify(corpo) }))
    expect(res.status).toBe(429)
  })
})

describe('rotas da equipe', () => {
  it('anônimo e proponente não listam visitas', async () => {
    expect((await GET(req(''))).status).toBe(403)
    sessao('PROPONENTE')
    expect((await GET(req(''))).status).toBe(403)
    sessao('ATENDIMENTO')
    expect((await GET(req(''))).status).toBe(403)
    expect(listar).not.toHaveBeenCalled()
  })

  it('Comunicação lista paginado com no máximo 50', async () => {
    sessao('COMUNICACAO')
    listar.mockResolvedValue({ itens: [], total: 0 })
    expect((await GET(req('?pageSize=51'))).status).toBe(400)
    const res = await GET(req('?pageSize=50&status=CONFIRMADO'))
    expect(res.status).toBe(200)
    expect((await res.json()).meta).toMatchObject({ pageSize: 50 })
  })

  it('CSV só para Comunicação e com cabeçalho de download', async () => {
    expect((await GET_CSV(req('/exportar'))).status).toBe(403)
    sessao('SUPER_ADMIN')
    exportar.mockResolvedValue('a,b')
    const res = await GET_CSV(req('/exportar?de=2026-10-01&ate=2026-10-31'))
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    expect(res.headers.get('Content-Disposition')).toContain('visitas_memorial_2026-10-01_2026-10-31.csv')
  })
})

describe('GET /disponibilidade', () => {
  it('exige mês ou intervalo válido', async () => {
    expect((await GET_DISP(req('/disponibilidade'))).status).toBe(400)
    expect((await GET_DISP(req('/disponibilidade?de=2026-10-01&ate=2027-01-30'))).status).toBe(400)
  })
  it('é pública e cacheável por pouco tempo', async () => {
    disponibilidade.mockResolvedValue({ dias: [] })
    const res = await GET_DISP(req('/disponibilidade?mes=2026-10'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=15')
  })
})
