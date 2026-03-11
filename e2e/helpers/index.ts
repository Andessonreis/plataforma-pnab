import type { Page } from '@playwright/test'

export const CREDENTIALS = {
  ADMIN: { cpf: '00000000001', senha: 'Teste@123' },
  ATENDIMENTO: { cpf: '00000000002', senha: 'Teste@123' },
  HABILITADOR: { cpf: '00000000003', senha: 'Teste@123' },
  AVALIADOR: { cpf: '00000000004', senha: 'Teste@123' },
  PROPONENTE: { cpf: '12345678901', senha: 'Teste@123' },
} as const

export async function login(page: Page, cpf: string, senha: string) {
  await page.goto('/login')
  await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })
  await page.locator('#cpf-ou-cnpj').fill(cpf)
  await page.locator('#senha').fill(senha)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(admin|proponente)/, { timeout: 30000 })
  await page.waitForLoadState('load')
}
