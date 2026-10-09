import { describe, it, expect, afterEach, vi } from 'vitest'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { gravarNaCaixaLocal, pastaCaixaLocal } from '../caixa-local'

afterEach(() => vi.unstubAllEnvs())

describe('caixa de saída local', () => {
  it('só vale fora de produção e com a pasta configurada', () => {
    vi.stubEnv('EMAIL_DEV_OUTBOX', '/tmp/caixa')
    vi.stubEnv('NODE_ENV', 'development')
    expect(pastaCaixaLocal()).toBe('/tmp/caixa')
    vi.stubEnv('NODE_ENV', 'production')
    expect(pastaCaixaLocal()).toBeNull()
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('EMAIL_DEV_OUTBOX', '')
    expect(pastaCaixaLocal()).toBeNull()
  })

  it('grava o html e um resumo com assunto e texto', async () => {
    const pasta = await mkdtemp(path.join(tmpdir(), 'caixa-'))
    const { id } = await gravarNaCaixaLocal(pasta, { to: 'a@b.c', subject: 'Assunto', html: '<p>oi</p>', text: 'oi' })
    expect((await readdir(pasta)).sort()).toEqual([`${id}.html`, `${id}.json`])
    expect(JSON.parse(await readFile(path.join(pasta, `${id}.json`), 'utf8'))).toMatchObject({ subject: 'Assunto', text: 'oi' })
    await rm(pasta, { recursive: true })
  })
})
