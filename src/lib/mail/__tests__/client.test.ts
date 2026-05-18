import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// NOTA: este arquivo testa `sendViaResend` direto do módulo `../client`, então
// o mock global `vi.mock('@/lib/mail', ...)` do `src/__tests__/setup.ts` (que
// stuba `sendEmail`) NÃO intercepta esses testes — a chamada nem passa pelo
// `src/lib/mail/index.ts`. O que importa aqui é o mock de `resend` definido
// localmente abaixo, que controla o que `new Resend(...).emails.send(...)`
// retorna por teste.
//
// `vi.hoisted` garante que `mockSend` exista quando o factory do `vi.mock` roda
// (vitest içar `vi.mock` para o topo do arquivo).
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('resend', () => {
  class MockResend {
    emails = { send: mockSend }
  }
  return { Resend: MockResend }
})

import { __resetResendClient, sendViaResend } from '../client'

describe('sendViaResend', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.EMAIL_FROM = 'Portal PNAB <noreply@example.com>'
    __resetResendClient()
    mockSend.mockReset()
    mockSend.mockResolvedValue({ data: { id: 'test-email-id' }, error: null })
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    __resetResendClient()
  })

  it('envia e-mail e retorna id', async () => {
    const result = await sendViaResend({
      to: 'destino@example.com',
      subject: 'Olá',
      html: '<p>oi</p>',
      text: 'oi',
    })
    expect(result).toEqual({ id: 'test-email-id' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'destino@example.com',
        subject: 'Olá',
        from: 'Portal PNAB <noreply@example.com>',
      }),
    )
  })

  it('lança quando Resend retorna error', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: 'rate_limit', message: 'Too many requests' },
    })
    await expect(
      sendViaResend({
        to: 'destino@example.com',
        subject: 'Olá',
        html: '<p>oi</p>',
        text: 'oi',
      }),
    ).rejects.toThrow(/rate_limit/)
  })

  it('lança quando RESEND_API_KEY ausente', async () => {
    delete process.env.RESEND_API_KEY
    __resetResendClient()
    await expect(
      sendViaResend({
        to: 'destino@example.com',
        subject: 'Olá',
        html: '<p>oi</p>',
        text: 'oi',
      }),
    ).rejects.toThrow(/RESEND_API_KEY/)
  })

  it('lança quando EMAIL_FROM ausente', async () => {
    delete process.env.EMAIL_FROM
    await expect(
      sendViaResend({
        to: 'destino@example.com',
        subject: 'Olá',
        html: '<p>oi</p>',
        text: 'oi',
      }),
    ).rejects.toThrow(/EMAIL_FROM/)
  })
})
