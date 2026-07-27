import { prisma } from '@/lib/db'

function generateProtocolo(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `PNAB-${year}-${code}`
}

/** Gera um protocolo de atendimento único, com retry em caso de colisão (improvável). */
export async function generateUniqueProtocolo(): Promise<string> {
  let protocolo = generateProtocolo()
  let exists = await prisma.atendimento.findUnique({ where: { protocolo } })
  let attempts = 0
  while (exists && attempts < 5) {
    protocolo = generateProtocolo()
    exists = await prisma.atendimento.findUnique({ where: { protocolo } })
    attempts++
  }
  return protocolo
}
