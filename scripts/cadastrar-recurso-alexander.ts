import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando cadastro do recurso e proponente no banco de dados...')

  const edital = await prisma.edital.findUnique({
    where: { slug: 'festival-arte-cultura-irece-centenario-2026' },
    select: { id: true, titulo: true },
  })

  if (!edital) {
    throw new Error('Edital Festival de Arte e Cultura não encontrado.')
  }

  // 1. Cadastrar ou obter proponente Alexander Gondim Barretto
  const cpfAlexander = '05849484507'
  let userAlexander = await prisma.user.findFirst({
    where: { cpfCnpj: cpfAlexander },
  })

  if (!userAlexander) {
    const hashedPassword = await bcrypt.hash('Pnab@2026', 10)
    userAlexander = await prisma.user.create({
      data: {
        nome: 'Alexander Gondim Barretto',
        email: 'alexander.barretto@cultura.irece.ba.gov.br',
        cpfCnpj: cpfAlexander,
        password: hashedPassword,
        role: 'PROPONENTE',
        tipoProponente: 'PF',
        cidade: 'Irecê',
        uf: 'BA',
        ativo: true,
      },
    })
    console.log(`Usuário Alexander criado com id: ${userAlexander.id}`)
  } else {
    console.log(`Usuário Alexander já existe com id: ${userAlexander.id}`)
  }

  // 2. Cadastrar ou atualizar Inscrição PNAB-2026-0024
  let inscricaoAlexander = await prisma.inscricao.findUnique({
    where: { numero: 'PNAB-2026-0024' },
  })

  if (!inscricaoAlexander) {
    inscricaoAlexander = await prisma.inscricao.create({
      data: {
        numero: 'PNAB-2026-0024',
        editalId: edital.id,
        proponenteId: userAlexander.id,
        categoria: 'Audiovisual/Cinema',
        status: 'HABILITADA',
        posicao: 2,
        notaFinal: 87.50,
        notaBonus: 0.00,
        cotasOptIn: [],
        motivoInabilitacao: null,
        campos: {
          nome_proponente: 'Alexander Gondim Barretto',
          titulo_projeto: 'O Amuleto: 100 anos de Histórias e Afeto.',
          categoria: 'Audiovisual/Cinema',
          resumo: 'Projeto audiovisual participante do Edital Festival de Arte e Cultura de Irecê.',
        },
        resultadoLiberadoEm: new Date('2026-10-06T10:31:00.000Z'),
        submittedAt: new Date('2026-08-20T14:00:00.000Z'),
      },
    })
    console.log(`Inscrição PNAB-2026-0024 criada com id: ${inscricaoAlexander.id}`)
  } else {
    inscricaoAlexander = await prisma.inscricao.update({
      where: { id: inscricaoAlexander.id },
      data: {
        status: 'HABILITADA',
        motivoInabilitacao: null,
        resultadoLiberadoEm: new Date('2026-10-06T10:31:00.000Z'),
      },
    })
    console.log(`Inscrição PNAB-2026-0024 atualizada para HABILITADA.`)
  }

  // 3. Cadastrar Recurso de Habilitação
  const recursoExistente = await prisma.recurso.findFirst({
    where: {
      inscricaoId: inscricaoAlexander.id,
      fase: 'HABILITACAO',
    },
  })

  const pdfUrl = '/documentos/recurso-habilitacao_PNAB-2026-0024_alexander-gondim-barretto.pdf'
  const imgUrl = '/documentos/recurso-habilitacao_PNAB-2026-0024_comprovante-fisico.jpeg'

  if (!recursoExistente) {
    const recurso = await prisma.recurso.create({
      data: {
        inscricaoId: inscricaoAlexander.id,
        fase: 'HABILITACAO',
        texto: 'Aguardando a emissão da certidão Federal, que infelizmente foi emitida um dia após o prazo final da entrega. A mesma se encontra anexo a esta interposição.',
        urlAnexos: [pdfUrl, imgUrl],
        decisao: 'DEFERIDO',
        justificativa: 'Recurso tempestivo conhecido e deferido. Apresentação de recurso com regularização e entrega da Certidão Negativa de Débitos Federais. Proponente considerado HABILITADO.',
        decididoPor: 'ADMIN',
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
        decidedAt: new Date('2026-10-06T10:31:00.000Z'),
      },
    })
    console.log(`Recurso cadastrado com sucesso: ${recurso.id}`)
  } else {
    await prisma.recurso.update({
      where: { id: recursoExistente.id },
      data: {
        texto: 'Aguardando a emissão da certidão Federal, que infelizmente foi emitida um dia após o prazo final da entrega. A mesma se encontra anexo a esta interposição.',
        urlAnexos: [pdfUrl, imgUrl],
        decisao: 'DEFERIDO',
        justificativa: 'Recurso tempestivo conhecido e deferido. Apresentação de recurso com regularização e entrega da Certidão Negativa de Débitos Federais. Proponente considerado HABILITADO.',
        decididoPor: 'ADMIN',
        decidedAt: new Date('2026-10-06T10:31:00.000Z'),
      },
    })
    console.log(`Recurso existente atualizado para DEFERIDO: ${recursoExistente.id}`)
  }

  // 4. Cadastrar Anexo da Inscrição
  const anexoExistente = await prisma.anexoInscricao.findFirst({
    where: {
      inscricaoId: inscricaoAlexander.id,
      tipo: 'RECURSO_HABILITACAO',
    },
  })

  if (!anexoExistente) {
    await prisma.anexoInscricao.create({
      data: {
        inscricaoId: inscricaoAlexander.id,
        tipo: 'RECURSO_HABILITACAO',
        titulo: 'Formulário de Interposição de Recurso (Anexo XI) - Habilitação',
        url: pdfUrl,
        valido: true,
        observacao: 'Documento protocolado em 02/10/2026 na Secretaria de Cultura e deferido em 06/10/2026.',
      },
    })
    console.log('Anexo da inscrição cadastrado.')
  }

  // 5. Cadastrar ou atualizar Grupo de Capoeira Araúna (PNAB-2026-0110)
  const cpfArauna = '10763778583'
  let userArauna = await prisma.user.findFirst({
    where: { cpfCnpj: cpfArauna },
  })

  if (!userArauna) {
    const hashedPassword = await bcrypt.hash('Pnab@2026', 10)
    userArauna = await prisma.user.create({
      data: {
        nome: 'Grupo de Capoeira Araúna',
        email: 'capoeira.arauna@cultura.irece.ba.gov.br',
        cpfCnpj: cpfArauna,
        password: hashedPassword,
        role: 'PROPONENTE',
        tipoProponente: 'COLETIVO',
        cidade: 'Irecê',
        uf: 'BA',
        ativo: true,
      },
    })
  }

  let inscricaoArauna = await prisma.inscricao.findUnique({
    where: { numero: 'PNAB-2026-0110' },
  })

  if (!inscricaoArauna) {
    await prisma.inscricao.create({
      data: {
        numero: 'PNAB-2026-0110',
        editalId: edital.id,
        proponenteId: userArauna.id,
        categoria: 'Cultura Popular',
        status: 'INABILITADA',
        posicao: 2,
        notaFinal: 87.83,
        notaBonus: 5.00,
        cotasOptIn: ['negros'],
        motivoInabilitacao: 'Desclassificado pela não apresentação de recurso',
        campos: {
          nome_proponente: 'Grupo de Capoeira Araúna',
          titulo_projeto: 'Capoeira Araúna',
          categoria: 'Cultura Popular',
        },
        resultadoLiberadoEm: new Date('2026-10-06T10:27:00.000Z'),
      },
    })
    console.log('Inscrição PNAB-2026-0110 cadastrada como INABILITADA (Desclassificado).')
  } else {
    await prisma.inscricao.update({
      where: { id: inscricaoArauna.id },
      data: {
        status: 'INABILITADA',
        motivoInabilitacao: 'Desclassificado pela não apresentação de recurso',
      },
    })
    console.log('Inscrição PNAB-2026-0110 atualizada como Desclassificada.')
  }

  console.log('Operação concluída com sucesso no banco de dados!')
}

main()
  .catch((err) => {
    console.error('Erro ao cadastrar no banco:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
