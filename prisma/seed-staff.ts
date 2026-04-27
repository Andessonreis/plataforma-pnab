/**
 * Seed de Staff — Cria contas para a Secretaria de Arte e Cultura
 *
 * Cria/atualiza usuários internos (ADMIN, ATENDIMENTO, HABILITADOR, AVALIADOR)
 * para uso da equipe da Secretaria.
 *
 * Idempotente: usa upsert por cpfCnpj. Roda quantas vezes precisar.
 *
 * USO LOCAL:
 *   npx tsx prisma/seed-staff.ts
 *
 * USO EM PRODUÇÃO (dentro do container Docker):
 *   docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed-staff.ts
 */

import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Senha padrão para todas as contas staff. Cada usuário deve trocar no primeiro acesso.
const DEFAULT_PASSWORD = 'Teste@123'

interface StaffUser {
  email: string
  nome: string
  role: UserRole
  cpfCnpj: string
}

const staff: StaffUser[] = [
  {
    email: 'seculturismoirece@gmail.com',
    nome: 'Gestor — Secretaria de Arte e Cultura de Irecê',
    role: UserRole.ADMIN,
    cpfCnpj: '99999999901',
  },
  {
    email: 'atendimento@seculturismoirece.com.br',
    nome: 'Atendimento — Secretaria de Arte e Cultura',
    role: UserRole.ATENDIMENTO,
    cpfCnpj: '99999999902',
  },
  {
    email: 'habilitador@seculturismoirece.com.br',
    nome: 'Habilitador — Secretaria de Arte e Cultura',
    role: UserRole.HABILITADOR,
    cpfCnpj: '99999999903',
  },
  {
    email: 'avaliador@seculturismoirece.com.br',
    nome: 'Avaliador — Secretaria de Arte e Cultura',
    role: UserRole.AVALIADOR,
    cpfCnpj: '99999999904',
  },
]

async function main() {
  console.log('=== Seed Staff — Secretaria de Arte e Cultura de Irecê ===\n')

  const passwordHash = await hash(DEFAULT_PASSWORD, 12)

  for (const u of staff) {
    const result = await prisma.user.upsert({
      where: { cpfCnpj: u.cpfCnpj },
      update: {
        email: u.email,
        nome: u.nome,
        role: u.role,
        ativo: true,
      },
      create: {
        email: u.email,
        password: passwordHash,
        role: u.role,
        nome: u.nome,
        cpfCnpj: u.cpfCnpj,
        ativo: true,
      },
      select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    })

    const isNew = result.createdAt.getTime() === result.updatedAt.getTime()
    const tag = isNew ? '[CRIADO]' : '[ATUALIZADO]'
    console.log(`${tag.padEnd(15)} ${u.role.padEnd(12)} → ${u.email} (CPF: ${u.cpfCnpj})`)
  }

  console.log('\n=== Credenciais de Acesso ===')
  console.log('  Login: usar CPF formatado SEM pontos e traços')
  console.log(`  Senha padrão para TODAS as contas: ${DEFAULT_PASSWORD}`)
  console.log('  ⚠ Trocar a senha no primeiro acesso (cada usuário, individualmente)\n')

  console.log('  ADMIN          → CPF 999.999.999-01  → seculturismoirece@gmail.com')
  console.log('  ATENDIMENTO    → CPF 999.999.999-02  → atendimento@seculturismoirece.com.br')
  console.log('  HABILITADOR    → CPF 999.999.999-03  → habilitador@seculturismoirece.com.br')
  console.log('  AVALIADOR      → CPF 999.999.999-04  → avaliador@seculturismoirece.com.br')
  console.log('')
}

main()
  .catch((e) => {
    console.error('Erro no seed staff:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
