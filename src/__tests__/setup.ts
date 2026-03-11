import { vi } from 'vitest'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    edital: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    inscricao: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock audit
vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    LOGIN: 'LOGIN',
    LOGIN_FALHA: 'LOGIN_FALHA',
    LOGOUT: 'LOGOUT',
    CADASTRO: 'CADASTRO',
    SENHA_RESET_SOLICITADO: 'SENHA_RESET_SOLICITADO',
    SENHA_RESET_CONCLUIDO: 'SENHA_RESET_CONCLUIDO',
    PERFIL_ATUALIZADO: 'PERFIL_ATUALIZADO',
    INSCRICAO_CRIADA: 'INSCRICAO_CRIADA',
    INSCRICAO_ENVIADA: 'INSCRICAO_ENVIADA',
    ANEXO_ENVIADO: 'ANEXO_ENVIADO',
    EDITAL_CRIADO: 'EDITAL_CRIADO',
    EDITAL_ATUALIZADO: 'EDITAL_ATUALIZADO',
    EDITAL_PUBLICADO: 'EDITAL_PUBLICADO',
    INSCRICAO_HABILITADA: 'INSCRICAO_HABILITADA',
    INSCRICAO_INABILITADA: 'INSCRICAO_INABILITADA',
    STATUS_ALTERADO: 'STATUS_ALTERADO',
    AVALIADOR_ATRIBUIDO: 'AVALIADOR_ATRIBUIDO',
    AVALIADOR_REMOVIDO: 'AVALIADOR_REMOVIDO',
    NOTICIA_CRIADA: 'NOTICIA_CRIADA',
    NOTICIA_ATUALIZADA: 'NOTICIA_ATUALIZADA',
    NOTICIA_EXCLUIDA: 'NOTICIA_EXCLUIDA',
    CMS_PAGINA_CRIADA: 'CMS_PAGINA_CRIADA',
    CMS_PAGINA_ATUALIZADA: 'CMS_PAGINA_ATUALIZADA',
    CMS_PAGINA_EXCLUIDA: 'CMS_PAGINA_EXCLUIDA',
    FAQ_CRIADO: 'FAQ_CRIADO',
    FAQ_ATUALIZADO: 'FAQ_ATUALIZADO',
    FAQ_EXCLUIDO: 'FAQ_EXCLUIDO',
    RESULTADO_CALCULADO: 'RESULTADO_CALCULADO',
    RESULTADO_PRELIMINAR_PUBLICADO: 'RESULTADO_PRELIMINAR_PUBLICADO',
    RESULTADO_FINAL_PUBLICADO: 'RESULTADO_FINAL_PUBLICADO',
    RECURSO_SUBMETIDO: 'RECURSO_SUBMETIDO',
    RECURSO_DECIDIDO: 'RECURSO_DECIDIDO',
    EXPORTACAO_CSV: 'EXPORTACAO_CSV',
    IMPORTACAO_CONTEMPLADOS: 'IMPORTACAO_CONTEMPLADOS',
  },
  ACTION_LABELS: {},
  actionBadgeVariant: vi.fn().mockReturnValue('neutral'),
  getRetentionDays: vi.fn().mockReturnValue(365),
  purgeOldAuditLogs: vi.fn().mockResolvedValue(0),
}))

// Mock queue
vi.mock('@/lib/queue', () => ({
  enqueueEmail: vi.fn().mockResolvedValue(undefined),
  emailQueue: { add: vi.fn() },
  pdfQueue: { add: vi.fn() },
  schedulerQueue: { add: vi.fn() },
}))

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: { duplicate: vi.fn().mockReturnValue({}) },
}))

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test' }),
    }),
  },
}))

// Mock BullMQ — Worker precisa ser construtor válido
vi.mock('bullmq', () => {
  class MockWorker {
    on = vi.fn()
    constructor() {}
  }
  class MockQueue {
    add = vi.fn()
    upsertJobScheduler = vi.fn()
    constructor() {}
  }
  return { Worker: MockWorker, Queue: MockQueue }
})
