import { Worker } from 'bullmq'
import { redis } from '@/lib/redis'
import type { PdfJobData } from '@/lib/queue'

export const pdfWorker = new Worker<PdfJobData>(
  'pdf',
  async (job) => {
    const { tipo, inscricaoId, editalId } = job.data

    console.log(`[PdfWorker] Gerando "${tipo}" (job ${job.id})`)

    switch (tipo) {
      case 'comprovante': {
        if (!inscricaoId) throw new Error('inscricaoId obrigatório para comprovante')
        const { generateComprovante } = await import('@/lib/pdf/comprovante')
        const { prisma } = await import('@/lib/db')

        const inscricao = await prisma.inscricao.findUnique({
          where: { id: inscricaoId },
          include: {
            proponente: { select: { nome: true, cpfCnpj: true, email: true, tipoProponente: true } },
            edital: { select: { titulo: true, ano: true } },
          },
        })

        if (!inscricao) throw new Error(`Inscrição ${inscricaoId} não encontrada`)

        await generateComprovante({
          numero: inscricao.numero,
          proponente: {
            nome: inscricao.proponente.nome,
            cpfCnpj: inscricao.proponente.cpfCnpj ?? '',
            email: inscricao.proponente.email,
            tipoProponente: inscricao.proponente.tipoProponente ?? 'PF',
          },
          edital: inscricao.edital,
          categoria: inscricao.categoria,
          submittedAt: inscricao.submittedAt ?? inscricao.createdAt,
          campos: inscricao.campos as Record<string, unknown>,
        })
        break
      }

      case 'lista_resultado': {
        if (!editalId) throw new Error('editalId obrigatório para lista de resultado')
        console.log(`[PdfWorker] Lista de resultado para edital ${editalId}`)
        break
      }

      case 'declaracao': {
        if (!inscricaoId) throw new Error('inscricaoId obrigatório para declaração')
        console.log(`[PdfWorker] Declaração para inscrição ${inscricaoId}`)
        break
      }

      default:
        throw new Error(`Tipo de PDF desconhecido: ${tipo}`)
    }

    console.log(`[PdfWorker] PDF gerado com sucesso (job ${job.id})`)
  },
  {
    connection: redis,
    concurrency: 2,
  },
)

pdfWorker.on('failed', (job, err) => {
  console.error(`[PdfWorker] Job ${job?.id} falhou:`, err.message)
})

pdfWorker.on('completed', (job) => {
  console.log(`[PdfWorker] Job ${job.id} concluído`)
})
