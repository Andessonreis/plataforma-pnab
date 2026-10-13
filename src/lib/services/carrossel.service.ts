import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { CARROSSEL_PADRAO, carrosselSchema, type ConfigCarrossel } from '@/lib/schemas/carrossel'

const CHAVE = 'carrossel'

/**
 * O ritmo da abertura é decisão operacional: além da Comunicação, o ADMIN
 * também pode ajustá-lo (ex.: desligar a troca num dia de resultado).
 */
export const ROLES_CARROSSEL: UserRole[] = ['SUPER_ADMIN', 'COMUNICACAO', 'ADMIN']

/** Configuração da troca automática; linha ausente ou fora do schema cai no padrão. */
export async function obterCarrossel(): Promise<ConfigCarrossel> {
  const linha = await prisma.siteConfig.findUnique({ where: { chave: CHAVE } })
  const lido = carrosselSchema.safeParse(linha?.valor)
  return lido.success ? lido.data : CARROSSEL_PADRAO
}

export async function salvarCarrossel(valor: ConfigCarrossel, autor: { userId: string; ip?: string }) {
  await prisma.siteConfig.upsert({
    where: { chave: CHAVE },
    create: { chave: CHAVE, valor, atualizadoPor: autor.userId },
    update: { valor, atualizadoPor: autor.userId },
  })
  await logAudit({
    userId: autor.userId,
    action: 'CARROSSEL_CONFIGURADO',
    entity: 'SiteConfig',
    entityId: CHAVE,
    details: valor,
    ip: autor.ip,
  })
  return valor
}
