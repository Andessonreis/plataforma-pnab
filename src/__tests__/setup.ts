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
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    recurso: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    ticket: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    noticia: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    faqItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    cmsPage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projetoApoiado: {
      upsert: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      findRaw: vi.fn(),
      groupBy: vi.fn(),
    },
    newsletterSubscriber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    avaliacao: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    anexoInscricao: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown) => {
      if (typeof ops === 'function') return ops({ /* proxy prisma */ })
      return Promise.all(ops as Promise<unknown>[])
    }),
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

// Mock rate-limit
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
}))

// Mock rate-limit config
vi.mock('@/lib/rate-limit/config', () => ({
  RATE_LIMITS: {
    'auth/register': { window: 60, max: 5 },
    'auth/forgot-password': { window: 60, max: 3 },
    'auth/login': { window: 60, max: 10 },
    'contato': { window: 60, max: 5 },
    'newsletter': { window: 60, max: 5 },
  },
}))

// Mock storage
vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('https://storage.example.com/file.pdf'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  getSignedUrl: vi.fn().mockResolvedValue('https://storage.example.com/signed-url'),
}))

// Mock upload validation
vi.mock('@/lib/upload/validate', () => ({
  validateMagicBytes: vi.fn().mockReturnValue(true),
  sanitizeFilename: vi.fn((name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')),
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
}))

// Mock mail — preserva renderTemplate real para testes de template
vi.mock('@/lib/mail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mail')>()
  return {
    ...actual,
    sendEmail: vi.fn().mockResolvedValue(undefined),
  }
})

// Mock sanitize
vi.mock('@/lib/sanitize', () => ({
  sanitizeContent: vi.fn((html: string) => html),
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
