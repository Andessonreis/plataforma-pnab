import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// O setup global (`src/__tests__/setup.ts`) stuba `sendEmail` com vi.fn().
// Aqui precisamos da implementação real (que aplica a allowlist), então
// desfazemos esse mock localmente — `vi.unmock` é içado igual `vi.mock`.
vi.unmock('@server/lib/mail')

// Mock local de `resend` pra inspecionar se `emails.send` foi chamado
// (precisamos garantir que skip pela allowlist NÃO chama o SDK).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('resend', () => {
  class MockResend {
    emails = { send: mockSend }
  }
  return { Resend: MockResend }
})

import { __resetResendClient } from '../client'
import { sendEmail, SKIPPED_EMAIL_ID } from '../index'

const baseOptions = {
  template: 'protocolo_atendimento' as const,
  data: { protocolo: 'PROT-1' },
}

describe('sendEmail — EMAIL_TEST_ALLOWLIST', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.EMAIL_FROM = 'Test <noreply@example.com>'
    __resetResendClient()
    mockSend.mockReset()
    mockSend.mockResolvedValue({ data: { id: 'real-send-id' }, error: null })
  })

  afterEach(() => {
    delete process.env.EMAIL_TEST_ALLOWLIST
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    __resetResendClient()
  })

  it('allowlist vazia → envia normalmente', async () => {
    const result = await sendEmail({ to: 'qualquer@example.com', ...baseOptions })
    expect(mockSend).toHaveBeenCalledOnce()
    expect(result).toEqual({ id: 'real-send-id' })
  })

  it('allowlist setada com destino dentro → envia', async () => {
    process.env.EMAIL_TEST_ALLOWLIST = 'teste777.65@gmail.com,loki10ms@gmail.com'
    const result = await sendEmail({ to: 'loki10ms@gmail.com', ...baseOptions })
    expect(mockSend).toHaveBeenCalledOnce()
    expect(result.id).toBe('real-send-id')
  })

  it('allowlist setada com destino fora → skip (não chama SDK)', async () => {
    process.env.EMAIL_TEST_ALLOWLIST = 'teste777.65@gmail.com'
    const result = await sendEmail({ to: 'outro@example.com', ...baseOptions })
    expect(mockSend).not.toHaveBeenCalled()
    expect(result).toEqual({ id: SKIPPED_EMAIL_ID, skipped: true })
  })

  it('match é case-insensitive', async () => {
    process.env.EMAIL_TEST_ALLOWLIST = 'Teste777.65@Gmail.com'
    const result = await sendEmail({ to: 'TESTE777.65@gmail.com', ...baseOptions })
    expect(mockSend).toHaveBeenCalledOnce()
    expect(result.id).toBe('real-send-id')
  })

  it('allowlist com espaços extras ao redor dos itens funciona', async () => {
    process.env.EMAIL_TEST_ALLOWLIST = '  teste777.65@gmail.com  ,  loki10ms@gmail.com  '
    const result = await sendEmail({ to: 'loki10ms@gmail.com', ...baseOptions })
    expect(mockSend).toHaveBeenCalledOnce()
    expect(result.id).toBe('real-send-id')
  })
})
