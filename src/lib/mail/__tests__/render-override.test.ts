import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@server/lib/db'
import { renderTemplate } from '../render'

const mockPrisma = vi.mocked(prisma)

describe('renderTemplate — override do banco', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockPrisma.emailTemplateOverride.findUnique.mockReset()
  })

  it('sem override → usa componente React Email (fallback)', async () => {
    mockPrisma.emailTemplateOverride.findUnique.mockResolvedValue(null)

    const { subject, html } = await renderTemplate('protocolo_atendimento', {
      protocolo: 'PROT-1',
    })

    expect(subject).toContain('PROT-1')
    expect(html).toContain('PROT-1')
    // O componente React Email define este texto fixo no heading.
    expect(html).toContain('Atendimento registrado')
  })

  it('override desativado → também cai no fallback', async () => {
    mockPrisma.emailTemplateOverride.findUnique.mockResolvedValue({
      id: 'x',
      key: 'protocolo_atendimento',
      subject: 'Custom',
      body: '<p>Custom body</p>',
      enabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedById: null,
    } as never)

    const { html } = await renderTemplate('protocolo_atendimento', { protocolo: 'X' })
    expect(html).toContain('Atendimento registrado')
    expect(html).not.toContain('Custom body')
  })

  it('override ativo → renderiza body do banco com placeholders substituídos', async () => {
    mockPrisma.emailTemplateOverride.findUnique.mockResolvedValue({
      id: 'x',
      key: 'protocolo_atendimento',
      subject: 'Protocolo {{protocolo}} criado',
      body: '<p>Olá! Seu protocolo é <strong>{{protocolo}}</strong>.</p>',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedById: null,
    } as never)

    const { subject, html } = await renderTemplate('protocolo_atendimento', {
      protocolo: 'PROT-42',
    })

    expect(subject).toBe('Protocolo PROT-42 criado')
    expect(html).toContain('PROT-42')
    expect(html).toContain('Seu protocolo')
    expect(html).not.toContain('Atendimento registrado') // texto do componente padrão
    // Layout compartilhado (marca/brasão, footer) deve continuar aplicado
    expect(html).toContain('marca-100-anos-cultura.jpeg')
  })

  it('override ativo com script → sanitização remove', async () => {
    mockPrisma.emailTemplateOverride.findUnique.mockResolvedValue({
      id: 'x',
      key: 'protocolo_atendimento',
      subject: 'Subj',
      body: '<p>oi</p><script>alert(1)</script>',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedById: null,
    } as never)

    const { html } = await renderTemplate('protocolo_atendimento', { protocolo: 'X' })
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
    expect(html).toContain('<p>oi</p>')
  })

  it('falha do DB → cai pro fallback (não derruba envio)', async () => {
    mockPrisma.emailTemplateOverride.findUnique.mockRejectedValue(
      new Error('connection refused'),
    )

    const { html } = await renderTemplate('protocolo_atendimento', { protocolo: 'X' })
    expect(html).toContain('Atendimento registrado')
  })
})
