import { PrismaClient } from '@prisma/client'
import { seedHabilitacao } from './seeds/habilitacao/seed-habilitacao'

const prisma = new PrismaClient()

seedHabilitacao(prisma)
  .catch((e) => {
    console.error('Erro ao executar seed de habilitação:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
